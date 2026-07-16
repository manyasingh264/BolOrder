"""
app/prompts — Prompt templates and user-facing message builders.

Files:
    extraction.py    — System prompt for Gemini entity extraction (shop name, products)
    clarification.py — User-facing clarification messages (Hindi/English)
    summary.py       — Order summary and confirmation messages

Design principle:
    All user-facing strings live here.
    No hardcoded strings inside nodes or services.
    Language-aware: every function accepts language="hi" | "en".
"""

from app.prompts.extraction    import build_extraction_prompt
from app.prompts.clarification import (
    shop_not_found_message,
    create_new_shop_message,
    product_not_found_message,
    variant_unclear_message,
    quantity_unclear_message,
    general_clarification_message,
)
from app.prompts.summary import (
    build_order_summary,
    order_confirmed_message,
    order_rejected_message,
    order_failed_message,
)

__all__ = [
    "build_extraction_prompt",
    "shop_not_found_message",
    "create_new_shop_message",
    "product_not_found_message",
    "variant_unclear_message",
    "quantity_unclear_message",
    "general_clarification_message",
    "build_order_summary",
    "order_confirmed_message",
    "order_rejected_message",
    "order_failed_message",
]
