"""
conversation.py — Voice order conversation API endpoints.

Endpoints:
    POST   /api/v1/conversation/start          — Create session
    POST   /api/v1/conversation/audio          — Send audio, get AI response
    POST   /api/v1/conversation/reply          — Send text reply (clarification/confirmation)
    DELETE /api/v1/conversation/{session_id}   — End session

Architecture per turn (audio and reply):
    1. Validate session exists in store
    2. Load session memory (selected_shop, draft_order, conversation history)
    3. Load business context cache (shops, products)
    4. Build ephemeral VoiceOrderState for this turn
    5. Run LangGraph (agent_node → tool selection → tool execution)
    6. Update session memory in store (done inside agent_node)
    7. Delete session if terminal status (completed / cancelled / failed)
    8. Return JSON response to MS1 → Frontend

Response shape (stable for frontend compatibility):
    {
        "sessionId":    "...",
        "status":       "clarifying | confirming | completed | cancelled | failed",
        "message_en":   "...",
        "message_local": "...",
        "language":     "hinglish",
        "draft_order":  {...} or null,
        "order":        {...} or null
    }
"""

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form

from app.graph.state import VoiceOrderState, initial_state
from app.middleware.service_auth import verify_service_key
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/conversation", tags=["Conversation"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _store(request: Request):
    return request.app.state.session_store


def _speech(request: Request):
    return request.app.state.speech_service


def _graph(request: Request):
    return request.app.state.graph


def _build_response(result_state: VoiceOrderState, session_id: str) -> dict:
    """Build the standard JSON response from final graph state."""
    return {
        "sessionId":     session_id,
        "status":        result_state.get("response_status", "clarifying"),
        "message_en":    result_state.get("message_en") or "",
        "message_local": result_state.get("message_local") or "",
        "language":      result_state.get("reply_language", "hinglish"),
        "draft_order":   result_state.get("draft_order"),
        "order":         result_state.get("api_response"),
    }


def _build_state_from_session(
    session_id: str,
    salesman_id: str,
    auth_token: str,
    transcript: str,
    reply_language: str,
    session_store,
) -> VoiceOrderState:
    """
    Load session data from store and build ephemeral VoiceOrderState for one turn.
    """
    session_data = session_store.get(session_id)

    shops    = []
    products = []
    draft    = None
    history  = []

    if session_data:
        cache    = session_data.get("business_cache", {})
        memory   = session_data.get("memory", {})
        shops    = cache.get("shops", [])
        products = cache.get("products", [])
        draft    = memory.get("draft_order")
        # Convert recent_messages to simple history format for LLM
        history  = [
            {"role": m["role"], "content": m["content"]}
            for m in memory.get("recent_messages", [])
        ]

    return initial_state(
        session_id=session_id,
        salesman_id=salesman_id,
        transcript=transcript,
        reply_language=reply_language,
        auth_token=auth_token,
        shops_cache=shops,
        products_cache=products,
        conversation_history=history,
        draft_order=draft,
        session_store=session_store,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start", summary="Start a new voice order conversation",
             dependencies=[Depends(verify_service_key)])
async def start_conversation(
    request: Request,
    salesman_id:    str = Form(..., description="Salesman UUID from MS1 JWT"),
    reply_language: str = Form("hinglish", description="Preferred language"),
):
    """
    Create a new session and return the session_id.
    MS1 stores this and sends it with every subsequent request.

    Returns:
        { sessionId, message }
    """
    session_id    = str(uuid.uuid4())
    session_store = _store(request)

    session_store.create(
        session_id=session_id,
        salesman_id=salesman_id,
        language=reply_language,
    )

    logger.info(f"Session started | id={session_id[:8]} | salesman={salesman_id[:8]}")
    return {
        "sessionId": session_id,
        "message":   "Session started. Please send your voice order.",
        "message_local": _greeting(reply_language),
    }


@router.post("/audio", summary="Send voice audio — transcribe and process",
             dependencies=[Depends(verify_service_key)])
