from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
from uuid import UUID
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Map of user_id to their websocket connection
        self.active_connections: Dict[UUID, WebSocket] = {}
        # Map of user_id to the set of conversations they've opened
        # For direct messages: conversation_id is the other user's ID
        # For group chats: conversation_id is the group ID
        self.open_conversations: Dict[UUID, Set[UUID]] = {}
        # Lock for WebSocket operations
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: UUID):
        """Connect a new WebSocket for a user"""
        await websocket.accept()
        async with self._lock:
            self.active_connections[user_id] = websocket
            if user_id not in self.open_conversations:
                self.open_conversations[user_id] = set()
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, user_id: UUID):
        """Handle disconnection of a user"""
        # This method is called in a context where async isn't available
        # so we can't use the lock directly
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # We keep the open_conversations entry in case the user reconnects
        logger.info(f"User {user_id} disconnected. Active connections: {len(self.active_connections)}")

    def add_open_conversation(self, user_id: UUID, conversation_id: UUID):
        """Mark that user_id has an open conversation UI with conversation_id"""
        if user_id not in self.open_conversations:
            self.open_conversations[user_id] = set()
        self.open_conversations[user_id].add(conversation_id)

    def remove_open_conversation(self, user_id: UUID, conversation_id: UUID):
        """Mark that user_id has closed the conversation UI with conversation_id"""
        if user_id in self.open_conversations:
            self.open_conversations[user_id].discard(conversation_id)

    def is_online(self, user_id: UUID) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.active_connections

    def has_open_conversation(self, user_id: UUID, conversation_id: UUID) -> bool:
        """Check if a user has an open conversation with conversation_id"""
        if user_id not in self.open_conversations:
            return False
        return conversation_id in self.open_conversations[user_id]

    async def send_personal_message(self, message: dict, user_id: UUID):
        """Send a message to a specific user if they are connected"""
        async with self._lock:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_text(json.dumps(message))

    async def broadcast_to_recipients(self, message: dict, recipient_ids: List[UUID], exclude_ids: List[UUID] = None):
        """Send a message to multiple recipients, excluding specified users"""
        exclude_ids = exclude_ids or []

        for recipient_id in recipient_ids:
            if recipient_id in exclude_ids:
                continue

            if recipient_id in self.active_connections:
                try:
                    await self.active_connections[recipient_id].send_text(json.dumps(message))
                except Exception as e:
                    logger.exception(f"Error sending message to {recipient_id}: {str(e)}")

    async def broadcast_typing_notification(self, typing_user_id: UUID, conversation_id: UUID,
                                            recipient_ids: List[UUID], is_group: bool):
        """Send typing notification to all recipients in a conversation"""
        notification = {
            "type": "typing",
            "user_id": str(typing_user_id),
            "conversation_id": str(conversation_id),
            "is_group": is_group
        }

        await self.broadcast_to_recipients(notification, recipient_ids, [typing_user_id])

    async def broadcast_read_receipt(self, message_id: UUID, reader_id: UUID, recipient_ids: List[UUID]):
        """Send read receipt notification to all recipients of a message"""
        notification = {
            "type": "read_receipt",
            "message_id": str(message_id),
            "reader_id": str(reader_id),
            "timestamp": str(int(asyncio.get_event_loop().time() * 1000))  # milliseconds since epoch
        }

        await self.broadcast_to_recipients(notification, recipient_ids, [reader_id])


# Create a global instance
manager = ConnectionManager()
