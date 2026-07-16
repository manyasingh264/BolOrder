"""
SpeechToTextService — Whisper-powered transcription.

Design decisions:
- Model is loaded ONCE at startup via lifespan (stored on app.state).
- This service is instantiated with settings values — no hardcoded config.
- Returns both the transcript AND the detected language.
  Language is used downstream to respond in the same language.
- Supports: English, Hindi, Hinglish (Whisper auto-detects mixed speech as "hi")
"""

from faster_whisper import WhisperModel

from app.utils.logger import get_logger

logger = get_logger(__name__)


class SpeechToTextService:
    """
    Wraps Faster Whisper for speech-to-text conversion.

    All configuration comes from settings, not hardcoded values.
    Instantiated once via lifespan — do NOT create inside endpoint handlers.
    """

    def __init__(
        self,
        model_size: str = "small",
        device: str = "cpu",
        compute_type: str = "int8",
    ):
        logger.info(
            f"Initializing Whisper | model={model_size} | "
            f"device={device} | compute_type={compute_type}"
        )
        self.model = WhisperModel(
            model_size_or_path=model_size,
            device=device,
            compute_type=compute_type,
        )
        logger.info("Whisper model ready.")

    def transcribe(self, audio_path: str) -> tuple[str, str]:
        """
        Transcribe an audio file to text.

        Args:
            audio_path: Absolute path to the audio file.

        Returns:
            Tuple of (transcript, language)
            - transcript: Full text of the audio
            - language: Detected language code ("en", "hi", etc.)

        Supports Hindi, English, and Hinglish (detected as "hi").
        """
        logger.info(f"Transcribing: {audio_path}")

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            # Let Whisper auto-detect language (Hindi/English/Hinglish)
            language=None,
        )

        transcript = " ".join(segment.text for segment in segments).strip()
        detected_language = info.language if info.language else "hi"

        logger.info(
            f"Transcription complete | language={detected_language} | "
            f"chars={len(transcript)} | preview='{transcript[:60]}...'"
        )

        return transcript, detected_language