async def send_audio(
    request:        Request,
    session_id:     str       = Form(...),
    audio:          UploadFile = File(..., description="Audio file (webm, wav, mp3, m4a)"),
    auth_token:     str       = Form(..., description="Salesman JWT from MS1 login"),
    salesman_id:    str       = Form(..., description="Salesman UUID"),
    reply_language: str       = Form("hinglish"),
):
    """
    Receive audio → transcribe with Whisper → run one LangGraph turn → respond.
    """
    session_store  = _store(request)
    speech_service = _speech(request)
    graph          = _graph(request)

    # ── 1. Validate session ───────────────────────────────────────────────────
    if not session_store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    # ── 2. Transcribe audio ───────────────────────────────────────────────────
    temp_path = f"temp/{session_id}_{audio.filename}"
    os.makedirs("temp", exist_ok=True)
    try:
        content = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        transcript, detected_lang = speech_service.transcribe(temp_path)
        logger.info(f"Transcribed | session={session_id[:8]} | lang={detected_lang} | '{transcript[:60]}'")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # ── 3. Handle empty/garbled transcript ───────────────────────────────────
    if not transcript.strip():
        return {
            "sessionId":     session_id,
            "status":        "clarifying",
            "message_en":    "Sorry, I couldn't hear that clearly. Please try again.",
            "message_local": "Maaf kijiye, sunayi nahi diya. Dobara boliye.",
            "language":      reply_language,
            "draft_order":   None,
            "order":         None,
        }

    # ── 4. Build state and run graph ──────────────────────────────────────────
    state = _build_state_from_session(
        session_id=session_id,
        salesman_id=salesman_id,
        auth_token=auth_token,
        transcript=transcript,
        reply_language=reply_language,
        session_store=session_store,
    )

    result_state: VoiceOrderState = await graph.ainvoke(state)

    # ── 5. Delete session if terminal ─────────────────────────────────────────
    status = result_state.get("response_status", "clarifying")
    if status in ("completed", "cancelled", "failed"):
        session_store.delete(session_id)
        logger.info(f"Session ended | id={session_id[:8]} | status={status}")

    return _build_response(result_state, session_id)


@router.post("/reply", summary="Send text reply for clarification or confirmation",
             dependencies=[Depends(verify_service_key)])
async def send_reply(
    request:        Request,
    session_id:     str = Form(...),
    reply:          str = Form(..., description="Salesman's text reply"),
    auth_token:     str = Form(...),
    salesman_id:    str = Form(...),
    reply_language: str = Form("hinglish"),
):
    """
    Send a text reply (clarification answer, confirmation yes/no, shop choice).
    Used when frontend captures voice-to-text or salesman types a response.
    """
    session_store = _store(request)
    graph         = _graph(request)

    # ── 1. Validate session ───────────────────────────────────────────────────
    if not session_store.exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    # ── 2. Build state and run graph ──────────────────────────────────────────
    state = _build_state_from_session(
        session_id=session_id,
        salesman_id=salesman_id,
        auth_token=auth_token,
        transcript=reply,
        reply_language=reply_language,
        session_store=session_store,
    )

    result_state: VoiceOrderState = await graph.ainvoke(state)

    # ── 3. Delete session if terminal ─────────────────────────────────────────
    status = result_state.get("response_status", "clarifying")
    if status in ("completed", "cancelled", "failed"):
        session_store.delete(session_id)
        logger.info(f"Session ended | id={session_id[:8]} | status={status}")

    return _build_response(result_state, session_id)


@router.delete("/{session_id}", summary="End a conversation session early",
               dependencies=[Depends(verify_service_key)])
async def end_conversation(session_id: str, request: Request):
    """
    Explicitly delete a session (user closes voice order window).
    MS1 calls this when the frontend navigates away.
    """
    _store(request).delete(session_id)
    logger.info(f"Session explicitly ended | id={session_id[:8]}")
    return {"message": "Session ended.", "sessionId": session_id}


# ── Private helpers ────────────────────────────────────────────────────────────

def _greeting(language: str) -> str:
    greetings = {
        "hinglish": "Boliye, kaunsi dukaan ke liye order dena hai?",
        "english":  "Please tell me the shop name and your order.",
        "hindi":    "बताइए, किस दुकान के लिए ऑर्डर देना है?",
        "bengali":  "বলুন, কোন দোকানের জন্য অর্ডার দিতে চান?",
        "marathi":  "सांगा, कोणत्या दुकानासाठी ऑर्डर द्यायचा आहे?",
    }
    return greetings.get(language.lower(), greetings["hinglish"])
