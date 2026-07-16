"""
TextToSpeechService — gTTS powered, language-aware.

Design decisions:
- Uses gTTS (Google Text-to-Speech) — free, no API key, good Hindi support.
- Every response from the voice order API includes base64-encoded audio.
- Audio is MP3, returned as base64 string in JSON — React decodes and plays it.
- Language is auto-detected from the transcript (Whisper) and passed here.
- Supported: "hi" (Hindi/Hinglish), "en" (English)
"""

import base64
import io

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Language code mapping: Whisper code → gTTS code
LANGUAGE_MAP = {
    "hi": "hi",     # Hindi / Hinglish
    "en": "en",     # English
    "ur": "hi",     # Urdu — fallback to Hindi (similar script, gTTS handles it)
}

# Fallback messages in each language
FALLBACK_MESSAGES = {
    "hi": "Kuch gadbad ho gayi. Dobara koshish karein.",
    "en": "Something went wrong. Please try again.",
}


class TextToSpeechService:
    """
    Converts text to audio using gTTS.
    Returns base64-encoded MP3 audio bytes.
    """

    def synthesize(self, text: str, language: str = "hi") -> str:
        """
        Convert text to speech and return as base64-encoded MP3.

        Args:
            text: The message to speak.
            language: Language code from Whisper ("en" | "hi").

        Returns:
            Base64-encoded MP3 string, ready to embed in JSON response.
        """
        try:
            from gtts import gTTS

            gtts_lang = LANGUAGE_MAP.get(language, "hi")
            logger.info(f"Synthesizing TTS | lang={gtts_lang} | chars={len(text)}")

            tts = gTTS(text=text, lang=gtts_lang, slow=False)

            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)

            audio_b64 = base64.b64encode(audio_buffer.read()).decode("utf-8")
            logger.info(f"TTS synthesis complete | b64_size={len(audio_b64)} chars")

            return audio_b64

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            # Return a safe fallback — never crash the response
            return self._silent_audio_b64()

    def _silent_audio_b64(self) -> str:
        """
        Returns an empty base64 string as fallback if TTS fails.
        React should handle empty audio_base64 gracefully.
        """
        return ""
