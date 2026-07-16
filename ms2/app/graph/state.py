"""
VoiceOrderState — LangGraph conversation state.

This TypedDict is the single source of truth for the entire
voice order conversation. It flows through every node in the graph.

Design principles:
- Each node reads what it needs, writes only what it owns.
- Optional fields use None as "not yet set" sentinel.
- Nodes NEVER mutate fields owned by other nodes.
- All dict fields carry typed data (aligned with schemas).

Node ownership:
    extract_order_node  → extracted_shop_name, extracted_products, language
    shop_lookup_node    → shop_id, shop_data, shop_not_found
    retry_shop_node     → retry_count, shop_not_found
    collect_shop_info   → pending_shop_info, is_new_shop
    product_lookup_node → matched_products
    clarification_node  → clarification_question, clarification_field
    draft_order_node    → draft_order
    confirmation_node   → confirmation_status
    create_order_node   → api_response, tts_message, response_status
"""

from typing import TypedDict, Optional, Any


class VoiceOrderState(TypedDict):

    # ── Session ────────────────────────────────────────────────
    session_id: str
    salesman_id: str
    auth_token: Optional[str]           # Bearer token forwarded to MS1

    # ── Input ──────────────────────────────────────────────────
    transcript: str                     # Current turn's voice → text
    language: str                       # Detected: "en" | "hi"
    turn: int                           # Conversation turn count (starts at 1)

    # ── Conversation History ───────────────────────────────────
    conversation_history: list[dict[str, str]]   # [{ role, content }]

    # ── Extraction (LLM output) ────────────────────────────────
    extracted_shop_name: Optional[str]
    extracted_products: list[dict[str, Any]]     # list[ExtractedProduct dicts]

    # ── Shop Resolution ────────────────────────────────────────
    shop_id: Optional[str]                       # UUID — set after shop found/created
    shop_data: Optional[dict[str, Any]]          # Full ShopResponse dict
    shop_not_found: bool                         # True after MS1 search returns empty
    retry_count: int                             # Number of shop search retries
    is_new_shop: Optional[bool]                  # True if user confirms new shop
    pending_shop_info: dict[str, Any]            # PendingShopInfo dict (collected turn by turn)

    # ── Product Resolution ─────────────────────────────────────
    matched_products: list[dict[str, Any]]       # list[MatchedProduct dicts]

    # ── Clarification ──────────────────────────────────────────
    clarification_required: bool
    clarification_question: Optional[str]        # Question shown/spoken to user
    clarification_field: Optional[str]           # "shop" | "product" | "quantity"

    # ── Draft Order ────────────────────────────────────────────
    draft_order: Optional[dict[str, Any]]        # DraftOrder dict

    # ── Confirmation ───────────────────────────────────────────
    confirmation_status: Optional[str]           # "pending" | "confirmed" | "rejected"

    # ── MS1 Response ───────────────────────────────────────────
    api_response: Optional[dict[str, Any]]       # MS1 response after order creation

    # ── Output ─────────────────────────────────────────────────
    tts_message: Optional[str]                   # Text that will be converted to audio
    response_status: str                         # ConversationStatus constant


def initial_state(
    session_id: str,
    transcript: str,
    salesman_id: str,
    auth_token: Optional[str] = None,
) -> VoiceOrderState:
    """
    Factory function — creates a clean initial state for a new conversation.
    Use this whenever a session_id is not found in the session store.
    """
    return VoiceOrderState(
        # Session
        session_id=session_id,
        salesman_id=salesman_id,
        auth_token=auth_token,

        # Input
        transcript=transcript,
        language="hi",              # Default — overwritten by Whisper detection
        turn=1,

        # Conversation
        conversation_history=[],

        # Extraction
        extracted_shop_name=None,
        extracted_products=[],

        # Shop
        shop_id=None,
        shop_data=None,
        shop_not_found=False,
        retry_count=0,
        is_new_shop=None,
        pending_shop_info={},

        # Products
        matched_products=[],

        # Clarification
        clarification_required=False,
        clarification_question=None,
        clarification_field=None,

        # Draft
        draft_order=None,

        # Confirmation
        confirmation_status=None,

        # MS1
        api_response=None,

        # Output
        tts_message=None,
        response_status="clarifying",
    )