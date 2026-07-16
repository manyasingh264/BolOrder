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

    # ── OpenAI ───────────────────────────────────────────────────
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key — required for LLM extraction")
    OPENAI_MODEL: str = "gpt-4o"

    # ── Whisper ───────────────────────────────────────────────────
    WHISPER_MODEL: str = "small"
    DEVICE: str = "cpu"
    COMPUTE_TYPE: str = "int8"

    # ── MS1 ───────────────────────────────────────────────────────
    MS1_BASE_URL: str = "http://localhost:3000"
    MS1_TIMEOUT_SECONDS: int = 10

    # ── TTS ───────────────────────────────────────────────────────
    TTS_PROVIDER: str = "gtts"

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── Session ───────────────────────────────────────────────────
    SESSION_TTL_SECONDS: int = 3600

    # ── Confidence Thresholds ─────────────────────────────────────
    SHOP_CONFIDENCE_THRESHOLD: int = 70
    PRODUCT_CONFIDENCE_THRESHOLD: int = 65


# Singleton instance — import this everywhere
settings = Settings()