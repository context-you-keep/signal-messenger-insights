"""API request and response models."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ConversationSummary(BaseModel):
    """Summary of a conversation for the list view."""

    id: str
    name: Optional[str] = None
    type: str  # "private" or "group"
    last_message: Optional[str] = None
    last_message_timestamp: Optional[datetime] = None
    message_count: int = 0
    unread_count: int = 0


class Message(BaseModel):
    """Individual message in a conversation."""

    id: str
    conversation_id: str
    sender_id: Optional[str] = None
    body: Optional[str] = None
    timestamp: datetime
    sent: bool  # True if sent by user, False if received
    has_attachments: bool = False
    quote_id: Optional[str] = None  # For quoted replies


class Attachment(BaseModel):
    """Attachment metadata."""

    id: str
    message_id: str
    content_type: str
    filename: Optional[str] = None
    size: Optional[int] = None
    path: Optional[str] = None  # Path within Signal's attachments directory


class MessagesResponse(BaseModel):
    """Paginated messages response."""

    messages: list[Message]
    total: int
    page: int
    page_size: int
    has_more: bool


class SearchRequest(BaseModel):
    """Search parameters."""

    query: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=50, le=200)


class UploadResponse(BaseModel):
    """Response after uploading Signal files."""

    success: bool
    message: str
    conversation_count: Optional[int] = None


class StatusResponse(BaseModel):
    """Application status."""

    initialized: bool
    mode: Optional[str] = None  # "upload" or "volume"
    conversation_count: Optional[int] = None
