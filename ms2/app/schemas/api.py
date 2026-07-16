"""
Standard API Response Contract for MS2.

Every endpoint that returns JSON uses StandardResponse.
This ensures React always knows what shape to expect.
"""

from typing import Any, Optional
from pydantic import BaseModel


class StandardResponse(BaseModel):
    """
    Universal response wrapper for all MS2 endpoints.

    Fields:
        success:     Was the operation successful?
        message:     Human-readable message (also the TTS text)
        audio_base64: Base64-encoded MP3 audio of the message (gTTS)
        language:    Detected language of the conversation: "en" | "hi"
        session_id:  Conversation session ID for multi-turn interactions
        status:      Conversation status (clarifying | draft_ready | confirmed | etc.)
        data:        Payload — varies by endpoint and status
        error:       Error detail if success=False
    """

    success: bool
    message: str
    audio_base64: Optional[str] = None
    language: str = "hi"
    session_id: Optional[str] = None
    status: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class ConversationStatus:
    """Enum-like constants for conversation status values."""
    CLARIFYING = "clarifying"
    COLLECTING_SHOP_INFO = "collecting_shop_info"
    DRAFT_READY = "draft_ready"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    ERROR = "error"
