"""
shop_lookup_node — Node 2 of the LangGraph pipeline.

Responsibility:
    1. Fetch all shops from MS1 that the salesman has access to.
    2. Fuzzy-match the extracted_shop_name against shop names using RapidFuzz.
    3. If a match is found: set shop_id and shop_data.
    4. If no match: set shop_not_found=True and increment retry_count.

Why RapidFuzz?
    Salesmen say shop names in Hindi/Hinglish with slight variations.
    "Sharma Store", "Sharma Ji ki dukaan", "Sharma Kirana" all mean the same shop.
    RapidFuzz token_sort_ratio handles word-order variations naturally.

When skipped:
    shop_id is already set (shop already resolved in a previous turn).
"""

import asyncio
import re
from rapidfuzz import process, fuzz

from app.config import settings
from app.graph.state import VoiceOrderState
from app.services.ms1_client import MS1Client
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def shop_lookup_node(state: VoiceOrderState) -> dict:
    """
    Fetch shops from MS1 and fuzzy-match the extracted shop name.

    Reads:  extracted_shop_name, auth_token, retry_count, clarification_field,
            transcript, proposed_shop
    Writes: shop_id, shop_data, shop_not_found, retry_count, clarification_field,
            proposed_shop, shop_match_score
    """
    # Skip if shop already resolved
    if state.get("shop_id"):
        logger.info("shop_lookup_node: skipping — shop already resolved")
        return {}

    # Handle "Did you mean?" confirmation response
    clarification_field = state.get("clarification_field")
    if clarification_field == "shop_confirm":
        transcript = state.get("transcript", "").lower()
        proposed = state.get("proposed_shop")
        
        # Yes keywords
        yes_keywords = {"haan", "ha", "han", "bilkul", "theek", "sahi", "karo", "bhejo", "yes", "yep", "yeah", "ok", "okay", "sure", "correct", "right", "absolutely"}
        # No keywords
        no_keywords = {"nahi", "na", "nah", "mat", "band", "galat", "rok", "no", "nope", "stop", "wrong", "incorrect"}
        
        tokens = set(transcript.split())
        has_yes = any(token in yes_keywords for token in tokens)
        has_no = any(token in no_keywords for token in tokens)
        
        if has_yes and proposed:
            logger.info(f"shop_lookup_node: user confirmed proposed shop '{proposed.get('shopName')}'")
            return {
                "shop_id": proposed.get("id"),
                "shop_data": proposed,
                "shop_not_found": False,
                "proposed_shop": None,
                "clarification_required": False,
                "clarification_field": None,
            }
        elif has_no:
            logger.info("shop_lookup_node: user rejected proposed shop - treating as not found")
            return {
                "shop_not_found": True,
                "clarification_field": "shop",
                "retry_count": state.get("retry_count", 0) + 1,
                "proposed_shop": None,
                "extracted_shop_name": None,  # Clear shop name to prevent re-matching same name
            }
        else:
            # Unclear response - ask again
            logger.info("shop_lookup_node: unclear response to shop confirmation - asking again")
            shop_display = proposed.get('shopName') if proposed else 'the shop'
            return {
                "clarification_required": True,
                "clarification_field": "shop_confirm",
                "clarification_question": f"Did you mean {shop_display}? Please say Yes or No.",
            }

    # Handle "Create Shop" response after max retries
    if clarification_field == "shop" and state.get("retry_count", 0) >= settings.MAX_RETRY_COUNT:
        transcript = state.get("transcript", "").lower()
        shop_name = state.get("extracted_shop_name", "")
        
        # Create shop keywords
        create_keywords = {"create", "add", "new", "nai", "banayein", "karein", "add"}
        # Cancel keywords
        cancel_keywords = {"cancel", "stop", "band", "rok", "nahi", "no", "mat"}
        
        tokens = set(transcript.split())
        has_create = any(token in create_keywords for token in tokens)
        has_cancel = any(token in cancel_keywords for token in tokens)
        
        if has_create and shop_name:
            logger.info(f"shop_lookup_node: user wants to create new shop '{shop_name}'")
            # Create the shop via MS1
            try:
                async with MS1Client(auth_token=state.get("auth_token")) as client:
                    new_shop = await client.create_shop(shop_name)
                if new_shop:
                    logger.info(f"shop_lookup_node: successfully created shop '{shop_name}' with id {new_shop.get('id')}")
                    return {
                        "shop_id": new_shop.get("id"),
                        "shop_data": new_shop,
                        "shop_not_found": False,
                        "is_new_shop": True,
                        "retry_count": 0,
                        "clarification_required": False,
                        "clarification_field": None,
                    }
            except Exception as e:
                logger.error(f"shop_lookup_node: failed to create shop '{shop_name}': {e}")
                return {
                    "clarification_required": True,
                    "clarification_field": "shop",
                    "clarification_question": f"Shop creation failed. Please try a different shop name.",
                    "retry_count": 0,
                }
        elif has_cancel:
            logger.info("shop_lookup_node: user wants to cancel order")
            return {
                "clarification_required": True,
                "clarification_field": "cancel",
                "clarification_question": "Order cancelled. Please start over with a new order.",
                "response_status": "cancelled",
            }
        else:
            # Default: ask for shop name again (try another shop)
            logger.info("shop_lookup_node: user wants to try another shop")
            return {
                "clarification_required": True,
                "clarification_field": "shop",
                "clarification_question": "Please tell me the shop name.",
                "retry_count": 0,
            }

    shop_name = state.get("extracted_shop_name")
    if not shop_name:
        logger.warning("shop_lookup_node: no extracted_shop_name — marking shop_not_found")
        return {
            "shop_not_found": True,
            "clarification_field": "shop",
            "retry_count": state.get("retry_count", 0) + 1,
        }

    # Clean the shop name by removing common Hindi/English suffixes
    # This helps match "Sharma ki dukan" to owner "Sharma" or shop "Sharma Store"
    shop_name_clean = re.sub(
        r'\s+(ki|ka|ke|store|shop|dukaan|dukan|general|kirana|traders|bhandar|mart|sweets|provision|stores?|wale|wali|ji)\b',
        '',
        shop_name,
        flags=re.IGNORECASE
    ).strip()
    
    # Also remove leading "the" if present
    shop_name_clean = re.sub(r'^the\s+', '', shop_name_clean, flags=re.IGNORECASE).strip()
    
    # Use cleaned name for matching but keep original for logging
    match_name = shop_name_clean if shop_name_clean else shop_name
    logger.info(f"shop_lookup_node: cleaned shop name '{shop_name}' → '{match_name}'")

    auth_token = state.get("auth_token")
    retry = state.get("retry_count", 0)

    async with MS1Client(auth_token=auth_token) as client:
        shops = await client.get_all_shops()

    if not shops:
        logger.warning("shop_lookup_node: MS1 returned 0 shops")
        return {
            "shop_not_found": True,
            "clarification_field": "shop",
            "retry_count": retry + 1,
        }

    # Build list of (candidate_name, shop_dict, scorer) tuples for matching
    # Match against shopName (token_sort_ratio), ownerName (partial_ratio), AND aliases
    candidates: list[tuple[str, dict, str]] = []
    for shop in shops:
        shop_name = shop.get("shopName", "")
        owner_name = shop.get("ownerName", "")
        
        # Clean shop name for better matching
        shop_name_clean = re.sub(
            r'\s+(store|shop|general|kirana|traders|bhandar|mart|sweets|provision|stores?)\b',
            '',
            shop_name,
            flags=re.IGNORECASE
        ).strip()
        
        candidates.append((shop_name_clean if shop_name_clean else shop_name, shop, "token_sort_ratio"))
        
        if owner_name:
            # Owner names are already clean, use as-is
            candidates.append((owner_name, shop, "partial_ratio"))
        
        # Add shop aliases if available
        aliases = shop.get("aliases", [])
        if isinstance(aliases, list):
            for alias in aliases:
                if alias:
                    candidates.append((str(alias), shop, "token_sort_ratio"))

    # Try matching with appropriate scorer for each candidate type
    best_match = None
    best_score = 0
    best_shop = None

    logger.info(f"shop_lookup_node: matching '{match_name}' against {len(candidates)} candidates")
    
    for candidate_name, shop, scorer_type in candidates:
        if scorer_type == "partial_ratio":
            score = fuzz.partial_ratio(match_name, candidate_name)
        else:
            score = fuzz.token_sort_ratio(match_name, candidate_name)
        
        logger.debug(f"shop_lookup_node: candidate='{candidate_name}' (scorer={scorer_type}) score={score}")
        
        if score > best_score:
            best_score = score
            best_match = candidate_name
            best_shop = shop
    
    logger.info(f"shop_lookup_node: best match '{best_match}' with score={best_score}")

    # Check if best match meets high confidence threshold
    if best_score >= settings.SHOP_CONFIDENCE_THRESHOLD:
        logger.info(
            f"shop_lookup_node: HIGH confidence match '{shop_name}' → '{best_match}' "
            f"(score={best_score}) | id={best_shop.get('id')}"
        )
        return {
            "shop_id": best_shop.get("id"),
            "shop_data": best_shop,
            "shop_not_found": False,
            "proposed_shop": None,
            "shop_match_score": best_score,
        }

    # No high confidence match - check for medium confidence (for "Did you mean?")
    if best_score >= settings.SHOP_MIN_MATCH_THRESHOLD:
        logger.info(
            f"shop_lookup_node: MEDIUM confidence match '{shop_name}' → '{best_match}' "
            f"(score={best_score}) - proposing for confirmation"
        )
        return {
            "shop_not_found": False,
            "proposed_shop": best_shop,
            "shop_match_score": best_score,
            "clarification_required": True,
            "clarification_field": "shop_confirm",
            "clarification_question": f"Did you mean {best_shop.get('shopName')}?",
        }

    # Low confidence - treat as shop not found
    logger.info(
        f"shop_lookup_node: LOW confidence - no match for '{shop_name}' "
        f"(best_score={best_score}, min_threshold={settings.SHOP_MIN_MATCH_THRESHOLD}) | retry={retry}"
    )
    return {
        "shop_not_found": True,
        "clarification_field": "shop",
        "retry_count": retry + 1,
    }
