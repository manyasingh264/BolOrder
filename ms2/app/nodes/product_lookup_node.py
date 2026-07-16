"""
product_lookup_node — Node 3 of the LangGraph pipeline.

Responsibility:
    1. Fetch all products+variants from MS1.
    2. For each extracted product, fuzzy-match name against product names.
    3. For each matched product, fuzzy-match variant_description against variant labels.
    4. Build matched_products list for confirmed items.
    5. Set clarification_required=True if any product/variant is unclear.

Matching strategy:
    - Product name: RapidFuzz partial_ratio (handles partial names well)
    - Variant: match weight/unit string (e.g., "200 gram" → variant with weight=200, unit="g")

When skipped:
    matched_products is non-empty (already resolved).
"""

from rapidfuzz import fuzz

from app.config import settings
from app.graph.state import VoiceOrderState
from app.prompts.clarification import (
    product_not_found_message,
    variant_unclear_message,
    quantity_unclear_message,
)
from app.services.ms1_client import MS1Client
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _variant_label(variant: dict) -> str:
    """Build a searchable string from a variant dict, e.g., '200 g' or '500 grams'."""
    weight = variant.get("weight", "")
    unit   = variant.get("unit", "")
    return f"{weight} {unit}".strip().lower()


def _find_best_variant(variants: list[dict], description: str) -> dict | None:
    """
    Find the best-matching variant for a spoken description.
    E.g., "do sau gram" → 200g variant.

    Returns the variant dict or None if no match above threshold.
    """
    if not variants:
        return None

    if not description:
        # If only one variant, return it directly
        return variants[0] if len(variants) == 1 else None

    labels = [_variant_label(v) for v in variants]
    desc   = description.lower().replace("gram", "g").replace("grams", "g")

    best_score = 0
    best_idx   = -1
    for i, label in enumerate(labels):
        score = fuzz.partial_ratio(desc, label)
        if score > best_score:
            best_score = score
            best_idx   = i

    if best_score >= settings.PRODUCT_CONFIDENCE_THRESHOLD and best_idx >= 0:
        return variants[best_idx]
    return None


async def product_lookup_node(state: VoiceOrderState) -> dict:
    """
    Match extracted products against MS1 product catalog.

    Reads:  extracted_products, auth_token, language
    Writes: matched_products, clarification_required, clarification_question,
            clarification_field
    """
    # Skip if products are already matched
    if state.get("matched_products"):
        logger.info("product_lookup_node: skipping — products already matched")
        return {}

    extracted = state.get("extracted_products", [])
    language  = state.get("language", "hi")
    auth_token = state.get("auth_token")

    if not extracted:
        return {
            "clarification_required":  True,
            "clarification_question":  "Kaunsa product chahiye? Naam aur quantity bataiye." if language == "hi"
                                       else "Which products do you need? Please specify name and quantity.",
            "clarification_field":     "product",
        }

    # Fetch all products from MS1 once
    async with MS1Client(auth_token=auth_token) as client:
        all_products = await client.get_all_products()

    product_names = [p.get("name", "") for p in all_products]

    matched:     list[dict] = []
    unresolved:  list[str]  = []

    for item in extracted:
        spoken_name = item.get("product_name", "")
        variant_desc = item.get("variant_description", "")
        quantity     = item.get("quantity")

        # ── Match product name ──────────────────────────────────
        from rapidfuzz import process
        name_match = process.extractOne(
            spoken_name,
            product_names,
            scorer=fuzz.partial_ratio,
            score_cutoff=settings.PRODUCT_CONFIDENCE_THRESHOLD,
        )

        if not name_match:
            logger.warning(f"product_lookup_node: no match for '{spoken_name}'")
            unresolved.append(spoken_name)
            continue

        matched_name, score, idx = name_match
        product = all_products[idx]
        logger.info(f"product_lookup_node: '{spoken_name}' → '{matched_name}' (score={score})")

        # ── Match variant ───────────────────────────────────────
        variants = product.get("variants", [])
        variant  = _find_best_variant(variants, variant_desc)

        if not variant:
            if len(variants) == 1:
                # Only one variant — auto-select
                variant = variants[0]
            else:
                logger.warning(f"product_lookup_node: variant unclear for '{matched_name}'")
                unresolved.append(f"{matched_name} (size unclear)")
                continue

        # ── Validate quantity ───────────────────────────────────
        if not quantity or quantity <= 0:
            logger.warning(f"product_lookup_node: quantity missing for '{matched_name}'")
            unresolved.append(f"{matched_name} (quantity missing)")
            continue

        matched.append({
            "productVariantId":   variant.get("id"),
            "product_name":       product.get("name"),
            "variant_description": _variant_label(variant),
            "quantity":           quantity,
            "unit":               item.get("unit", "packet"),
            "unit_price":         variant.get("price", "0.00"),
        })

    if unresolved:
        # Ask about the first unresolved item
        first_unresolved = unresolved[0]
        if "size unclear" in first_unresolved:
            product_name = first_unresolved.replace(" (size unclear)", "")
            question     = variant_unclear_message(product_name, language)
            field        = "product_variant"
        elif "quantity missing" in first_unresolved:
            product_name = first_unresolved.replace(" (quantity missing)", "")
            question     = quantity_unclear_message(product_name, language)
            field        = "product_quantity"
        else:
            question = product_not_found_message(first_unresolved, language)
            field    = "product"

        return {
            "matched_products":        matched,   # Partial — keep what we found
            "clarification_required":  True,
            "clarification_question":  question,
            "clarification_field":     field,
        }

    logger.info(f"product_lookup_node: all {len(matched)} products matched successfully")
    return {
        "matched_products":       matched,
        "clarification_required": False,
        "clarification_question": None,
        "clarification_field":    None,
    }
