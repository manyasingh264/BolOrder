from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    ON STARTUP:
    - Load Whisper model once (heavy, ~seconds). Store on app.state.
    - All endpoints reuse this single model instance — zero per-request load cost.

    ON SHUTDOWN:
    - Clean up resources gracefully.
    """
    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    # ── Load Whisper Model ────────────────────────────────────────
    logger.info(
        f"Loading Whisper model: {settings.WHISPER_MODEL} | "
        f"device={settings.DEVICE} | compute_type={settings.COMPUTE_TYPE}"
    )
    from app.services.speech_to_text import SpeechToTextService
    app.state.speech_service = SpeechToTextService(
        model_size=settings.WHISPER_MODEL,
        device=settings.DEVICE,
        compute_type=settings.COMPUTE_TYPE,
    )
    logger.info("Whisper model loaded successfully.")

    # ── Initialize In-Memory Session Store ────────────────────────
    from app.services.session_store import SessionStore
    app.state.session_store = SessionStore(ttl_seconds=settings.SESSION_TTL_SECONDS)
    logger.info("Session store initialized.")

    logger.info(f"MS2 ready. MS1 target: {settings.MS1_BASE_URL}")

    yield  # ← Application runs here

    # ── Shutdown ──────────────────────────────────────────────────
    logger.info("Shutting down MS2. Cleaning up resources.")
    del app.state.speech_service
    del app.state.session_store


# ── FastAPI App ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered Voice Inventory Management Microservice. "
        "Handles Speech-to-Text, LangGraph conversation orchestration, "
        "and MS1 API communication. Never accesses the database directly."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
from app.api.health import router as health_router
from app.api.voice import router as voice_router

app.include_router(health_router, prefix="/api/v1")
app.include_router(voice_router, prefix="/api/v1")