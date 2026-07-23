"""
session_store.py — Structured in-memory conversation session store.

Stores active voice order sessions with the full architecture structure:

  {
    "session": {
      "session_id": "...",
      "salesman_id": "...",
      "language": "hinglish",
      "started_at": "...",
      "last_activity": "...",
      "status": "active"
    },
    "memory": {
      "summary": "",
      "current_step": "idle",
      "pending_tool": null,
      "clarification_state": null,
      "selected_shop": null,
      "draft_order": null,
      "selected_products": [],
      "reply_language": "hinglish",
      "recent_messages": []   ← [{ role, content, timestamp }]
    },
    "business_cache": {
      "shops": [],
      "products": [],
      "last_refresh": null
    }
  }

Entries expire after SESSION_TTL_SECONDS of inactivity.
Thread-safe for single-process use (FastAPI default).
"""

import threading
import time
from typing import Optional, Any

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _now() -> str:
    """ISO timestamp string."""
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _make_session(session_id: str, salesman_id: str = "", language: str = "hinglish") -> dict:
    """Create a fresh session record with the full architecture structure."""
    return {
        "session": {
            "session_id": session_id,
            "salesman_id": salesman_id,
            "language": language,
            "started_at": _now(),
            "last_activity": _now(),
            "status": "active",
        },
        "memory": {
            "summary": "",
            "current_step": "idle",
            "pending_tool": None,
            "clarification_state": None,
            "selected_shop": None,
            "draft_order": None,
            "selected_products": [],
            "reply_language": language,
            "recent_messages": [],   # [{ role, content, timestamp }]
        },
        "business_cache": {
            "shops": [],
            "products": [],
            "last_refresh": None,
        },
    }


class SessionStore:
    """
    Thread-safe in-memory session store with TTL expiry.

    Usage:
        store = SessionStore(ttl_seconds=1800)
        store.create(session_id, salesman_id="uuid", language="hinglish")
        session = store.get(session_id)
        store.update_memory(session_id, { "selected_shop": {...} })
        store.update_cache(session_id, shops=[...], products=[...])
        store.append_message(session_id, role="user", content="...")
        store.delete(session_id)
    """

    def __init__(self, ttl_seconds: int = 1800):
        self._store: dict[str, dict] = {}
        self._ttl = ttl_seconds
        self._lock = threading.Lock()
        logger.info(f"SessionStore initialized | TTL={ttl_seconds}s (in-memory)")

    # ── Core Operations ──────────────────────────────────────────────────────

    def create(self, session_id: str, salesman_id: str = "", language: str = "hinglish") -> dict:
        """Create a new session and return it."""
        record = _make_session(session_id, salesman_id, language)
        with self._lock:
            self._store[session_id] = {
                "data": record,
                "expires_at": time.time() + self._ttl,
            }
        logger.info(f"Session created | id={session_id[:8]}...")
        return record

    def get(self, session_id: str) -> Optional[dict]:
        """Return the full session record or None if expired/not found."""
        with self._lock:
            entry = self._store.get(session_id)
            if entry is None:
                return None
            if time.time() > entry["expires_at"]:
                del self._store[session_id]
                logger.info(f"Session expired | id={session_id[:8]}...")
                return None
            # Bump TTL on access
            entry["expires_at"] = time.time() + self._ttl
            entry["data"]["session"]["last_activity"] = _now()
            return entry["data"]

    def delete(self, session_id: str) -> None:
        """Remove a session (called on order complete, cancel, or explicit end)."""
        with self._lock:
            self._store.pop(session_id, None)
        logger.info(f"Session deleted | id={session_id[:8]}...")

    def exists(self, session_id: str) -> bool:
        return self.get(session_id) is not None

    # ── Granular Update Helpers ──────────────────────────────────────────────

    def update_memory(self, session_id: str, updates: dict[str, Any]) -> None:
        """Merge updates into the session's memory block."""
        with self._lock:
            entry = self._store.get(session_id)
            if entry:
                entry["data"]["memory"].update(updates)
                entry["data"]["session"]["last_activity"] = _now()
                entry["expires_at"] = time.time() + self._ttl

    def update_cache(self, session_id: str, shops: list, products: list) -> None:
        """Update the business context cache (called once per session on first turn)."""
        with self._lock:
            entry = self._store.get(session_id)
            if entry:
                entry["data"]["business_cache"]["shops"]    = shops
                entry["data"]["business_cache"]["products"] = products
                entry["data"]["business_cache"]["last_refresh"] = _now()
                entry["expires_at"] = time.time() + self._ttl

    def append_message(self, session_id: str, role: str, content: str) -> None:
        """Append a message to recent_messages (keeps last 10 turns = 20 messages)."""
        with self._lock:
            entry = self._store.get(session_id)
            if entry:
                messages = entry["data"]["memory"]["recent_messages"]
                messages.append({"role": role, "content": content, "timestamp": _now()})
                # Keep only last 20 messages (10 turns)
                if len(messages) > 20:
                    entry["data"]["memory"]["recent_messages"] = messages[-20:]
                entry["data"]["session"]["last_activity"] = _now()
                entry["expires_at"] = time.time() + self._ttl

    def get_memory(self, session_id: str) -> Optional[dict]:
        """Shortcut to get just the memory block."""
        record = self.get(session_id)
        return record["memory"] if record else None

    def get_cache(self, session_id: str) -> Optional[dict]:
        """Shortcut to get just the business cache block."""
        record = self.get(session_id)
        return record["business_cache"] if record else None

    def active_count(self) -> int:
        """Return number of active sessions (useful for health endpoint)."""
        with self._lock:
            now = time.time()
            return sum(1 for e in self._store.values() if e["expires_at"] > now)
