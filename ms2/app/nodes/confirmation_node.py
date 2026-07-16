"""
confirmation_node — Node 6 of the LangGraph pipeline.

Responsibility:
    Determine whether the salesman said "yes" (confirm) or "no" (cancel).
    Uses simple keyword matching — no LLM needed for yes/no detection.
    Sets confirmation_status to "confirmed" or "rejected".

This node runs when:
    - clarification_field == "confirmation" (user is answering the summary question)
    - transcript contains the salesman's yes/no reply

Hindi yes words:  haan, ha, yes, bilkul, theek hai, sahi, confirm, ok, okay, right, kar do
Hindi no words:   nahi, na, no, nope, cancel, band karo, mat karo, galat, wrong
"""

from app.graph.state import VoiceOrderState
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Keyword sets ─────────────────────────────────────────────────────────────

YES_KEYWORDS = {
    # Hindi / Hinglish
    "haan", "ha", "han", "bilkul", "theek", "sahi", "karo",
    "bhejo", "place", "confirm", "confirmed",
    # English
    "yes", "yep", "yeah", "ok", "okay", "sure", "correct", "right",
    "absolutely", "proceed",
}

NO_KEYWORDS = {
    # Hindi / Hinglish
    "nahi", "na", "nah", "mat", "band", "galat", "rok", "cancel",
    # English
    "no", "nope", "cancel", "stop", "wrong", "incorrect", "don't",
}


def _detect_intent(transcript: str) -> str:
    """
    Return "confirmed", "rejected", or "unknown" based on the transcript.

    Tokenises by whitespace and checks each word against keyword sets.
    Case-insensitive. Returns the first matched intent.
    """
    tokens = set(transcript.lower().split())

    for word in tokens:
        if word in YES_KEYWORDS:
            return "confirmed"

    for word in tokens:
        if word in NO_KEYWORDS:
            return "rejected"

    return "unknown"


def confirmation_node(state: VoiceOrderState) -> dict:
    """
    Process the salesman's yes/no reply to the order summary.

    Reads:  transcript, language, draft_order
    Writes: confirmation_status, tts_message
    """
    transcript = state.get("transcript", "")
    language   = state.get("language", "hi")
    intent     = _detect_intent(transcript)

    logger.info(
        f"confirmation_node: transcript='{transcript[:50]}' | intent={intent}"
    )

    if intent == "confirmed":
        return {
            "confirmation_status": "confirmed",
            # tts_message will be set by create_order_node after MS1 call
        }

    if intent == "rejected":
        msg = (
            "Theek hai. Order cancel kar diya gaya." if language == "hi"
            else "Understood. The order has been cancelled."
        )
        return {
            "confirmation_status": "rejected",
            "tts_message":         msg,
            "response_status":     "cancelled",
        }

    # Could not detect intent — ask again
    if language == "hi":
        msg = "Mujhe samajh nahi aaya. Kripya 'Haan' ya 'Nahi' bolein."
    else:
        msg = "I didn't catch that. Please say 'Yes' to confirm or 'No' to cancel."

    return {
        "confirmation_status": None,
        "tts_message":         msg,
        "response_status":     "confirming",
    }
