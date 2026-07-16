"""
MS1Client — Async HTTP client for communicating with the Business Microservice.

Design decisions:
- HTTPX async client: non-blocking, matches FastAPI's async model.
- All MS1 communication goes through this single class.
- Returns typed results — never raw dicts from callers' perspective.
- Timeout configurable via settings.
- Structured error handling — MS1 errors become typed exceptions.
- Never raises uncaught exceptions — returns None / empty results on failure.

MS1 API endpoints used:
    GET  /api/v1/shops/search?q={name}     — Search existing shops
    POST /api/v1/shops                     — Create new shop (isVerified=false)
    GET  /api/v1/products/search?q={name}  — Search products
    POST /api/v1/orders/voice              — Create voice order
"""

from typing import Optional, Any

import httpx

from app.config import settings
from app.schemas.shop import ShopResponse, ShopCreateRequest
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MS1ClientError(Exception):
    """Raised when MS1 returns an unexpected error."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"MS1 error {status_code}: {detail}")


class MS1Client:
    """
    Async HTTP client for all MS1 API calls.

    Usage:
        async with MS1Client(auth_token=token) as client:
            shops = await client.search_shop("Sharma Store")
    """

    def __init__(self, auth_token: Optional[str] = None):
        self._base_url = settings.MS1_BASE_URL
        self._timeout = settings.MS1_TIMEOUT_SECONDS
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

    # ── Shop Operations ───────────────────────────────────────

    async def search_shop(self, shop_name: str) -> list[dict[str, Any]]:
        """
        Search for shops by name in MS1.
        Returns list of matching shops (empty list if none found).

        MS1 endpoint: GET /api/v1/shops/search?q={shop_name}
        """
        try:
            logger.info(f"MS1: Searching shop '{shop_name}'")
            response = await self._client.get(
                "/api/v1/shops/search",
                params={"q": shop_name},
            )
            response.raise_for_status()
            data = response.json()
            shops = data.get("data", data) if isinstance(data, dict) else data
            logger.info(f"MS1: Found {len(shops)} shops for '{shop_name}'")
            return shops if isinstance(shops, list) else []

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 shop search failed: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"MS1 shop search error: {e}")
            return []

    async def create_shop(self, payload: ShopCreateRequest) -> Optional[dict[str, Any]]:
        """
        Create a new shop in MS1 with isVerified=false.
        Manager will verify it later through MS1 admin interface.

        MS1 endpoint: POST /api/v1/shops
        """
        try:
            logger.info(f"MS1: Creating new shop '{payload.shop_name}'")
            response = await self._client.post(
                "/api/v1/shops",
                json=payload.model_dump(exclude_none=True),
            )
            response.raise_for_status()
            data = response.json()
            shop_data = data.get("data", data)
            logger.info(f"MS1: Shop created | id={shop_data.get('id')}")
            return shop_data

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 shop creation failed: {e.response.status_code} - {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 shop creation error: {e}")
            raise MS1ClientError(500, str(e))

    # ── Product Operations ────────────────────────────────────

    async def search_products(self, product_name: str) -> list[dict[str, Any]]:
        """
        Search for products by name in MS1.
        Returns list of products with their variants.

        MS1 endpoint: GET /api/v1/products/search?q={product_name}
        """
        try:
            logger.info(f"MS1: Searching product '{product_name}'")
            response = await self._client.get(
                "/api/v1/products/search",
                params={"q": product_name},
            )
            response.raise_for_status()
            data = response.json()
            products = data.get("data", data) if isinstance(data, dict) else data
            logger.info(f"MS1: Found {len(products)} products for '{product_name}'")
            return products if isinstance(products, list) else []

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 product search failed: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"MS1 product search error: {e}")
            return []

    # ── Order Operations ──────────────────────────────────────

    async def create_voice_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Create a voice order in MS1 after user confirmation.

        MS1 endpoint: POST /api/v1/orders/voice
        Expected payload: { shopId, salesmanId, items: [{ variantId, quantity }] }
        """
        try:
            logger.info(f"MS1: Creating voice order for shopId={payload.get('shopId')}")
            response = await self._client.post(
                "/api/v1/orders/voice",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"MS1: Order created successfully | response={data}")
            return data

        except httpx.HTTPStatusError as e:
            logger.error(f"MS1 order creation failed: {e.response.status_code} - {e.response.text}")
            raise MS1ClientError(e.response.status_code, e.response.text)
        except Exception as e:
            logger.error(f"MS1 order creation error: {e}")
            raise MS1ClientError(500, str(e))
