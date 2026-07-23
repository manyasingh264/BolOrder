from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Central configuration for MS2 — Voice AI Service.

    All values are read from the .env file.
    No module should ever call os.getenv() directly.
    Always import: from app.config import settings
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "BolOrder Voice AI Service"
    APP_ENV: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # ── Gemini LLM ───────────────────────────────────────────────
    # MODEL_PROVIDER allows future migration to openai / anthropic / groq.
    # Business logic never reads MODEL_PROVIDER — only LLMService does.
    MODEL_PROVIDER: str = "gemini"
    MODEL_NAME: str = "gemini-1.5-flash"
    API_KEY: str = Field(
        default="",
        description="Gemini API key — set this in .env before running",
    )

    # ── Whisper (Speech-to-Text) ──────────────────────────────────
    WHISPER_MODEL: str = "small"
    DEVICE: str = "cpu"
    COMPUTE_TYPE: str = "int8"

    # ── MS1 (Business Microservice) ───────────────────────────────
    MS1_BASE_URL: str = "http://localhost:3000"
    MS1_TIMEOUT_SECONDS: int = 10

    # ── TTS ───────────────────────────────────────────────────────
    TTS_PROVIDER: str = "gtts"

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    SENTRY_DSN: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── Session ───────────────────────────────────────────────────
    SESSION_TTL_SECONDS: int = 1800          # 30 minutes

    # ── Service Security ──────────────────────────────────────────
    # Must match MS2_SERVICE_SECRET in ms1-core-api/.env exactly
    MS2_SERVICE_SECRET: str = ""

    # ── Confidence Thresholds ─────────────────────────────────────
    SHOP_CONFIDENCE_THRESHOLD: int = 70      # RapidFuzz score 0-100 (high confidence)
    SHOP_MIN_MATCH_THRESHOLD: int = 40       # Minimum score to consider as potential match
    PRODUCT_CONFIDENCE_THRESHOLD: int = 65   # RapidFuzz score 0-100
    MAX_RETRY_COUNT: int = 2                 # Max retries before offering alternatives



# Singleton instance — import this everywhere
settings = Settings()