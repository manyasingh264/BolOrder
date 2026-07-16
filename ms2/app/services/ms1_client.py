"""
MS1Client — Async HTTP client for the Business Microservice.

Responsibility: ONLY make HTTP calls to MS1. No business logic here.

MS1 API paths used (no /v1 prefix — MS1 mounts everything at /api):
    GET  /api/shops           — List shops accessible to the authenticated salesman
    POST /api/shops           — Create a new unverified shop
    GET  /api/products        — List all products + variants
    POST /api/orders          — Create a DRAFT order (JSON body)
    POST /api/orders/voice    — Create a PENDING_CONFIRMATION voice order (JSON body)

Design:
- Async context manager — opened per request, closed after.
- Auth token (salesman's JWT) forwarded to MS1 on every call.
- Returns plain dicts. Callers handle business logic.
- Raises MS1ClientError on non-2xx responses.
"""

from typing import Optional, Any

import httpx

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MS1ClientError(Exception):
    """Raised when MS1 returns an unexpected HTTP error."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"MS1 error {status_code}: {detail}")


class MS1Client:
    """
    Async HTTP client for all MS1 API calls.

    Usage:
        async with MS1Client(auth_token=token) as client:
            shops = await client.get_all_shops()
    """

    def __init__(self, auth_token: Optional[str] = None):
        self._base_url = settings.MS1_BASE_URL
        self._timeout  = settings.MS1_TIMEOUT_SECONDS
        self._auth_token = auth_token
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        headers = {"Content-Type": "application/json"}
        if self._auth_token:
            headers["Authorization"] = f"Bearer {self._auth_token}"

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=headers,
            timeout=self._timeout,
        )
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    # ── Shop Operations ────────────────────────────────────────

    async def get_all_shops(self) -> list[dict[str, Any]]:
        """
        Fetch all shops accessible to the authenticated salesman.
        MS1 automatically filters by salesman role — SALESMAN sees only their shops.

        Endpoint: GET /api/shops
        Returns: list of shop dicts [{id, shopName, ownerName, phone, salesman, aliases}]
        """
        try:
            logger.info("MS1: Fetching shops")
            response = await self._client.get("/api/shops")
            response.raise_for_status()
            data = response.json()
            shops = data.get("data", [])
            logger.info(f"MS1: Retrieved {len(shops)} shops")
            return shops if isinstance(shops, list) else []

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 get shops failed: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"MS1 get shops error: {e}")
            return []

    async def create_shop(self, shop_name: str, owner_name: Optional[str] = None) -> Optional[dict[str, Any]]:
        """
        Create a new shop in MS1 with isVerified=false.
        The salesman's salesmanId is inferred from their JWT token by MS1.

        Endpoint: POST /api/shops
        """
        payload: dict[str, Any] = {"shopName": shop_name}
        if owner_name:
            payload["ownerName"] = owner_name

        try:
            logger.info(f"MS1: Creating shop '{shop_name}'")
            response = await self._client.post("/api/shops", json=payload)
            response.raise_for_status()
            data = response.json()
            shop = data.get("data", data)
            logger.info(f"MS1: Shop created | id={shop.get('id')}")
            return shop

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 create shop failed: {e.response.status_code} — {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 create shop error: {e}")
            raise MS1ClientError(500, str(e))

    # ── Product Operations ─────────────────────────────────────

    async def get_all_products(self) -> list[dict[str, Any]]:
        """
        Fetch all active products with their variants.
        Nodes use RapidFuzz to match the spoken product name against these.

        Endpoint: GET /api/products
        Returns: list of product dicts [{id, name, category, variants: [{id, weight, unit, price}]}]
        """
        try:
            logger.info("MS1: Fetching products")
            response = await self._client.get("/api/products")
            response.raise_for_status()
            data = response.json()
            products = data.get("data", [])
            logger.info(f"MS1: Retrieved {len(products)} products")
            return products if isinstance(products, list) else []

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 get products failed: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"MS1 get products error: {e}")
            return []

    # ── Order Operations ───────────────────────────────────────

    async def create_voice_order(
        self,
        shop_id: str,
        items: list[dict[str, Any]],
        raw_transcript: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a voice order in MS1 after salesman confirms the conversation.

        Endpoint: POST /api/orders/voice
        Payload:  { shopId, items: [{productVariantId, quantity}], rawTranscript }

        MS1's voice order endpoint creates order at PENDING_CONFIRMATION status
        and stores the raw transcript for audit purposes.
        """
        payload: dict[str, Any] = {
            "shopId": shop_id,
            "items":  items,
        }
        if raw_transcript:
            payload["rawTranscript"] = raw_transcript

        try:
            logger.info(f"MS1: Creating voice order | shopId={shop_id} | items={len(items)}")
            response = await self._client.post("/api/orders/voice", json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info("MS1: Voice order created successfully")
            return data.get("data", data)

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 voice order failed: {e.response.status_code} — {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 voice order error: {e}")
            raise MS1ClientError(500, str(e))
