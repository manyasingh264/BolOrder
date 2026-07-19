"""
clarification_node — Node 4 of the LangGraph pipeline.

Responsibility:
    Generate a clarification question for the salesman and set the
    response_status to "clarifying" so the route handler knows to
    pause the graph and wait for the user's reply.

This node is ALWAYS terminal for the current turn — it sets response_status
to "clarifying" and the graph ends. The next turn will resume the graph
from the appropriate node based on clarification_field.

This node is reusable for ALL clarification scenarios:
    - Entity extraction failure ("repeat please")
    - Shop not found ("which shop?")
    - Product not found ("which product?")
    - Variant unclear ("which size?")
    - Quantity missing ("how many?")
"""

from app.config import settings
from app.graph.state import VoiceOrderState
from app.prompts.clarification import (
    general_clarification_message,
    shop_not_found_message,
    shop_not_found_with_options_message,
    shop_confirm_found_message,
    create_new_shop_message,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


def clarification_node(state: VoiceOrderState) -> dict:
    """
    Set up the clarification response for this turn.

    Reads:  clarification_question, clarification_field, language,
            extracted_shop_name, retry_count, proposed_shop
    Writes: tts_message, response_status
    """
    language  = state.get("language", "hi")
    field     = state.get("clarification_field", "entity")
    question  = state.get("clarification_question")
    shop_name = state.get("extracted_shop_name", "")
    retry     = state.get("retry_count", 0)

    logger.info(f"clarification_node: field='{field}' | retry={retry} | MAX_RETRY={settings.MAX_RETRY_COUNT} | shop_name='{shop_name}'")

    # Use the existing clarification question if set by previous node
    if not question:
        if field == "shop_confirm":
            # "Did you mean?" confirmation - use proposed shop name
            proposed = state.get("proposed_shop", {})
            shop_display = proposed.get("shopName", shop_name)
            question = shop_confirm_found_message(shop_display, proposed.get("ownerName", ""), language)
        elif field == "shop" and retry >= settings.MAX_RETRY_COUNT:
            # After max retries, offer alternatives (try another, create new, cancel)
            question = shop_not_found_with_options_message(shop_name, language)
            logger.info(f"clarification_node: showing shop not found options (retry={retry})")
        elif field == "shop":
            # Shop not found but within retry limit
            question = shop_not_found_message(shop_name, language)
            logger.info(f"clarification_node: showing shop not found retry message (retry={retry})")
        else:
            question = general_clarification_message(language)

    logger.info(f"clarification_node: field='{field}' | question='{question[:60]}...'")

    return {
        "tts_message":     question,
        "response_status": "clarifying",
    }
