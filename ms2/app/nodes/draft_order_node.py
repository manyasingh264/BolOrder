"""
draft_order_node — Node 5 of the LangGraph pipeline.

Responsibility:
    Build a human-readable order summary from shop_data + matched_products.
    Store it as draft_order so confirmation_node can use it.
    Set tts_message to the summary text (gTTS will convert it to audio).
    Set response_status to "confirming" — the graph pauses here for yes/no.

When it runs:
    shop_id is set AND matched_products is non-empty AND draft_order is None.

When skipped:
    draft_order is already set (e.g., user is re-confirming).
"""

from app.graph.state import VoiceOrderState
from app.prompts.summary import build_order_summary
from app.utils.logger import get_logger

logger = get_logger(__name__)


def draft_order_node(state: VoiceOrderState) -> dict:
    """
    Build the draft order and generate the spoken summary.

    Reads:  shop_data, shop_id, matched_products, language
    Writes: draft_order, tts_message, response_status, clarification_field
    """
    # Skip if draft already built
    if state.get("draft_order"):
        logger.info("draft_order_node: skipping — draft already exists")
        return {}

    shop_data = state.get("shop_data", {})
    shop_id   = state.get("shop_id")
    products  = state.get("matched_products", [])
    language  = state.get("language", "hi")

    shop_name = shop_data.get("shopName", "Unknown Shop")

    # Build the draft order (what will be sent to MS1 on confirmation)
    draft = {
        "shopId":    shop_id,
        "shopName":  shop_name,
        "items": [
            {
                "productVariantId": p["productVariantId"],
                "quantity":         p["quantity"],
                "product_name":     p.get("product_name", ""),
                "variant_description": p.get("variant_description", ""),
                "unit":             p.get("unit", "packet"),
            }
            for p in products
        ],
    }

    # Build spoken summary for TTS
    summary = build_order_summary(
        shop_name=shop_name,
        items=draft["items"],
        language=language,
    )

    logger.info(
        f"draft_order_node: draft built | shop='{shop_name}' | "
        f"items={len(draft['items'])}"
    )

    return {
        "draft_order":       draft,
        "tts_message":       summary,
        "response_status":   "confirming",    # Pauses graph — wait for yes/no
        "clarification_field": "confirmation",
    }
