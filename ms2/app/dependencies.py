from functools import lru_cache

from app.services.speech_to_text import SpeechToTextService


@lru_cache
def get_speech_service() -> SpeechToTextService:
    return SpeechToTextService()