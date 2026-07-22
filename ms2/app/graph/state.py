"""
graph/state.py — Ephemeral LangGraph conversation state.

This TypedDict is used ONLY during one LangGraph execution turn.
Persistent data (conversation history, selected shop, draft order) lives
in the SessionStore between turns, not here.

What this state carries:
  - Session identifiers (session_id, salesman_id, auth_token)
  - Current input (transcript, reply_language)
  - Business context cache (loaded from session store, passed through graph)
  - Output fields (message_en, message_local, response_status, draft_order)
  - Internal reference to session_store (for agent_node to update memory)
"""

from typing import TypedDict, Optional, Any


class VoiceOrderState(TypedDict):

    # ── Session Identifiers ─────────────────────────────────────────────────
    session_id:   str
    salesman_id:  str
    auth_token:   Optional[str]          # Salesman's JWT forwarded from MS1

    # ── Current Input ───────────────────────────────────────────────────────
    transcript:     str                  # Voice transcript or text reply this turn
    reply_language: str                  # 'hinglish' | 'english' | 'hindi' | 'bengali' | 'marathi'

    # ── Business Context Cache ──────────────────────────────────────────────
    # Loaded from session store at start of turn. Passed through graph.
    # Refreshed from MS1 /internal/context if empty.
    shops_cache:    list[dict[str, Any]]
    products_cache: list[dict[str, Any]]

    # ── Conversation History (ephemeral — loaded from session store) ────────
    conversation_history: list[dict[str, str]]   # [{ role, content }]

    # ── Output ──────────────────────────────────────────────────────────────
    message_en:      Optional[str]       # AI response in English
    message_local:   Optional[str]       # AI response in reply_language
    response_status: str                 # 'clarifying' | 'confirming' | 'completed' | 'cancelled' | 'failed'
    last_tool:       Optional[str]       # Tool name selected this turn
    draft_order:     Optional[dict[str, Any]]     # Draft order for preview
    api_response:    Optional[dict[str, Any]]     # MS1 response after order creation

    # ── Internal Reference ──────────────────────────────────────────────────
    # Reference to the SessionStore instance — passed by conversation.py
    # so agent_node can update session memory without a global
    _session_store: Optional[Any]


def initial_state(
    session_id: str,
    salesman_id: str,
    transcript: str,
    reply_language: str = "hinglish",
    auth_token: Optional[str] = None,
    shops_cache: Optional[list] = None,
    products_cache: Optional[list] = None,
    conversation_history: Optional[list] = None,
    draft_order: Optional[dict] = None,
    session_store: Optional[Any] = None,
) -> VoiceOrderState:
    """
    Build a fresh VoiceOrderState for one LangGraph execution turn.

    Called by conversation.py endpoints before each graph.ainvoke().
    The session store provides the persistent data; this state is ephemeral.
    """
    return VoiceOrderState(
        session_id=session_id,
        salesman_id=salesman_id,
        auth_token=auth_token,
        transcript=transcript,
        reply_language=reply_language,
        shops_cache=shops_cache or [],
        products_cache=products_cache or [],
        conversation_history=conversation_history or [],
        message_en=None,
        message_local=None,
        response_status="clarifying",
        last_tool=None,
        draft_order=draft_order,
        api_response=None,
        _session_store=session_store,
    )