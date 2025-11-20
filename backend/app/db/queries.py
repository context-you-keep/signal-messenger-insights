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
                 (can be sqlite3.Connection or pysqlcipher3.Connection)
        """
        self.conn = conn
        # Use dict_factory instead of sqlite3.Row for pysqlcipher3 compatibility
        def dict_factory(cursor, row):
            return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
        self.conn.row_factory = dict_factory

    def get_conversations(self, limit: int = 100) -> list[ConversationSummary]:
        """
        Get list of all conversations.

        Args:
            limit: Maximum number of conversations to return

        Returns:
            List of conversation summaries
        """
        # First, introspect the schema to see what we have
        logger.info("Introspecting conversations table schema...")
        try:
            cursor = self.conn.execute("PRAGMA table_info(conversations)")
            columns = [row[1] for row in cursor.fetchall()]
            logger.info(f"Conversations columns: {columns}")
        except Exception as e:
            logger.error(f"Failed to introspect schema: {e}")

        # Simplified query that just gets basic conversation data
        query = """
        SELECT *
        FROM conversations
        ORDER BY active_at DESC
        LIMIT ?
        """

        try:
            cursor = self.conn.execute(query, (limit,))
            conversations = []

            for row in cursor:
                # Log first row to see what data we have
                if not conversations:
                    logger.info(f"First conversation row keys: {list(row.keys())}")
                    logger.info(f"First conversation sample: {dict(list(row.items())[:5])}")

                # Parse JSON blob to extract message count and last message
                message_count = 0
                unread_count = 0
                last_message = None
                if row.get("json"):
                    try:
                        import json
                        json_data = json.loads(row.get("json"))
                        message_count = json_data.get("messageCount", 0)
                        unread_count = json_data.get("unreadCount", 0)
                        last_message = json_data.get("lastMessage")
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse JSON for conversation {row.get('id')}")

                conversations.append(
                    ConversationSummary(
                        id=row.get("id", "unknown"),
                        name=row.get("name") or row.get("profileName") or row.get("e164") or "Unknown",
                        type=row.get("type", "private"),
                        last_message=last_message,
                        last_message_timestamp=(
                            datetime.fromtimestamp(row.get("active_at", 0) / 1000)
                            if row.get("active_at")
                            else None
                        ),
                        message_count=message_count,
                        unread_count=unread_count,
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

        # Introspect messages table schema
        logger.info("Introspecting messages table schema...")
        try:
            cursor = self.conn.execute("PRAGMA table_info(messages)")
            columns = [row[1] for row in cursor.fetchall()]
            logger.info(f"Messages table columns: {columns}")
        except Exception as e:
            logger.error(f"Failed to introspect messages schema: {e}")

        # Get messages for this page - use SELECT * to avoid missing column errors
        # ORDER BY DESC to show newest messages first
        query = """
        SELECT *
        FROM messages
        WHERE conversationId = ?
        ORDER BY sent_at DESC
        LIMIT ? OFFSET ?
        """

        try:
            cursor = self.conn.execute(query, (conversation_id, page_size, offset))
            messages = []

            for row in cursor:
                # Log first row to see what we have
                if not messages:
                    logger.info(f"First message row keys: {list(row.keys())}")
                    logger.info(f"First message sample: {dict(list(row.items())[:10])}")

                messages.append(
                    Message(
                        id=row.get("id"),
                        conversation_id=row.get("conversationId"),
                        sender_id=row.get("sourceServiceId") or row.get("source"),
                        body=row.get("body"),
                        timestamp=datetime.fromtimestamp(row.get("sent_at", 0) / 1000) if row.get("sent_at") else datetime.now(),
                        sent=(row.get("type") == "outgoing"),
                        has_attachments=bool(row.get("hasAttachments", 0)),
                        quote_id=row.get("quote"),  # May be None if column doesn't exist
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
        SELECT *
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
                        id=row.get("id"),
                        conversation_id=row.get("conversationId"),
                        sender_id=row.get("sourceServiceId") or row.get("source"),
                        body=row.get("body"),
                        timestamp=datetime.fromtimestamp(row.get("sent_at", 0) / 1000) if row.get("sent_at") else datetime.now(),
                        sent=(row.get("type") == "outgoing"),
                        has_attachments=bool(row.get("hasAttachments", 0)),
                        quote_id=row.get("quote"),
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
