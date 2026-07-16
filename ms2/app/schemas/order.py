"""
Order schemas for MS2.

Covers:
- Matched products (after fuzzy matching against MS1 catalog)
- Draft order (human-readable, shown to user before confirmation)
- Voice order request to MS1
- Voice order turn request (from React to MS2)
"""

from typing import Optional, Any
from pydantic import BaseModel, Field


class MatchedProduct(BaseModel):
    """
    A product+variant that has been matched against the MS1 catalog.
    """
    product_id: str                     # UUID from MS1
    product_name: str                   # Canonical name from MS1
    variant_id: str                     # UUID from MS1
    variant_description: str            # e.g. "200g", "500g"
    quantity: int
    unit: str = "packet"
    unit_price: Optional[float] = None  # From MS1 if available
    match_confidence: float             # RapidFuzz score (0–100)


class DraftOrderItem(BaseModel):
    """Single line item in the draft order, human-readable."""
    product_name: str
    variant_description: str
    quantity: int
    unit: str


class DraftOrder(BaseModel):
    """
    Draft order assembled before user confirmation.
    This is what gets read back to the user as TTS.
    """
    shop_name: str
    shop_id: Optional[str] = None
    items: list[DraftOrderItem]
    salesman_id: str

    def to_readable_text(self, language: str = "hi") -> str:
        """
        Generate a human-readable summary for TTS.
        Supports Hindi and English.
        """
        items_text = "\n".join(
            f"  - {item.quantity} {item.unit} {item.product_name} {item.variant_description}"
            for item in self.items
        )

        if language == "hi":
            return (
                f"Aapka order {self.shop_name} ke liye hai:\n"
                f"{items_text}\n"
                f"Kya main yeh order place karun?"
            )
        else:
            return (
                f"Your order for {self.shop_name}:\n"
                f"{items_text}\n"
                f"Should I place this order?"
            )


class VoiceOrderPayload(BaseModel):
    """
    Payload sent to MS1 POST /api/v1/orders/voice after user confirms.
    """
    shop_id: str                        # UUID — from shop search or new shop creation
    salesman_id: str                    # UUID — from the voice order request
    items: list[dict[str, Any]]         # [{ variantId, quantity }]
    new_shop: Optional[dict] = None     # Only present if shop was newly created


class VoiceOrderTurnRequest(BaseModel):
    """
    Request body for POST /api/v1/voice/order.

    React sends this for every turn of the conversation:
    - Turn 1: Initial voice transcript ("Sharma Store ko 20 Aloo Bhujia...")
    - Turn 2: Answer to clarification ("haan", "200 gram wala")
    - Turn N: Confirmation ("haan order karo" / "nahi")
    """
    session_id: str = Field(description="UUID — same across all turns of one conversation")
    transcript: str = Field(description="User's voice input, converted to text by Whisper")
    salesman_id: str = Field(description="UUID of the logged-in salesman")
    auth_token: Optional[str] = Field(
        default=None,
        description="Bearer token to forward to MS1 for authenticated API calls"
    )
