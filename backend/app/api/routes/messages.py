import asyncio
import uuid
from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query, status, Body
from starlette.websockets import WebSocketState

from app.api.deps import SessionDep
from app.crud import messages as message_crud
from app.crud import users as user_crud
from app.api import deps
from app.models.messages import (
    MessageCreate,
    MessageUpdate,
    MessagePublic,
    ReadReceipt,
    MessagesPublic,
    ConversationCreate,
    ConversationPublic,
    ConversationsPublic,
    UserBlockCreate, Conversation
)
from app.api.websockets import manager
import json
import logging
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time messaging.

    Client should send JSON messages with a "type" field and appropriate payload.
    Server will respond with JSON messages with a "type" field and appropriate response data.

    Message types and required fields:

    1. Create/Send Message:
       Client sends:
       {
           "type": "message",
           "conversation_id": "UUID string", (or "new_conversation": true for new conversations)
           "content": "message text",
           "participant_ids": ["UUID string", "UUID string"], (only required if "new_conversation" is true)
           "is_group": boolean (only required if "new_conversation" is true)
       }

       Server responds:
       {
           "type": "message_sent",
           "message_id": "UUID string",
           "conversation_id": "UUID string",
           "content": "message text",
           "created_at": "ISO timestamp",
           "status": "sent",
           "participant_count": number
       }

    2. Edit Message:
       Client sends:
       {
           "type": "edit_message",
           "message_id": "UUID string",
           "content": "new message text"
       }

       Server responds:
       {
           "type": "message_updated",
           "message_id": "UUID string",
           "conversation_id": "UUID string",
           "content": "updated text",
           "updated_at": "ISO timestamp"
       }

    3. Delete Message:
       Client sends:
       {
           "type": "delete_message",
           "message_id": "UUID string"
       }

       Server responds:
       {
           "type": "message_deleted",
           "message_id": "UUID string",
           "conversation_id": "UUID string",
           "deleted_at": "ISO timestamp"
       }

    4. Open Conversation:
       Client sends:
       {
           "type": "open_conversation",
           "conversation_id": "UUID string"
       }

       Server responds:
       {
           "type": "conversation_opened",
           "conversation_id": "UUID string",
           "is_group": boolean,
           "messages_read": number
       }

    5. Close Conversation:
       Client sends:
       {
           "type": "close_conversation",
           "conversation_id": "UUID string"
       }

       Server responds:
       {
           "type": "conversation_closed",
           "conversation_id": "UUID string"
       }

    6. Typing Notification:
       Client sends:
       {
           "type": "typing",
           "conversation_id": "UUID string"
       }

       Server responds: (to all other participants)
       {
           "type": "typing",
           "user_id": "UUID string",
           "conversation_id": "UUID string",
           "timestamp": "ISO timestamp"
       }

    7. Read Receipt:
       Client sends:
       {
           "type": "read_receipt",
           "message_id": "UUID string",
           "conversation_id": "UUID string"
       }

       Server responds:
       {
           "type": "read_receipt_sent",
           "message_id": "UUID string",
           "conversation_id": "UUID string"
       }

    8. Block User:
       Client sends:
       {
           "type": "block_user",
           "user_id": "UUID string"
       }

       Server responds:
       {
           "type": "user_blocked",
           "blocked_id": "UUID string",
           "created_at": "ISO timestamp"
       }

    9. Unblock User:
       Client sends:
       {
           "type": "unblock_user",
           "user_id": "UUID string"
       }

       Server responds:
       {
           "type": "user_unblocked",
           "unblocked_id": "UUID string",
           "timestamp": "ISO timestamp"
       }
    """
    # Track connection state to avoid multiple close attempts
    connection_closed = False
    # For cleanup
    ping_task = None
    user_id = None

    try:
        # Authenticate using the token
        auth_session = next(deps.get_db())
        try:
            logger.info(f"WebSocket connection attempt with token: {token[:10]}...")
            user = deps.get_current_user(session=auth_session, token=token)
            logger.info(f"Authentication successful for user: {user.id}")
            user_id = user.id
        except Exception as auth_error:
            logger.error(f"Authentication failed: {str(auth_error)}")
            await websocket.close(code=1008, reason="Authentication failed")
            connection_closed = True
            return
        finally:
            # Close the auth session immediately after authentication
            auth_session.close()

        logger.info(f"Accepting connection for user {user_id}")

        # Connect this websocket to the connection manager
        try:
            await manager.connect(websocket, user_id)
            logger.info(f"Connection established for user {user_id}")
        except Exception as conn_error:
            logger.error(f"Connection manager error: {str(conn_error)}")
            if not connection_closed:
                await websocket.close(code=1011, reason="Connection manager error")
                connection_closed = True
            return

        # Set up a ping task to keep the connection alive
        async def send_ping():
            try:
                while True:
                    await asyncio.sleep(20)  # Send ping every 20 seconds
                    if websocket.client_state == WebSocketState.CONNECTED:
                        try:
                            await websocket.send_text(json.dumps({
                                "type": "ping",
                                "timestamp": datetime.utcnow().isoformat()
                            }))
                            logger.debug(f"Ping sent to user {user_id}")
                        except Exception as e:
                            logger.error(f"Error sending ping: {str(e)}")
                            break
            except asyncio.CancelledError:
                # Normal cancellation on disconnect
                pass

        # Start the ping task
        ping_task = asyncio.create_task(send_ping())

        try:
            while True:
                # Wait for messages from the client
                session = next(deps.get_db())
                try:
                    # Use a timeout to detect dead connections
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=90  # 90 seconds timeout (longer than ping interval)
                    )

                    # Process message as before
                    message_data = json.loads(data)

                    # Validate message structure
                    if "type" not in message_data:
                        await websocket.send_text(json.dumps({"error": "Missing message type"}))
                        continue

                    # Handle different message types
                    if message_data["type"] == "message":
                        try:
                            # Check if we need to create a new conversation
                            if "new_conversation" in message_data and message_data["new_conversation"]:
                                # Validate required fields for new conversation
                                if "participant_ids" not in message_data or "is_group" not in message_data:
                                    await websocket.send_text(json.dumps({
                                        "error": "Missing required fields for new conversation"
                                    }))
                                    continue

                                # Convert participant IDs to UUID objects
                                participant_ids = [UUID(id_str) for id_str in message_data["participant_ids"]]

                                # Create a new conversation
                                conversation_create = ConversationCreate(
                                    participant_ids=participant_ids,
                                    is_group=message_data["is_group"],
                                    name=message_data.get("name")
                                )

                                try:
                                    conversation = message_crud.create_conversation(
                                        session=session,
                                        creator_id=user_id,
                                        conversation_in=conversation_create
                                    )
                                    conversation_id = conversation.id
                                except HTTPException as http_ex:
                                    await websocket.send_text(json.dumps({
                                        "type": "error",
                                        "status_code": http_ex.status_code,
                                        "detail": http_ex.detail
                                    }))
                                    continue
                            else:
                                # For existing conversation, validate conversation_id
                                if "conversation_id" not in message_data:
                                    await websocket.send_text(json.dumps({
                                        "error": "Missing conversation_id for existing conversation"
                                    }))
                                    continue

                                conversation_id = UUID(message_data["conversation_id"])

                                # Verify the conversation exists and user is a participant
                                participants = message_crud.get_conversation_participants(session, conversation_id)
                                if not participants or user_id not in participants:
                                    await websocket.send_text(json.dumps({
                                        "type": "error",
                                        "detail": "Conversation not found or you're not a participant"
                                    }))
                                    continue

                            # Validate content
                            if "content" not in message_data:
                                await websocket.send_text(json.dumps({"error": "Missing message content"}))
                                continue

                            # Create a message in the database
                            message_create = MessageCreate(
                                conversation_id=conversation_id,
                                content=message_data["content"]
                            )

                            # Create the message
                            db_message = message_crud.create_message(
                                session=session,
                                sender_id=user_id,
                                message_in=message_create
                            )

                            # Get the conversation participants
                            participant_ids = message_crud.get_conversation_participants(
                                session, db_message.conversation_id
                            )

                            # Get message read receipts
                            _, read_receipts = message_crud.get_message_with_read_status(session, db_message.id)

                            # Convert to dict for sending via WebSocket
                            message_dict = {
                                "id": str(db_message.id),
                                "sender_id": str(db_message.sender_id),
                                "conversation_id": str(db_message.conversation_id),
                                "content": db_message.content,
                                "created_at": db_message.created_at.isoformat(),
                                "read_by": [
                                    {"user_id": str(receipt.user_id),
                                     "read_at": receipt.read_at.isoformat()}
                                    for receipt in read_receipts
                                ]
                            }

                            # Broadcast to all participants except the sender
                            await manager.broadcast_conversation_message(
                                message_data=message_dict,
                                conversation_id=db_message.conversation_id,
                                participant_ids=participant_ids,
                                sender_id=user_id
                            )

                            # Send confirmation back to the sender
                            await websocket.send_text(json.dumps({
                                "type": "message_sent",
                                "message_id": str(db_message.id),
                                "conversation_id": str(db_message.conversation_id),
                                "content": db_message.content,
                                "created_at": db_message.created_at.isoformat(),
                                "status": "sent",
                                "participant_count": len(participant_ids) - 1  # Exclude sender
                            }))
                        except HTTPException as http_ex:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "status_code": http_ex.status_code,
                                "detail": http_ex.detail
                            }))
                        except Exception as e:
                            logger.exception(f"Error creating message: {str(e)}")
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to create message"
                            }))

                    elif message_data["type"] == "edit_message":
                        if "message_id" not in message_data or "content" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing required fields for edit message"}))
                            continue

                        message_id = UUID(message_data["message_id"])
                        content = message_data["content"]

                        try:
                            # Update the message
                            updated_message = message_crud.update_message(
                                session=session,
                                message_id=message_id,
                                user_id=user_id,
                                message_update=MessageUpdate(content=content)
                            )

                            if not updated_message:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "detail": "Message not found or you don't have permission to edit it"
                                }))
                                continue

                            # Get participants to notify about the update
                            participant_ids = message_crud.get_conversation_participants(
                                session, updated_message.conversation_id
                            )

                            # Create update notification
                            message_dict = {
                                "id": str(updated_message.id),
                                "sender_id": str(updated_message.sender_id),
                                "conversation_id": str(updated_message.conversation_id),
                                "content": updated_message.content,
                                "created_at": updated_message.created_at.isoformat(),
                                "updated_at": updated_message.updated_at.isoformat()
                            }

                            # Broadcast update to all participants
                            await manager.broadcast_message_update(
                                message_data=message_dict,
                                conversation_id=updated_message.conversation_id,
                                participant_ids=participant_ids,
                                updater_id=user_id
                            )

                            # Confirm to the sender
                            await websocket.send_text(json.dumps({
                                "type": "message_updated",
                                "message_id": str(updated_message.id),
                                "conversation_id": str(updated_message.conversation_id),
                                "content": updated_message.content,
                                "updated_at": updated_message.updated_at.isoformat()
                            }))
                        except HTTPException as http_ex:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "status_code": http_ex.status_code,
                                "detail": http_ex.detail
                            }))
                        except Exception as e:
                            logger.exception(f"Error updating message: {str(e)}")
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to update message"
                            }))

                    elif message_data["type"] == "delete_message":
                        if "message_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing message_id"}))
                            continue

                        message_id = UUID(message_data["message_id"])

                        try:
                            # Delete the message
                            deleted_message = message_crud.delete_message(
                                session=session,
                                message_id=message_id,
                                user_id=user_id
                            )

                            if not deleted_message:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "detail": "Message not found or you don't have permission to delete it"
                                }))
                                continue

                            # Get participants to notify about the deletion
                            participant_ids = message_crud.get_conversation_participants(
                                session, deleted_message.conversation_id
                            )

                            # Broadcast deletion to all participants
                            await manager.broadcast_message_delete(
                                message_id=message_id,
                                conversation_id=deleted_message.conversation_id,
                                participant_ids=participant_ids,
                                deleter_id=user_id
                            )

                            # Confirm to the sender
                            await websocket.send_text(json.dumps({
                                "type": "message_deleted",
                                "message_id": str(message_id),
                                "conversation_id": str(deleted_message.conversation_id),
                                "deleted_at": deleted_message.deleted_at.isoformat()
                            }))
                        except HTTPException as http_ex:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "status_code": http_ex.status_code,
                                "detail": http_ex.detail
                            }))
                        except Exception as e:
                            logger.exception(f"Error deleting message: {str(e)}")
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to delete message"
                            }))

                    elif message_data["type"] == "open_conversation":
                        if "conversation_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing conversation_id"}))
                            continue

                        conversation_id = UUID(message_data["conversation_id"])

                        # Verify the conversation exists and user is a participant
                        participants = message_crud.get_conversation_participants(session, conversation_id)
                        if user_id not in participants:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "You are not a participant in this conversation"
                            }))
                            continue

                        manager.add_open_conversation(user_id, conversation_id)

                        # Mark messages as read
                        count = message_crud.mark_conversation_as_read(
                            session=session,
                            user_id=user_id,
                            conversation_id=conversation_id
                        )

                        # Get conversation data
                        conversation = message_crud.get_conversation(session, conversation_id)

                        await websocket.send_text(json.dumps({
                            "type": "conversation_opened",
                            "conversation_id": str(conversation_id),
                            "is_group": conversation.is_group,
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

                    elif message_data["type"] == "typing":
                        if "conversation_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing conversation_id"}))
                            continue

                        conversation_id = UUID(message_data["conversation_id"])

                        # Verify the conversation exists and user is a participant
                        participants = message_crud.get_conversation_participants(session, conversation_id)
                        if user_id not in participants:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "You are not a participant in this conversation"
                            }))
                            continue

                        # Send typing notification to all participants
                        await manager.broadcast_typing_notification(
                            typing_user_id=user_id,
                            conversation_id=conversation_id,
                            participant_ids=participants
                        )

                    elif message_data["type"] == "read_receipt":
                        if "message_id" not in message_data or "conversation_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing required fields for read receipt"}))
                            continue

                        message_id = UUID(message_data["message_id"])
                        conversation_id = UUID(message_data["conversation_id"])

                        # Mark message as read
                        success = message_crud.mark_message_as_read(session, message_id, user_id)

                        if success:
                            # Get participants to notify about the read receipt
                            participants = message_crud.get_conversation_participants(session, conversation_id)

                            # Send read receipt to all participants
                            await manager.broadcast_read_receipt(
                                message_id=message_id,
                                conversation_id=conversation_id,
                                reader_id=user_id,
                                participant_ids=participants
                            )

                            await websocket.send_text(json.dumps({
                                "type": "read_receipt_sent",
                                "message_id": str(message_id),
                                "conversation_id": str(conversation_id)
                            }))
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to mark message as read"
                            }))

                    elif message_data["type"] == "block_user":
                        if "user_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing user_id"}))
                            continue

                        blocked_id = UUID(message_data["user_id"])

                        try:
                            # Block the user
                            block = message_crud.block_user(
                                session=session,
                                blocker_id=user_id,
                                blocked_id=blocked_id
                            )

                            # Notify the blocked user
                            await manager.broadcast_user_blocked(
                                blocker_id=user_id,
                                blocked_id=blocked_id
                            )

                            # Confirm to the blocker
                            await websocket.send_text(json.dumps({
                                "type": "user_blocked",
                                "blocked_id": str(blocked_id),
                                "created_at": block.created_at.isoformat()
                            }))
                        except Exception as e:
                            logger.exception(f"Error blocking user: {str(e)}")
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to block user"
                            }))

                    elif message_data["type"] == "unblock_user":
                        if "user_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing user_id"}))
                            continue

                        unblocked_id = UUID(message_data["user_id"])

                        try:
                            # Unblock the user
                            success = message_crud.unblock_user(
                                session=session,
                                blocker_id=user_id,
                                blocked_id=unblocked_id
                            )

                            if success:
                                # Notify the unblocked user
                                await manager.broadcast_user_unblocked(
                                    unblocker_id=user_id,
                                    unblocked_id=unblocked_id
                                )

                                # Confirm to the unblocker
                                await websocket.send_text(json.dumps({
                                    "type": "user_unblocked",
                                    "unblocked_id": str(unblocked_id),
                                    "timestamp": datetime.utcnow().isoformat()
                                }))
                            else:
                                await websocket.send_text(json.dumps({
                                    "type": "error",
                                    "detail": "User was not blocked"
                                }))
                        except Exception as e:
                            logger.exception(f"Error unblocking user: {str(e)}")
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "detail": "Failed to unblock user"
                            }))

                    else:
                        await websocket.send_text(json.dumps({
                            "error": f"Unknown message type: {message_data['type']}"
                        }))

                except asyncio.TimeoutError:
                    # Connection might be dead, send a ping to check
                    try:
                        await websocket.send_text(json.dumps({
                            "type": "ping",
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                    except Exception:
                        # If we can't send a ping, the connection is dead
                        logger.warning(f"WebSocket connection timeout for user {user_id}")
                        break

                except WebSocketDisconnect:
                    # Normal client disconnect
                    logger.info(f"WebSocket disconnected for user {user_id}")
                    break

                except json.JSONDecodeError:
                    # Bad JSON received
                    try:
                        await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
                    except Exception:
                        # If we can't send an error, the connection is probably dead
                        break

                except Exception as e:
                    # Other errors
                    logger.exception(f"Error processing WebSocket message from user {user_id}")
                    try:
                        await websocket.send_text(json.dumps({"error": str(e)}))
                    except Exception:
                        # If we can't send an error, the connection is probably dead
                        break
                finally:
                    session.close()

        except Exception as e:
            logger.exception(f"WebSocket loop error for user {user_id}: {str(e)}")

    except Exception as e:
        logger.exception(f"WebSocket unhandled error: {str(e)}")
    finally:
        # Ensure we properly clean up
        if user_id:
            manager.disconnect(user_id)

        if ping_task:
            ping_task.cancel()
            try:
                await ping_task
            except asyncio.CancelledError:
                pass

        # Only try to close if not already closed
        if not connection_closed and websocket.client_state == WebSocketState.CONNECTED:
            try:
                await websocket.close()
            except Exception:
                # Ignore errors during close
                pass


# REST API endpoints for messaging

@router.post("/conversations", response_model=ConversationPublic)
def create_conversation(
        *,
        session: deps.SessionDep,
        conversation_in: ConversationCreate,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Create a new conversation.
    """
    conversation = message_crud.create_conversation(
        session=session, creator_id=current_user.id, conversation_in=conversation_in
    )

    # Get participants for the response
    participants = message_crud.get_conversation_participants(session, conversation.id)

    # Create the response object
    return ConversationPublic(
        id=conversation.id,
        name=conversation.name,
        is_group=conversation.is_group,
        created_at=conversation.created_at,
        participants=[{"user_id": participant_id} for participant_id in participants],
        last_message=None,
        last_message_time=None,
        unread_count=0
    )


