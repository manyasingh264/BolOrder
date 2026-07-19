"""
extract_entity_node — Node 1 of the LangGraph pipeline.

Responsibility:
    Call Gemini (via LLMService) to extract shop name and product list
    from the current transcript. Updates the extraction fields in state.

When it runs:
    - First turn: always.
    - Subsequent turns: when clarification_field == "entity" (user repeated themselves)
      OR when the previous extraction was incomplete.

When it is SKIPPED (returns empty dict):
    - shop_id is already set AND matched_products is non-empty.
      This means extraction is complete and shop+products are resolved.
"""

from app.graph.state import VoiceOrderState
from app.services.llm_service import LLMService
from app.utils.logger import get_logger

logger = get_logger(__name__)


def extract_entity_node(state: VoiceOrderState) -> dict:
    """
    Extract shop name and products from the transcript using Gemini.

    Reads:  transcript, language, conversation_history, clarification_field
    Writes: extracted_shop_name, extracted_products, language,
            clarification_required, clarification_question
    """
    # Skip if we already have a resolved shop AND matched products
    # (prevents re-extraction on confirmation turns)
    if state.get("shop_id") and state.get("matched_products"):
        logger.info("extract_entity_node: skipping — shop and products already resolved")
        return {}
    
    # Skip if clarifying shop confirmation - shop_lookup_node handles yes/no directly
    clarification_field = state.get("clarification_field")
    logger.info(f"extract_entity_node: checking skip - clarification_field='{clarification_field}'")
    if clarification_field == "shop_confirm":
        logger.info("extract_entity_node: skipping — shop_confirm handled by shop_lookup_node")
        return {}

    transcript = state.get("transcript", "")
    language   = state.get("language", "hi")
    history    = state.get("conversation_history", [])
    clarification_field = state.get("clarification_field")

    logger.info(f"extract_entity_node: extracting from '{transcript[:60]}...'")

    # If clarifying a specific field, preserve previously extracted entities
    # and only update the field being clarified
    if clarification_field == "product_variant":
        # Direct update: preserve shop and products, update the last product's variant
        prev_shop = state.get("extracted_shop_name", "")
        prev_products = state.get("extracted_products", [])
        
        logger.info(f"extract_entity_node: clarifying variant - preserving shop='{prev_shop}', products={len(prev_products)}")
        
        # Create a mock result that preserves previous data
        # We'll update the variant description in the product lookup node instead
        result = type('obj', (object,), {
            'shop_name': prev_shop,
            'products': [type('obj', (object,), p) for p in prev_products],
            'language': language,
            'needs_clarification': False,
            'clarification_question': None,
        })()
        
        # Store the clarification transcript for the product lookup node to use
        # This is a workaround - the product lookup node will handle variant matching
    elif clarification_field == "shop":
        # Preserve previously extracted products when clarifying shop name
        prev_products = state.get("extracted_products", [])
        prev_shop = state.get("extracted_shop_name", "")
        
        logger.info(f"extract_entity_node: clarifying shop - preserving {len(prev_products)} products from previous extraction")
        logger.info(f"extract_entity_node: previous shop='{prev_shop}', previous products={prev_products}")
        
        # Extract only the shop name from the new transcript
        llm = LLMService()
        result = llm.extract_order_entities(
            transcript=transcript,
            language=language,
            conversation_history=history,
        )
        
        logger.info(f"extract_entity_node: new extraction - shop='{result.shop_name}', products={len(result.products)}")
        
        # ALWAYS preserve previous products when clarifying shop
        # The user is only providing the shop name, not repeating products
        if prev_products:
            logger.info(f"extract_entity_node: forcing restore of {len(prev_products)} previously extracted products")
            # Use the dict directly, don't convert to mock objects
            updates = {
                "extracted_shop_name":  result.shop_name,
                "extracted_products":   prev_products,  # Preserve as-is
                "language":             result.language,
                "clarification_required": result.needs_clarification,
                "matched_products":      [],  # Force re-matching with new shop
            }
        else:
            updates = {
                "extracted_shop_name":  result.shop_name,
                "extracted_products":   [p.model_dump() for p in result.products],
                "language":             result.language,
                "clarification_required": result.needs_clarification,
                "matched_products":      [],  # Force re-matching with new shop
            }
    else:
        # Full extraction
        llm     = LLMService()
        result  = llm.extract_order_entities(
            transcript=transcript,
            language=language,
            conversation_history=history,
        )

        updates = {
            "extracted_shop_name":  result.shop_name,
            "extracted_products":   [p.model_dump() for p in result.products],
            "language":             result.language,
            "clarification_required": result.needs_clarification,
        }

    if result.needs_clarification and result.clarification_question:
        updates["clarification_question"] = result.clarification_question
        # If shop_name is empty but products exist, this is a shop clarification
        if not result.shop_name and result.products:
            updates["clarification_field"] = "shop"
            logger.info("extract_entity_node: shop name missing but products present - setting clarification_field='shop'")
        else:
            updates["clarification_field"] = "entity"
    else:
        # Clear any previous clarification state
        updates["clarification_question"] = None
        updates["clarification_field"]    = None

    logger.info(
        f"extract_entity_node done | shop='{result.shop_name}' | "
        f"products={len(result.products)} | needs_clarification={result.needs_clarification}"
    )
    return updates
