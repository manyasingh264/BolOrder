"""
Voice API Router — MS2

Endpoints:
    POST /api/v1/voice/transcribe   — Audio file → transcript text + detected language
    POST /api/v1/voice/order        — Multi-turn voice order conversation

This file will be fully implemented in Step 9.
The stub here ensures main.py imports cleanly during Steps 1-8.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.get("/ping", summary="Voice router ping")
async def voice_ping():
    """Temporary stub. Will be replaced with full endpoints in Step 9."""
    return {"message": "Voice router is alive."}