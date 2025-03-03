from typing import Any, List, Optional
from uuid import UUID
from warnings import catch_warnings

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query, Depends, status
from sqlmodel import Session

from app.crud import messages as message_crud
from app.api import deps
from app.models.messages import (
    MessageCreate,
    MessagePublic,
    MessageUpdate,
    MessagesPublic,
    Conversation,
    ConversationsPublic
)
from app.api.websockets import manager
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# WebSocket endpoint for real-time messaging
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # Authenticate using the token
    try:
        session = next(deps.get_db())
        user = deps.get_current_user(session=session, token=token)
        user_id = user.id

        # Connect this websocket to the connection manager
        await manager.connect(websocket, user_id)

        try:
            while True:
                # Wait for messages from the client
                data = await websocket.receive_text()
                try:
                    message_data = json.loads(data)

                    # Validate message structure
                    if "type" not in message_data:
                        await websocket.send_text(json.dumps({"error": "Missing message type"}))
                        continue

                    # Handle different message types
                    if message_data["type"] == "message":
                        if "receiver_ids" not in message_data or "content" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing required fields"}))
                            continue

                        # Parse receiver IDs
                        receiver_ids = [UUID(id_str) for id_str in message_data["receiver_ids"]]
                        is_group = len(receiver_ids) > 1 or message_data.get("is_group_chat", False)

                        # Create a message in the database
                        message_create = MessageCreate(
                            receiver_ids=receiver_ids,
                            content=message_data["content"],
                            is_group_chat=is_group
                        )

                        db_message = message_crud.create_message(
                            session=session,
                            sender_id=user_id,
                            message_in=message_create
                        )

                        # Get the message recipients
                        message_recipients = message_crud.get_message_recipients(session, db_message.id)

                        # Convert to dict for sending via WebSocket
                        message_dict = {
                            "id": str(db_message.id),
                            "sender_id": str(db_message.sender_id),
                            "receiver_ids": [str(r) for r in message_recipients],
                            "content": db_message.content,
                            "is_group_chat": db_message.is_group_chat,
                            "created_at": db_message.created_at.isoformat(),
                            "type": "new_message"
                        }

                        # Try to send to all online recipients
                        online_count = 0
                        for receiver_id in message_recipients:
                            if manager.is_online(receiver_id):
                                await manager.send_personal_message(message_dict, receiver_id)
                                online_count += 1

                                # If the receiver has an open conversation with the sender, mark as read
                                # For direct messages
                                if not is_group and manager.has_open_conversation(receiver_id, user_id):
                                    message_crud.mark_message_as_read(session, db_message.id, receiver_id)

                                # For group chats
                                if is_group and any(
                                        manager.has_open_conversation(receiver_id, r) for r in receiver_ids
                                ):
                                    message_crud.mark_message_as_read(session, db_message.id, receiver_id)

                        # Send confirmation back to the sender
                        await websocket.send_text(json.dumps({
                            "type": "message_sent",
                            "message_id": str(db_message.id),
                            "status": "delivered" if online_count > 0 else "sent",
                            "online_recipients": online_count,
                            "total_recipients": len(message_recipients)
                        }))

                    elif message_data["type"] == "open_conversation":
                        if "conversation_id" not in message_data or "is_group" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing conversation_id or is_group flag"}))
                            continue

                        conversation_id = UUID(message_data["conversation_id"])
                        is_group = message_data["is_group"]

                        manager.add_open_conversation(user_id, conversation_id)

                        # Mark messages as read
                        count = message_crud.mark_conversation_as_read(
                            session=session,
                            user_id=user_id,
                            conversation_id=conversation_id,
                            is_group=is_group
                        )

                        await websocket.send_text(json.dumps({
                            "type": "conversation_opened",
                            "conversation_id": str(conversation_id),
                            "is_group": is_group,
                            "messages_read": count
                        }))

                    elif message_data["type"] == "close_conversation":
                        if "conversation_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing conversation_id"}))
                            continue

                        conversation_id = UUID(message_data["conversation_id"])
                        manager.remove_open_conversation(user_id, conversation_id)

                        await websocket.send_text(json.dumps({
                            "type": "conversation_closed",
                            "conversation_id": str(conversation_id)
                        }))

