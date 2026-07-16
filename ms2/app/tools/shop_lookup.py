"""
ShopLookupTool — Search MS1 for a shop and compute fuzzy match confidence.

Responsibilities:
- Call MS1 GET /api/v1/shops/search
- Use RapidFuzz to score how well the spoken name matches catalog names
- Return the best match + confidence score
- Confidence >= SHOP_CONFIDENCE_THRESHOLD → found
- Confidence < threshold → shop_lookup_node decides to retry or ask
"""

from typing import Optional

from rapidfuzz import fuzz, process

from app.config import settings
from app.schemas.shop import ShopResponse, ShopSearchResult
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def shop_lookup_tool(
    shop_name: str,
    auth_token: Optional[str] = None,
) -> ShopSearchResult:
    """
    Search MS1 for a shop matching the given name.

    Args:
        shop_name: Shop name as extracted from the transcript.
        auth_token: Bearer token to forward to MS1.

    Returns:
        ShopSearchResult with:
            - found: True if confidence >= threshold
            - shop: Best matching ShopResponse (or None)
            - confidence: RapidFuzz score (0–100)
    """
    from app.services.ms1_client import MS1Client

    if not shop_name or not shop_name.strip():
        logger.warning("ShopLookupTool called with empty shop name")
        return ShopSearchResult(found=False, confidence=0.0)

    async with MS1Client(auth_token=auth_token) as client:
        shops_data = await client.search_shop(shop_name)

    if not shops_data:
        logger.info(f"ShopLookupTool: No shops returned from MS1 for '{shop_name}'")
        return ShopSearchResult(found=False, confidence=0.0)

    # Build a dict of shop_id → shop_name for fuzzy matching
    shop_names = {
        shop.get("id"): shop.get("shopName") or shop.get("shop_name", "")
        for shop in shops_data
    }

    # RapidFuzz: find the best matching shop name
    best_match = process.extractOne(
        shop_name,
        shop_names,
        scorer=fuzz.token_sort_ratio,
    )

    if not best_match:
        return ShopSearchResult(found=False, confidence=0.0)

    matched_name, confidence, matched_id = best_match

    logger.info(
        f"ShopLookupTool: Best match='{matched_name}' | "
        f"confidence={confidence:.1f} | threshold={settings.SHOP_CONFIDENCE_THRESHOLD}"
    )

    # Find the full shop data for the matched ID
    matched_shop_data = next(
        (s for s in shops_data if s.get("id") == matched_id), None
    )

    if not matched_shop_data:
        return ShopSearchResult(found=False, confidence=confidence)

    shop = ShopResponse(
        id=matched_shop_data.get("id", ""),
        shop_name=matched_shop_data.get("shopName") or matched_shop_data.get("shop_name", ""),
        owner_name=matched_shop_data.get("ownerName") or matched_shop_data.get("owner_name"),
        phone=matched_shop_data.get("phone"),
        address=matched_shop_data.get("address"),
        is_verified=matched_shop_data.get("isVerified", matched_shop_data.get("is_verified", False)),
        salesman_id=matched_shop_data.get("salesmanId") or matched_shop_data.get("salesman_id"),
    )

    found = confidence >= settings.SHOP_CONFIDENCE_THRESHOLD

    return ShopSearchResult(
        shop=shop,
        confidence=confidence,
        found=found,
    )
