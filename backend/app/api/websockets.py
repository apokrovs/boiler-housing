from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
from uuid import UUID
import json
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Map of user_id to their websocket connection
        self.active_connections: Dict[UUID, WebSocket] = {}
        # Map of user_id to the set of conversations they've opened
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

    async def broadcast_conversation_message(self, message_data: dict, conversation_id: UUID,
                                             participant_ids: List[UUID], sender_id: UUID):
        """
        Broadcast a message to all participants in a conversation

        Args:
            message_data: The message data to broadcast
            conversation_id: The ID of the conversation
            participant_ids: List of all participant IDs in the conversation
            sender_id: The ID of the user who sent the message
        """
        notification = {
            "type": "message",
            "conversation_id": str(conversation_id),
            "data": message_data
        }

        # Send to all participants except the sender
        await self.broadcast_to_recipients(notification, participant_ids, [sender_id])

    async def broadcast_message_update(self, message_data: dict, conversation_id: UUID,
                                       participant_ids: List[UUID], updater_id: UUID):
        """
        Broadcast a message update to all participants in a conversation

        Args:
            message_data: The updated message data
            conversation_id: The ID of the conversation
            participant_ids: List of all participant IDs in the conversation
            updater_id: The ID of the user who updated the message
        """
        notification = {
            "type": "message_update",
            "conversation_id": str(conversation_id),
            "data": message_data
        }

        # Send to all participants including the updater
        await self.broadcast_to_recipients(notification, participant_ids)

    async def broadcast_message_delete(self, message_id: UUID, conversation_id: UUID,
                                       participant_ids: List[UUID], deleter_id: UUID):
        """
        Broadcast a message deletion to all participants in a conversation

        Args:
            message_id: The ID of the deleted message
            conversation_id: The ID of the conversation
            participant_ids: List of all participant IDs in the conversation
            deleter_id: The ID of the user who deleted the message
        """
        notification = {
            "type": "message_delete",
            "conversation_id": str(conversation_id),
            "message_id": str(message_id),
            "deleted_at": datetime.utcnow().isoformat(),
            "deleted_by": str(deleter_id)
        }

        # Send to all participants including the deleter
        await self.broadcast_to_recipients(notification, participant_ids)

    async def broadcast_typing_notification(self, typing_user_id: UUID, conversation_id: UUID,
                                            participant_ids: List[UUID]):
        """
        Send typing notification to all participants in a conversation

        Args:
            typing_user_id: The ID of the user who is typing
            conversation_id: The ID of the conversation
            participant_ids: List of all participant IDs in the conversation
        """
        notification = {
            "type": "typing",
            "user_id": str(typing_user_id),
            "conversation_id": str(conversation_id),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Send to all participants except the typing user
        await self.broadcast_to_recipients(notification, participant_ids, [typing_user_id])

    async def broadcast_read_receipt(self, message_id: UUID, conversation_id: UUID,
                                     reader_id: UUID, participant_ids: List[UUID]):
        """
        Send read receipt notification to all participants in a conversation

        Args:
            message_id: The ID of the message that was read
            conversation_id: The ID of the conversation
            reader_id: The ID of the user who read the message
            participant_ids: List of all participant IDs in the conversation
        """
        notification = {
            "type": "read_receipt",
            "message_id": str(message_id),
            "conversation_id": str(conversation_id),
            "reader_id": str(reader_id),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Send to all participants except the reader
        await self.broadcast_to_recipients(notification, participant_ids, [reader_id])

    async def broadcast_user_blocked(self, blocker_id: UUID, blocked_id: UUID):
        """
        Notify a user that they've been blocked

        Args:
            blocker_id: The ID of the user who did the blocking
            blocked_id: The ID of the user who was blocked
        """
        notification = {
            "type": "user_blocked",
            "blocker_id": str(blocker_id),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Notify the blocked user only
        await self.send_personal_message(notification, blocked_id)

    async def broadcast_user_unblocked(self, unblocker_id: UUID, unblocked_id: UUID):
        """
        Notify a user that they've been unblocked

        Args:
            unblocker_id: The ID of the user who did the unblocking
            unblocked_id: The ID of the user who was unblocked
        """
        notification = {
            "type": "user_unblocked",
            "unblocker_id": str(unblocker_id),
            "timestamp": datetime.utcnow().isoformat()
        }

        # Notify the unblocked user only
        await self.send_personal_message(notification, unblocked_id)


# Create a global instance
manager = ConnectionManager()