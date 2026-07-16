import time
from typing import Any, Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)


class SessionStore:
    """
    In-memory session store for LangGraph conversation state.

    Each active voice order conversation has a session_id (UUID from React).
    The graph state is stored here between multi-turn interactions
    (e.g., user answers a clarification, sends another voice message).

    TTL: Sessions expire after SESSION_TTL_SECONDS of inactivity.

    NOTE: This is an in-memory store — state is lost on server restart.
    For production: replace with Redis. For hackathon MVP: this is sufficient.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self._store: dict[str, dict] = {}
        self._timestamps: dict[str, float] = {}
        self.ttl_seconds = ttl_seconds

    def get(self, session_id: str) -> Optional[dict]:
        """Retrieve session state. Returns None if expired or not found."""
        self._evict_expired()
        if session_id not in self._store:
            return None
        # Refresh TTL on access
        self._timestamps[session_id] = time.time()
        return self._store[session_id]

    def set(self, session_id: str, state: dict) -> None:
        """Store or update session state."""
        self._store[session_id] = state
        self._timestamps[session_id] = time.time()
        logger.debug(f"Session {session_id[:8]}... updated. Active sessions: {len(self._store)}")

    def delete(self, session_id: str) -> None:
        """Explicitly remove a session (e.g., after order confirmed)."""
        self._store.pop(session_id, None)
        self._timestamps.pop(session_id, None)
        logger.info(f"Session {session_id[:8]}... deleted.")

    def _evict_expired(self) -> None:
        """Remove sessions that have exceeded TTL."""
        now = time.time()
        expired = [
            sid for sid, ts in self._timestamps.items()
            if now - ts > self.ttl_seconds
        ]
        for sid in expired:
            self._store.pop(sid, None)
            self._timestamps.pop(sid, None)
            logger.info(f"Session {sid[:8]}... expired and evicted.")

    @property
    def active_count(self) -> int:
        self._evict_expired()
        return len(self._store)
