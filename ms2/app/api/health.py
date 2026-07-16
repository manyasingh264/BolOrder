from fastapi import APIRouter, Request

from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health Check")
async def health_check(request: Request):
    """
    Returns the health status of MS2.
    Confirms Whisper model is loaded and session store is active.
    """
    whisper_loaded = hasattr(request.app.state, "speech_service")
    session_store_loaded = hasattr(request.app.state, "session_store")

    return {
        "status": "healthy" if whisper_loaded else "degraded",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "whisper_model": settings.WHISPER_MODEL,
        "whisper_loaded": whisper_loaded,
        "session_store": session_store_loaded,
        "ms1_target": settings.MS1_BASE_URL,
    }
