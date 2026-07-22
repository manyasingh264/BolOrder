"""
service_auth.py — verifies a request to ms2 truly came from ms1.

ms1 sends header: X-Service-Key: <MS2_SERVICE_SECRET>
This is a FastAPI dependency — attach it to every route in conversation.py
so the browser can never call ms2 directly, even if it discovers the URL.
"""

from fastapi import Header, HTTPException

from app.config import settings


async def verify_service_key(x_service_key: str = Header(default="")):
    if not settings.MS2_SERVICE_SECRET:
        raise HTTPException(status_code=500, detail="Service auth not configured.")
    if x_service_key != settings.MS2_SERVICE_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: invalid or missing service key.")