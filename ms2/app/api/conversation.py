"""
conversation.py — The 4 conversation API endpoints.

Endpoints:
    POST   /api/v1/conversation/start          — Start a new session
    POST   /api/v1/conversation/audio          — Send audio, get AI response
    POST   /api/v1/conversation/reply          — Send text reply (clarification/confirmation)
    DELETE /api/v1/conversation/{session_id}   — End session early

Flow per turn:
    1. Load state from session store (or create fresh state for first turn).
    2. Pre-process the input (update transcript, handle clarification reply).
    3. Run the LangGraph with the updated state (ainvoke).
    4. Save the new state back to session store.
    5. Generate TTS audio from tts_message.
    6. Return JSON response to React.
    7. If response_status is "completed" or "cancelled": delete session.
"""

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form

from app.graph.state import VoiceOrderState, initial_state
from app.prompts.clarification import general_clarification_message
from app.services.tts_service import TextToSpeechService
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/conversation", tags=["Conversation"])

tts = TextToSpeechService()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session_store(request: Request):
    return request.app.state.session_store


def _get_speech_service(request: Request):
    return request.app.state.speech_service


def _get_graph(request: Request):
    return request.app.state.graph


def _build_response(state: VoiceOrderState) -> dict:
    """
    Build the standard JSON response from the final graph state.
    React uses response_status to decide next action.
    """
    language     = state.get("language", "hi")
    tts_text     = state.get("tts_message", "")
    audio_b64    = tts.synthesize(tts_text, language) if tts_text else ""

    return {
        "sessionId":     state.get("session_id"),
        "status":        state.get("response_status", "clarifying"),
        "message":       tts_text,
        "audio_base64":  audio_b64,
        "clarification_field": state.get("clarification_field"),
        "draft_order":   state.get("draft_order"),
        "order":         state.get("api_response"),
    }


def _pre_process_reply(state: dict, reply_text: str) -> dict:
    """
    Update the state before re-running the graph on a user reply turn.

    Based on clarification_field, we update the relevant state fields
    so the nodes know what changed. Then we re-run the graph from START.
    """
    field = state.get("clarification_field", "entity")
    state["transcript"] = reply_text
    state["turn"]       = state.get("turn", 1) + 1

    # Add this reply to conversation history
    history = state.get("conversation_history", [])
    history.append({"role": "user", "content": reply_text})
    state["conversation_history"] = history

    if field == "shop":
        # User gave the shop name again — clear old result and retry
        state["extracted_shop_name"] = None
        state["shop_not_found"]      = False
        # Don't clear retry_count — we need to track it for "create new shop" logic
        # Don't clear extracted_products - extract_entity_node will preserve them
        logger.info(f"_pre_process_reply: shop clarification - preserving extracted_products: {state.get('extracted_products')}")
    
    elif field == "shop_confirm":
        # User is answering yes/no to shop confirmation
        # Don't re-extract shop name from "nahi" - let shop_lookup_node handle the response
        state["extracted_shop_name"] = None  # Clear to prevent re-matching
        logger.info(f"_pre_process_reply: shop_confirm - clearing extracted_shop_name to prevent re-matching")

    elif field == "product" or field == "product_variant" or field == "product_quantity":
        # User corrected a product — re-extract from the full reply
        state["extracted_products"]  = []
        state["matched_products"]    = []
        state["clarification_required"] = False

    elif field == "entity":
        # Completely re-extract
        state["extracted_shop_name"] = None
        state["extracted_products"]  = []
        state["shop_not_found"]      = False
        state["matched_products"]    = []

    elif field == "confirmation":
        # User is answering yes/no — keep draft, just update transcript
        pass  # confirmation_node will process state["transcript"]

    # Clear clarification state — will be set again by nodes if still needed
    state["clarification_required"]  = False
    state["clarification_question"]  = None
    # Don't clear clarification_field for shop or shop_confirm - nodes need it
    if field not in ("shop", "shop_confirm"):
        state["clarification_field"]     = None
    state["tts_message"]             = None

    return state


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/start", summary="Start a new voice order conversation")
async def start_conversation(request: Request):
    """
    Create a new session and return its session_id.
    React must store this session_id and send it with every subsequent request.

    Returns:
        { sessionId: str, message: str }
    """
    session_id    = str(uuid.uuid4())
    session_store = _get_session_store(request)

    # Store a placeholder so the session exists before the first audio arrives
    session_store.set(session_id, {"session_id": session_id})

    logger.info(f"Conversation started | session={session_id[:8]}...")
    return {
        "sessionId": session_id,
        "message":   "Session started. Please send your voice order.",
    }


