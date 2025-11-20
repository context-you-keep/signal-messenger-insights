"""Database queries for Signal conversations and messages."""
import logging
import sqlite3
from datetime import datetime
from typing import Optional

from app.models.schemas import Attachment, ConversationSummary, Message, MessagesResponse

logger = logging.getLogger(__name__)


class SignalDatabase:
    """Query interface for decrypted Signal database."""

    def __init__(self, conn: sqlite3.Connection):
        """
        Initialize database query interface.

        Args:
            conn: SQLite connection to the decrypted Signal database
        """
        self.conn = conn
        self.conn.row_factory = sqlite3.Row  # Enable column access by name

    def get_conversations(self, limit: int = 100) -> list[ConversationSummary]:
        """
        Get list of all conversations.

        Args:
            limit: Maximum number of conversations to return

        Returns:
            List of conversation summaries
        """
        query = """
        SELECT
            c.id,
            c.name,
            c.type,
            c.lastMessage,
            c.timestamp as last_message_timestamp,
            COUNT(m.id) as message_count,
            SUM(CASE WHEN m.readStatus = 0 THEN 1 ELSE 0 END) as unread_count
        FROM conversations c
        LEFT JOIN messages m ON m.conversationId = c.id
        GROUP BY c.id
        ORDER BY c.timestamp DESC
        LIMIT ?
        """

        try:
            cursor = self.conn.execute(query, (limit,))
            conversations = []

            for row in cursor:
                conversations.append(
                    ConversationSummary(
                        id=row["id"],
                        name=row["name"],
                        type=row["type"] or "private",
                        last_message=row["lastMessage"],
                        last_message_timestamp=(
                            datetime.fromtimestamp(row["last_message_timestamp"] / 1000)
                            if row["last_message_timestamp"]
                            else None
                        ),
                        message_count=row["message_count"] or 0,
                        unread_count=row["unread_count"] or 0,
                    )
                )

            logger.info(f"Retrieved {len(conversations)} conversations")
            return conversations

        except sqlite3.Error as e:
            logger.error(f"Database error retrieving conversations: {e}")
            return []

    def get_messages(
        self,
        conversation_id: str,
        page: int = 1,
        page_size: int = 50,
    ) -> MessagesResponse:
        """
        Get messages for a specific conversation with pagination.

        Args:
            conversation_id: ID of the conversation
            page: Page number (1-indexed)
            page_size: Number of messages per page

        Returns:
            Paginated messages response
        """
        offset = (page - 1) * page_size

        # Get total count
        count_query = "SELECT COUNT(*) as total FROM messages WHERE conversationId = ?"
        cursor = self.conn.execute(count_query, (conversation_id,))
        total = cursor.fetchone()["total"]

        # Get messages for this page
        query = """
        SELECT
            id,
            conversationId as conversation_id,
            sourceServiceId as sender_id,
            body,
            sent_at as timestamp,
            type,
            hasAttachments as has_attachments,
            quote
        FROM messages
        WHERE conversationId = ?
        ORDER BY sent_at ASC
        LIMIT ? OFFSET ?
        """

        try:
            cursor = self.conn.execute(query, (conversation_id, page_size, offset))
            messages = []

            for row in cursor:
                messages.append(
                    Message(
                        id=row["id"],
                        conversation_id=row["conversation_id"],
                        sender_id=row["sender_id"],
                        body=row["body"],
                        timestamp=datetime.fromtimestamp(row["timestamp"] / 1000),
                        sent=(row["type"] == "outgoing"),
                        has_attachments=bool(row["has_attachments"]),
                        quote_id=row["quote"],
                    )
                )

            has_more = (offset + len(messages)) < total

            logger.info(
                f"Retrieved {len(messages)} messages for conversation {conversation_id} "
                f"(page {page}/{(total + page_size - 1) // page_size})"
            )

            return MessagesResponse(
                messages=messages,
                total=total,
                page=page,
                page_size=page_size,
                has_more=has_more,
            )

        except sqlite3.Error as e:
            logger.error(f"Database error retrieving messages: {e}")
            return MessagesResponse(
                messages=[], total=0, page=page, page_size=page_size, has_more=False
            )

    def search_messages(
        self,
        query: str,
        conversation_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[Message]:
        """
        Search messages by text content.

        Args:
            query: Search query string
            conversation_id: Optional conversation ID to limit search
            limit: Maximum number of results

        Returns:
            List of matching messages
        """
        sql = """
        SELECT
            id,
            conversationId as conversation_id,
            sourceServiceId as sender_id,
            body,
            sent_at as timestamp,
            type,
            hasAttachments as has_attachments,
            quote
        FROM messages
        WHERE body LIKE ?
        """

        params = [f"%{query}%"]

        if conversation_id:
            sql += " AND conversationId = ?"
            params.append(conversation_id)

        sql += " ORDER BY sent_at DESC LIMIT ?"
        params.append(limit)

        try:
            cursor = self.conn.execute(sql, params)
            messages = []

            for row in cursor:
                messages.append(
                    Message(
                        id=row["id"],
                        conversation_id=row["conversation_id"],
                        sender_id=row["sender_id"],
                        body=row["body"],
                        timestamp=datetime.fromtimestamp(row["timestamp"] / 1000),
                        sent=(row["type"] == "outgoing"),
                        has_attachments=bool(row["has_attachments"]),
                        quote_id=row["quote"],
                    )
                )

            logger.info(f"Search for '{query}' returned {len(messages)} results")
            return messages

        except sqlite3.Error as e:
            logger.error(f"Database error during search: {e}")
            return []

    def get_conversation_count(self) -> int:
        """Get total number of conversations."""
        try:
            cursor = self.conn.execute("SELECT COUNT(*) as count FROM conversations")
            return cursor.fetchone()["count"]
        except sqlite3.Error as e:
            logger.error(f"Error counting conversations: {e}")
            return 0

    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
