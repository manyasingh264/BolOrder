"""
ms1_client.py — Async HTTP client for the Business Microservice (MS1).

Responsibility: ONLY make HTTP calls to MS1. No business logic here.

Internal API paths (MS2 → MS1, protected by X-Service-Key):
    GET  /api/internal/context         — Load shops + products for session cache
    POST /api/internal/orders          — Create voice order after AI conversation
    POST /api/internal/shops           — Create unverified shop discovered by AI

MS2 also uses the salesman's forwarded JWT for the context call so MS1
can filter shops to only those assigned to the salesman.

Design:
- Async context manager — opened per request, closed after.
- X-Service-Key header always attached for internal routes.
- Auth token (salesman's JWT) forwarded for user-scoped calls.
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
            context = await client.get_context(salesman_id="uuid")
    """

    def __init__(self, auth_token: Optional[str] = None):
        self._base_url   = settings.MS1_BASE_URL
        self._timeout    = settings.MS1_TIMEOUT_SECONDS
        self._auth_token = auth_token
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        headers = {
            "Content-Type": "application/json",
            "X-Service-Key": settings.MS2_SERVICE_SECRET,
        }
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

    # ── Internal Context API ─────────────────────────────────────────────────

    async def get_context(self, salesman_id: str) -> dict[str, Any]:
        """
        Fetch shops + products for the session business context cache.

        Endpoint: GET /api/internal/context?salesman_id=<uuid>
        Returns:  { shops: [...], products: [...] }

        MS1 returns only shops assigned to this salesman.
        Products are the full catalog with variants and aliases.
        """
        try:
            logger.info(f"MS1: Loading business context | salesman={salesman_id[:8]}...")
            response = await self._client.get(
                "/api/internal/context",
                params={"salesman_id": salesman_id},
            )
            response.raise_for_status()
            data = response.json()
            context = data.get("data", {})
            shops    = context.get("shops", [])
            products = context.get("products", [])
            logger.info(f"MS1: Context loaded | {len(shops)} shops | {len(products)} products")
            return {"shops": shops, "products": products}

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 get_context failed: {e.response.status_code} — {e.response.text}")
            return {"shops": [], "products": []}
        except Exception as e:
            logger.error(f"MS1 get_context error: {e}")
            return {"shops": [], "products": []}

    # ── Internal Order API ───────────────────────────────────────────────────

    async def create_internal_order(
        self,
        shop_id: str,
        salesman_id: str,
        items: list[dict[str, Any]],
        raw_transcript: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a voice order after the salesman confirms the conversation.

        Endpoint: POST /api/internal/orders
        Payload:  { shopId, salesmanId, items: [{productVariantId, quantity}], rawTranscript? }

        MS1 creates the order at PENDING_CONFIRMATION status.
        Returns the full order object.
        """
        payload: dict[str, Any] = {
            "shopId":     shop_id,
            "salesmanId": salesman_id,
            "items":      items,
        }
        if raw_transcript:
            payload["rawTranscript"] = raw_transcript

        try:
            logger.info(f"MS1: Creating internal order | shopId={shop_id} | items={len(items)}")
            response = await self._client.post("/api/internal/orders", json=payload)
            response.raise_for_status()
            data = response.json()
            logger.info("MS1: Internal order created successfully")
            return data.get("data", data)

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 create_internal_order failed: {e.response.status_code} — {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 create_internal_order error: {e}")
            raise MS1ClientError(500, str(e))

    # ── Internal Shop API ────────────────────────────────────────────────────

    async def create_internal_shop(
        self,
        shop_name: str,
        salesman_id: str,
        owner_name: Optional[str] = None,
        phone: Optional[str] = None,
        address: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Create a new unverified shop discovered during an AI conversation.

        Endpoint: POST /api/internal/shops
        The shop starts unverified — a manager must verify it later.
        """
        payload: dict[str, Any] = {
            "shopName":   shop_name,
            "salesmanId": salesman_id,
        }
        if owner_name: payload["ownerName"] = owner_name
        if phone:      payload["phone"]     = phone
        if address:    payload["address"]   = address

        try:
            logger.info(f"MS1: Creating internal shop '{shop_name}'")
            response = await self._client.post("/api/internal/shops", json=payload)
            response.raise_for_status()
            data = response.json()
            shop = data.get("data", data)
            logger.info(f"MS1: Internal shop created | id={shop.get('id')}")
            return shop

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 create_internal_shop failed: {e.response.status_code} — {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 create_internal_shop error: {e}")
            raise MS1ClientError(500, str(e))

    # ── Legacy fallback (kept for compatibility) ─────────────────────────────

    async def get_all_shops(self) -> list[dict[str, Any]]:
        """Legacy: Fetch shops via authenticated salesman JWT."""
        try:
            response = await self._client.get("/api/shops")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except Exception as e:
            logger.error(f"MS1 get_all_shops error: {e}")
            return []

    async def get_all_products(self) -> list[dict[str, Any]]:
        """Legacy: Fetch products via authenticated salesman JWT."""
        try:
            response = await self._client.get("/api/products")
            response.raise_for_status()
            data = response.json()
            return data.get("data", [])
        except Exception as e:
            logger.error(f"MS1 get_all_products error: {e}")
            return []