@router.post("/audio", summary="Send audio — transcribe and process through AI pipeline")
async def send_audio(
    request:    Request,
    session_id: str = Form(..., description="Session ID from /conversation/start"),
    audio:      UploadFile = File(..., description="Audio file (wav, mp3, webm, m4a)"),
    auth_token: str = Form(..., description="Salesman's Bearer token from MS1 login"),
    salesman_id: str = Form(..., description="Salesman's UUID from MS1"),
):
    """
    Receive audio, transcribe with Whisper, run LangGraph pipeline.

    Multi-turn: If session already has state (e.g., answering a clarification
    with a new audio), the graph continues from where it left off.

    Returns standard conversation response with TTS audio.
    """
    session_store  = _get_session_store(request)
    speech_service = _get_speech_service(request)
    graph          = _get_graph(request)

    # ── 1. Validate session ───────────────────────────────────────
    existing_state = session_store.get(session_id)
    if existing_state is None:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    # ── 2. Save audio to temp file ────────────────────────────────
    temp_path = f"temp/{session_id}_{audio.filename}"
    os.makedirs("temp", exist_ok=True)
    try:
        content = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        # ── 3. Transcribe with Whisper ─────────────────────────────
        transcript, language = speech_service.transcribe(temp_path)
        logger.info(f"Transcription | session={session_id[:8]} | lang={language} | '{transcript[:60]}'")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    if not transcript.strip():
        lang = existing_state.get("language", "hi")
        msg  = general_clarification_message(lang)
        return {
            "sessionId":    session_id,
            "status":       "clarifying",
            "message":      msg,
            "audio_base64": tts.synthesize(msg, lang),
            "clarification_field": "entity",
            "draft_order":  None,
            "order":        None,
        }

    # ── 4. Build or update state ───────────────────────────────────
    logger.info(f"Existing state check - shop_id={existing_state.get('shop_id')}, extracted_shop_name={existing_state.get('extracted_shop_name')}, extracted_products={existing_state.get('extracted_products')}, clarification_field={existing_state.get('clarification_field')}")
    
    if existing_state.get("shop_id") or existing_state.get("extracted_shop_name") or existing_state.get("clarification_field"):
        # Continuing session — pre-process as a reply
        state = _pre_process_reply(dict(existing_state), transcript)
        state["language"] = language  # Update language from new audio
        logger.info(f"After pre-process - extracted_products={state.get('extracted_products')}")
    else:
        # First audio turn — create fresh state
        state = initial_state(
            session_id=session_id,
            transcript=transcript,
            salesman_id=salesman_id,
            auth_token=auth_token,
        )
        state["language"] = language

    # ── 5. Run LangGraph ───────────────────────────────────────────
    result_state: VoiceOrderState = await graph.ainvoke(state)

    # ── 6. Save state & respond ────────────────────────────────────
    response_status = result_state.get("response_status", "clarifying")

    if response_status in ("completed", "cancelled", "failed"):
        session_store.delete(session_id)
        logger.info(f"Session {session_id[:8]}... ended with status: {response_status}")
    else:
        session_store.set(session_id, dict(result_state))

    return _build_response(result_state)


@router.post("/reply", summary="Send text reply (for clarification or confirmation)")
async def send_reply(
    request:    Request,
    session_id: str = Form(..., description="Session ID"),
    reply:      str = Form(..., description="The salesman's text reply"),
    auth_token: str = Form(..., description="Salesman's Bearer token"),
):
    """
    Send a text reply to a clarification question or order summary.
    Used when the salesman types instead of speaking, or when the frontend
    captures voice → text locally and sends the text.

    Typical usage:
        - Answering a shop clarification: "Sharma General Store"
        - Confirming an order: "Haan" / "Yes"
        - Cancelling: "Nahi" / "No"
    """
    session_store = _get_session_store(request)
    graph         = _get_graph(request)

    existing_state = session_store.get(session_id)
    if existing_state is None:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    # ── Pre-process the reply based on current clarification_field ─
    state = _pre_process_reply(dict(existing_state), reply)
    state["auth_token"] = auth_token   # Refresh token in case of re-use

    # ── Run LangGraph ──────────────────────────────────────────────
    result_state: VoiceOrderState = await graph.ainvoke(state)

    # ── Save or delete session ─────────────────────────────────────
    response_status = result_state.get("response_status", "clarifying")

    if response_status in ("completed", "cancelled", "failed"):
        session_store.delete(session_id)
    else:
        session_store.set(session_id, dict(result_state))

    return _build_response(result_state)


@router.delete("/{session_id}", summary="End a conversation session early")
async def end_conversation(session_id: str, request: Request):
    """
    Explicitly delete a session (e.g., user closes the order window).
    React should call this when the user navigates away.
    """
    session_store = _get_session_store(request)
    session_store.delete(session_id)
    logger.info(f"Session {session_id[:8]}... deleted by client request.")
    return {"message": "Session ended.", "sessionId": session_id}
