import asyncio
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from starlette.websockets import WebSocketState

from app.crud import messages as message_crud
from app.crud import users as user_crud
from app.api import deps
from app.models.messages import (
    MessageCreate,
    MessagePublic,
    MessagesPublic,
    ConversationsPublic
)
from app.api.websockets import manager
import json
import logging

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
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
                                "timestamp": str(int(asyncio.get_event_loop().time() * 1000))
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
                            "sender_name": str(db_message.sender.full_name),
                            "receiver_ids": [str(r) for r in message_recipients],
                            "content": db_message.content,
                            "is_group_chat": db_message.is_group_chat,
                            "created_at": db_message.created_at.isoformat(),
                            "type": "new_message"
                        }

                        # Try to send to all online recipients
                        online_count = 0
                        receiver_emails = []
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


                            receiver_emails.append(user_crud.get_user(session=session, id=receiver_id).email)



                        # Send confirmation back to the sender
                        await websocket.send_text(json.dumps({
                            "type": "message_sent",
                            "content": db_message.content,
                            "receiver_emails": [str(r) for r in receiver_emails],
                            "message_id": str(db_message.id),
                            "message": str(db_message.content),
                            "status": "delivered" if online_count > 0 else "sent",
                            "online_recipients": online_count,
                            "total_recipients": len(message_recipients)
                        }))

                    elif message_data["type"] == "open_conversation":
                        if "conversation_id" not in message_data or "is_group" not in message_data:
                            await websocket.send_text(
                                json.dumps({"error": "Missing conversation_id or is_group flag"}))
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

                    elif message_data["type"] == "typing":
                        if "conversation_id" not in message_data or "is_group" not in message_data:
                            await websocket.send_text(
                                json.dumps({"error": "Missing conversation_id or is_group flag"}))
                            continue

                        conversation_id = UUID(message_data["conversation_id"])
                        is_group = message_data["is_group"]

                        # For direct messages, recipient_ids is just the conversation_id (other user)
                        # For group chats, we need to get all participants
                        if is_group:
                            # In a real app, you'd fetch group members from a groups table
                            # This is simplified to just use the conversation_id as a participant
                            recipient_ids = [conversation_id]
                        else:
                            recipient_ids = [conversation_id]

                        # Send typing notification to recipients
                        await manager.broadcast_typing_notification(
                            typing_user_id=user_id,
                            conversation_id=conversation_id,
                            recipient_ids=recipient_ids,
                            is_group=is_group
                        )

                    elif message_data["type"] == "read_receipt":
                        if "message_id" not in message_data:
                            await websocket.send_text(json.dumps({"error": "Missing message_id"}))
                            continue

                        message_id = UUID(message_data["message_id"])

                        # Mark message as read
                        success = message_crud.mark_message_as_read(session, message_id, user_id)

                        if success:
                            # Get message to find out the sender
                            message = message_crud.get_message(session, message_id)

                            if message:
                                # For group chats, notify all participants
                                # For direct messages, notify just the sender
                                if message.is_group_chat:
                                    recipients = message_crud.get_message_recipients(session, message_id)
                                    recipients.append(message.sender_id)
                                else:
                                    recipients = [message.sender_id]

                                # Send read receipt to recipients
                                await manager.broadcast_read_receipt(
                                    message_id=message_id,
                                    reader_id=user_id,
                                    recipient_ids=recipients
                                )

                    else:
                        await websocket.send_text(json.dumps({
                            "error": f"Unknown message type: {message_data['type']}"
                        }))

                except asyncio.TimeoutError:
                    # Connection might be dead, send a ping to check
                    try:
                        await websocket.send_text(json.dumps({
                            "type": "ping",
                            "timestamp": str(int(asyncio.get_event_loop().time() * 1000))
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

@router.post("", response_model=MessagePublic)
def create_message(
        *,
        session: deps.SessionDep,
        message_in: MessageCreate,
        current_user: deps.CurrentUser,
) -> Any:
    """
    Create new message.
    """
    message = message_crud.create_message(
        session=session, sender_id=current_user.id, message_in=message_in
    )

    # Get recipients and read receipts for the response
    receiver_ids = message_crud.get_message_recipients(session, message.id)
    read_receipts = message_crud.get_message_read_receipts(session, message.id)

    # Convert to public model
    message_public = MessagePublic(
        id=message.id,
        sender_id=message.sender_id,
        receiver_ids=receiver_ids,
        content=message.content,
        is_group_chat=message.is_group_chat,
        created_at=message.created_at,
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
    Get all conversations for the current user (both direct and group chats).
    """
    conversations, count = message_crud.get_conversations(
        session=session, user_id=current_user.id, skip=skip, limit=limit
    )

    return ConversationsPublic(data=conversations, count=count)


@router.get("/conversation/{conversation_id}", response_model=MessagesPublic)
def get_conversation_messages(
        *,
        session: deps.SessionDep,
        conversation_id: UUID,
        is_group: bool = False,
        current_user: deps.CurrentUser,
        skip: int = 0,
        limit: int = 100,
) -> Any:
    """
    Get messages for a specific conversation.
    For direct messages, conversation_id is the other user's ID.
    For group chats, conversation_id is the conversation's unique ID.
    """
    messages, count = message_crud.get_messages_for_conversation(
        session=session,
        user_id=current_user.id,
        conversation_id=conversation_id,
        is_group=is_group,
        skip=skip,
        limit=limit,
    )

    # Mark messages as read when fetched via API
    message_crud.mark_conversation_as_read(
        session=session,
        user_id=current_user.id,
        conversation_id=conversation_id,
        is_group=is_group
    )

    # Convert to public model with read receipts
    public_messages = []
    for message in messages:
        receiver_ids = message_crud.get_message_recipients(session, message.id)
        read_receipts = message_crud.get_message_read_receipts(session, message.id)

        public_messages.append(
            MessagePublic(
                id=message.id,
                sender_id=message.sender_id,
                receiver_ids=receiver_ids,
                content=message.content,
                is_group_chat=message.is_group_chat,
                created_at=message.created_at,
                read_by=read_receipts
            )
        )

    return MessagesPublic(data=public_messages, count=count)


@router.get("/unread", response_model=int)
def get_unread_count(
        *,
        session: deps.SessionDep,
        current_user: deps.CurrentUser,
        from_user: UUID = Query(None, description="Filter by sender"),
) -> Any:
    """
    Get count of unread messages for the current user.
    """
    return message_crud.get_unread_count(
        session=session,
        user_id=current_user.id,
        sender_id=from_user
    )


@router.post("/{message_id}/read", response_model=bool)
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
            detail="Cannot mark message as read. Either the message doesn't exist or you're not a recipient."
        )

    return True
