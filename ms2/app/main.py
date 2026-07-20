import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── Sentry ────────────────────────────────────────────────────────
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    environment=settings.APP_ENV,
    integrations=[StarletteIntegration(), FastApiIntegration()],
    traces_sample_rate=1.0,
    send_default_pii=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    ON STARTUP (in order):
        1. Load Whisper model  — heavy, done once, stored on app.state
        2. Initialize session store
        3. Compile LangGraph   — also done once, thread-safe, stored on app.state

    ON SHUTDOWN:
        Clean up resources gracefully.
    """
    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]")

    # ── 1. Load Whisper Model ──────────────────────────────────────
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
    logger.info("Whisper model loaded.")

    # ── 2. Initialize Session Store ────────────────────────────────
    from app.services.session_store import SessionStore
    app.state.session_store = SessionStore(ttl_seconds=settings.SESSION_TTL_SECONDS)
    logger.info("Session store initialized.")

    # ── 3. Compile LangGraph ───────────────────────────────────────
    from app.graph.builder import build_graph
    app.state.graph = build_graph()
    logger.info("LangGraph compiled.")
    logger.info(
        f"MS2 ready | port={settings.PORT} | MS1={settings.MS1_BASE_URL} | "
        f"LLM={settings.MODEL_PROVIDER}/{settings.MODEL_NAME}"
    )

    yield  # ← Application runs here

    # ── Shutdown ───────────────────────────────────────────────────
    logger.info("Shutting down MS2.")
    del app.state.speech_service
    del app.state.session_store
    del app.state.graph


# ── FastAPI App ─────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered Voice Order Management Microservice. "
        "Handles Speech-to-Text (Whisper), multi-turn conversation "
        "(LangGraph + Gemini), and MS1 API communication. "
        "Never accesses the database directly."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Logging ────────────────────────────────────────────
# Logs one JSON line per request: id, method, path, status, duration_ms.
# Reads X-Request-ID from upstream (ms1/nginx) if present, so a single
# request can be traced across both services using the same id.
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response

# ── Routers ─────────────────────────────────────────────────────
from app.api.health       import router as health_router
from app.api.voice        import router as voice_router          # legacy /voice/ping
from app.api.conversation import router as conversation_router   # Step 10

app.include_router(health_router,      prefix="/api/v1")
app.include_router(voice_router,       prefix="/api/v1")
app.include_router(conversation_router, prefix="/api/v1")


