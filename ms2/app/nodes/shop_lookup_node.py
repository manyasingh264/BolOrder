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
from rapidfuzz import process, fuzz

from app.config import settings
from app.graph.state import VoiceOrderState
from app.services.ms1_client import MS1Client
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def shop_lookup_node(state: VoiceOrderState) -> dict:
    """
    Fetch shops from MS1 and fuzzy-match the extracted shop name.

    Reads:  extracted_shop_name, auth_token, retry_count
    Writes: shop_id, shop_data, shop_not_found, retry_count
    """
    # Skip if shop already resolved
    if state.get("shop_id"):
        logger.info("shop_lookup_node: skipping — shop already resolved")
        return {}

    shop_name = state.get("extracted_shop_name")
    if not shop_name:
        logger.warning("shop_lookup_node: no extracted_shop_name — marking shop_not_found")
        return {"shop_not_found": True}

    auth_token = state.get("auth_token")
    retry      = state.get("retry_count", 0)

    async with MS1Client(auth_token=auth_token) as client:
        shops = await client.get_all_shops()

    if not shops:
        logger.warning("shop_lookup_node: MS1 returned 0 shops")
        return {
            "shop_not_found": True,
            "retry_count":    retry + 1,
        }

    # Build list of (shop_name, shop_dict) tuples for matching
    # Match against shopName AND ownerName for better recall
    candidates: list[tuple[str, dict]] = []
    for shop in shops:
        candidates.append((shop.get("shopName", ""), shop))
        if shop.get("ownerName"):
            candidates.append((shop.get("ownerName", ""), shop))

    candidate_names = [name for name, _ in candidates]
    candidate_shops = [shop for _, shop in candidates]

    # token_sort_ratio handles different word orderings (e.g., "Sharma General" vs "General Store Sharma")
    match = process.extractOne(
        shop_name,
        candidate_names,
        scorer=fuzz.token_sort_ratio,
        score_cutoff=settings.SHOP_CONFIDENCE_THRESHOLD,
    )

    if match:
        matched_name, score, index = match
        matched_shop = candidate_shops[index]
        logger.info(
            f"shop_lookup_node: matched '{shop_name}' → '{matched_name}' "
            f"(score={score}) | id={matched_shop.get('id')}"
        )
        return {
            "shop_id":       matched_shop.get("id"),
            "shop_data":     matched_shop,
            "shop_not_found": False,
        }

    logger.info(
        f"shop_lookup_node: no match for '{shop_name}' "
        f"(threshold={settings.SHOP_CONFIDENCE_THRESHOLD}) | retry={retry}"
    )
    return {
        "shop_not_found": True,
        "retry_count":    retry + 1,
    }
