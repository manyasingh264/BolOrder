"""
Shop schemas — aligned with MS1 customer_shops table.

MS1 DB Schema (reference):
    customer_shops (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_name   text NOT NULL,
        owner_name  text,
        phone       text,
        address     text,
        is_verified boolean NOT NULL DEFAULT false,
        salesman_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at  timestamp DEFAULT now(),
        updated_at  timestamp DEFAULT now()
    )
"""

from typing import Optional
from pydantic import BaseModel


class ShopCreateRequest(BaseModel):
    """
    Payload sent to MS1 POST /api/v1/shops when a new shop is discovered.
    Shop is created with is_verified=false — manager approves later.
    """
    shop_name: str
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    salesman_id: str  # UUID — injected from the voice order request


class ShopResponse(BaseModel):
    """
    Response from MS1 after shop search or shop creation.
    """
    id: str                         # UUID
    shop_name: str
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_verified: bool = False
    salesman_id: Optional[str] = None


class ShopSearchResult(BaseModel):
    """
    Result of a shop search (fuzzy match).
    Confidence is computed by RapidFuzz in the tool layer.
    """
    shop: Optional[ShopResponse] = None
    confidence: float = 0.0         # 0–100 (RapidFuzz score)
    found: bool = False


class PendingShopInfo(BaseModel):
    """
    Intermediate state while collecting new shop details conversationally.
    Fields are populated turn-by-turn as user responds.
    """
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

    @property
    def is_complete(self) -> bool:
        """True when all required fields are collected."""
        return bool(self.shop_name and self.owner_name and self.phone)

    @property
    def next_missing_field(self) -> Optional[str]:
        """Returns the name of the next field to ask the user about."""
        if not self.owner_name:
            return "owner_name"
        if not self.phone:
            return "phone"
        if not self.address:
            return "address"
        return None