@router.post("/messages", response_model=MessagePublic)
def create_message(
        *,
        session: deps.SessionDep,
        message_in: MessageCreate,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Create a new message.
    """
    message = message_crud.create_message(
        session=session, sender_id=current_user.id, message_in=message_in
    )

    # Get read receipts for the response
    _, read_receipts = message_crud.get_message_with_read_status(session, message.id)

    # Convert to public model
    message_public = MessagePublic(
        id=message.id,
        sender_id=message.sender_id,
        conversation_id=message.conversation_id,
        content=message.content,
        created_at=message.created_at,
        updated_at=message.updated_at,
        deleted=message.deleted,
        read_by=read_receipts
    )

    return message_public


@router.put("/messages/{message_id}", response_model=MessagePublic)
def update_message(
        *,
        session: deps.SessionDep,
        message_id: UUID,
        message_update: MessageUpdate,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Update a message.
    """
    updated_message = message_crud.update_message(
        session=session,
        message_id=message_id,
        user_id=current_user.id,
        message_update=message_update
    )

    if not updated_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Get read receipts for the response
    _, read_receipts = message_crud.get_message_with_read_status(session, message_id)

    # Convert to public model
    message_public = MessagePublic(
        id=updated_message.id,
        sender_id=updated_message.sender_id,
        conversation_id=updated_message.conversation_id,
        content=updated_message.content,
        created_at=updated_message.created_at,
        updated_at=updated_message.updated_at,
        deleted=updated_message.deleted,
        read_by=read_receipts
    )

    return message_public


@router.delete("/messages/{message_id}", response_model=MessagePublic)
def delete_message(
        *,
        session: deps.SessionDep,
        message_id: UUID,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Delete a message.
    """
    deleted_message = message_crud.delete_message(
        session=session,
        message_id=message_id,
        user_id=current_user.id
    )

    if not deleted_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Get read receipts for the response
    _, read_receipts = message_crud.get_message_with_read_status(session, message_id)

    # Convert to public model
    message_public = MessagePublic(
        id=deleted_message.id,
        sender_id=deleted_message.sender_id,
        conversation_id=deleted_message.conversation_id,
        content=deleted_message.content,
        created_at=deleted_message.created_at,
        updated_at=deleted_message.updated_at,
        deleted=deleted_message.deleted,
        read_by=read_receipts
    )

    return message_public


@router.get("/conversations", response_model=ConversationsPublic)
def get_conversations(
        session: deps.SessionDep,
        current_user: deps.CurrentUser,
        skip: int = 0,
        limit: int = 50,
) -> Any:
    """
    Get all conversations for the current user.
    """
    conversations, total = message_crud.get_user_conversations(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )

    # Create conversation public objects
    conversation_publics = []
    for conv_dict in conversations:
        # Create a ConversationPublic object with all required fields
        conversation_public = ConversationPublic(
            id=conv_dict["id"],
            name=conv_dict["name"],
            is_group=conv_dict["is_group"],
            created_at=conv_dict["created_at"],
            last_message=conv_dict["last_message"],
            last_message_time=conv_dict["last_message_time"],
            unread_count=conv_dict["unread_count"],
            participants=conv_dict["participants"]
        )
        conversation_publics.append(conversation_public)

    return ConversationsPublic(data=conversation_publics, count=total)


@router.get("/conversations/{conversation_id}/messages", response_model=MessagesPublic)
def get_conversation_messages(
        *,
        session: deps.SessionDep,
        conversation_id: UUID,
        current_user: deps.CurrentUser,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False
) -> Any:
    """
    Get messages for a specific conversation.
    """
    # Verify user is a participant
    participants = message_crud.get_conversation_participants(session, conversation_id)
    if current_user.id not in participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation"
        )

    messages, count = message_crud.get_conversation_messages(
        session=session,
        conversation_id=conversation_id,
        skip=skip,
        limit=limit,
        include_deleted=include_deleted
    )

    # Mark messages as read when fetched via API
    message_crud.mark_conversation_as_read(
        session=session,
        user_id=current_user.id,
        conversation_id=conversation_id
    )

    # Convert to public model with read receipts
    public_messages = []
    for message in messages:
        _, read_receipts = message_crud.get_message_with_read_status(session, message.id)

        public_messages.append(
            MessagePublic(
                id=message.id,
                sender_id=message.sender_id,
                conversation_id=message.conversation_id,
                content=message.content,
                created_at=message.created_at,
                updated_at=message.updated_at,
                deleted=message.deleted,
                read_by=read_receipts
            )
        )

    return MessagesPublic(data=public_messages, count=count)


@router.get("/conversations/{conversation_id}", response_model=ConversationPublic)
def get_conversation_by_id(*, conversation_id: uuid.UUID, session: SessionDep):
    """
    Get a specific conversation by id.
    """
    conversation = session.get(Conversation, conversation_id)
    return conversation


@router.get("/unread", response_model=int)
def get_unread_count(
        *,
        session: deps.SessionDep,
        current_user: deps.CurrentUser,
        conversation_id: UUID = Query(None, description="Filter by conversation")
) -> Any:
    """
    Get count of unread messages for the current user.
    """
    return message_crud.get_unread_count(
        session=session,
        user_id=current_user.id,
        conversation_id=conversation_id
    )


@router.post("/messages/{message_id}/read", response_model=bool)
def mark_message_read(
        *,
        session: deps.SessionDep,
        message_id: UUID,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Mark a message as read.
    """
    success = message_crud.mark_message_as_read(
        session=session, message_id=message_id, user_id=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark message as read. Either the message doesn't exist or you're not a participant in the conversation."
        )

    return True


@router.post("/conversations/{conversation_id}/read", response_model=int)
def mark_conversation_read(
        *,
        session: deps.SessionDep,
        conversation_id: UUID,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Mark all messages in a conversation as read.
    """
    # Verify user is a participant
    participants = message_crud.get_conversation_participants(session, conversation_id)
    if current_user.id not in participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this conversation"
        )

    count = message_crud.mark_conversation_as_read(
        session=session,
        user_id=current_user.id,
        conversation_id=conversation_id
    )

    return count


@router.post("/users/block", response_model=dict)
def block_user(
        *,
        session: deps.SessionDep,
        block_data: UserBlockCreate,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Block a user.
    """
    block = message_crud.block_user(
        session=session,
        blocker_id=current_user.id,
        blocked_id=block_data.blocked_id
    )

    return {
        "blocker_id": str(block.blocker_id),
        "blocked_id": str(block.blocked_id),
        "created_at": block.created_at.isoformat()
    }


@router.post("/users/{user_id}/unblock", response_model=bool)
def unblock_user(
        *,
        session: deps.SessionDep,
        user_id: UUID,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Unblock a user.
    """
    success = message_crud.unblock_user(
        session=session,
        blocker_id=current_user.id,
        blocked_id=user_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User was not blocked"
        )

    return success

    @router.get("/users/blocked", response_model=List[UUID])
    def get_blocked_users(
            *,
            session: deps.SessionDep,
            current_user: deps.CurrentUser,
    ) -> Any:
        """
        Get all users blocked by the current user.
        """
        return message_crud.get_blocked_users(session, current_user.id)

    @router.get("/users/{user_id}/blocked", response_model=bool)
    def check_user_blocked(
            *,
            session: deps.SessionDep,
            user_id: UUID,
            current_user: deps.CurrentUser,
    ) -> Any:
        """
        Check if a user is blocked by the current user or has blocked the current user.
        """
        return message_crud.is_user_blocked(
            session=session,
            user_id=current_user.id,
            target_id=user_id
        )