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

from app.graph.state import VoiceOrderState
from app.prompts.clarification import (
    general_clarification_message,
    shop_not_found_message,
    create_new_shop_message,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)


def clarification_node(state: VoiceOrderState) -> dict:
    """
    Set up the clarification response for this turn.

    Reads:  clarification_question, clarification_field, language,
            extracted_shop_name, retry_count
    Writes: tts_message, response_status
    """
    language  = state.get("language", "hi")
    field     = state.get("clarification_field", "entity")
    question  = state.get("clarification_question")
    shop_name = state.get("extracted_shop_name", "")
    retry     = state.get("retry_count", 0)

    # Use the existing clarification question if set by previous node
    if not question:
        if field == "shop" and retry >= 2:
            # After 2 retries, offer to create a new shop
            question = create_new_shop_message(shop_name, language)
        elif field == "shop":
            question = shop_not_found_message(shop_name, language)
        else:
            question = general_clarification_message(language)

    logger.info(f"clarification_node: field='{field}' | question='{question[:60]}...'")

    return {
        "tts_message":     question,
        "response_status": "clarifying",
    }
