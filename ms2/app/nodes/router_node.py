"""
router_node — pure state-machine step BEFORE the LLM is called.
Handles yes/no replies to confirm_order and create_shop_request, and the
passcode step, without spending an LLM call. Sets state["_next"] to tell
the graph's conditional edge where to go.
"""

from app.graph.state import VoiceOrderState
from app.nodes.confirmation_node import YES_KEYWORDS, NO_KEYWORDS
from app.services.ms1_client import MS1Client, MS1ClientError
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _intent(transcript: str) -> str:
    tokens = set(transcript.lower().split())
    if tokens & YES_KEYWORDS:
        return "confirmed"
    if tokens & NO_KEYWORDS:
        return "rejected"
    return "unknown"


async def router_node(state: VoiceOrderState) -> dict:
    status = state.get("response_status")
    transcript = state.get("transcript", "")
    language = state.get("reply_language", "hinglish")

    # ── Turn 1 (nothing resolved yet) → straight to the agent ──────
    if status not in ("confirming", "awaiting_shop_confirm", "awaiting_passcode"):
        return {"_next": "agent_node"}

    intent = _intent(transcript)

    # ── Confirming a resolved order ─────────────────────────────────
    if status == "confirming":
        if intent == "confirmed":
            return {"_next": "create_order_node"}
        if intent == "rejected":
            return {
                "response_status": "cancelled",
                "message_en": "Understood, order cancelled.",
                "message_local": "Theek hai, order cancel kar diya.",
                "_next": "end",
            }
        return {
            "message_en": "Sorry, please say Yes to confirm or No to cancel.",
            "message_local": "Kripya 'Haan' ya 'Nahi' boliye.",
            "_next": "end",
        }

    # ── Confirming whether to create a new shop ─────────────────────
    if status == "awaiting_shop_confirm":
        if intent == "confirmed":
            return {
                "response_status": "awaiting_passcode",
                "message_en": "Please share the admin passcode to create this shop.",
                "message_local": "Naya shop banane ke liye admin passcode bataiye.",
                "_next": "end",
            }
        if intent == "rejected":
            return {
                "pending_shop_name": None,
                "response_status": "clarifying",
                "_next": "agent_node",
            }
        return {
            "message_en": "Should I create this as a new shop? Please say Yes or No.",
            "message_local": "Kya main naya shop bana doon? Haan ya Nahi boliye.",
            "_next": "end",
        }

    # ── Passcode step (no LLM — this transcript IS the passcode) ────
    if status == "awaiting_passcode":
        passcode = transcript.strip()
        shop_name = state.get("pending_shop_name")
        auth_token = state.get("auth_token")
        try:
            async with MS1Client(auth_token=auth_token) as client:
                new_shop = await client.create_shop_via_voice(shop_name, passcode)
            shops = state.get("shops_cache", []) + [new_shop]
            return {
                "shops_cache": shops,
                "pending_shop_name": None,
                "response_status": "clarifying",
                "_next": "agent_node",
            }
        except MS1ClientError as e:
            logger.warning(f"router_node: shop creation failed — {e.detail}")
            return {
                "message_en": "That passcode isn't right. Ask your supervisor and try again.",
                "message_local": "Passcode galat hai. Supervisor se puchhkar dobara boliye.",
                "_next": "end",
            }

    return {"_next": "agent_node"}