from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlmodel import Session, select, and_
import json
import uuid
from typing import Dict, Set, Any, List

from app.api import deps
from app.api.deps import SessionDep, CurrentUser
from app.core.security import decode_token
from app.models.users import User
from app.models.messages import (
    ConversationParticipant, Message,
    ConversationCreate, MessageCreate, ConversationRead, MessageRead
)
from app.crud.messages import (
    get_conversation, get_conversations_for_user, create_conversation,
    get_messages, create_message, create_read_receipt, toggle_read_receipts,
    check_participant
)

router = APIRouter(prefix="/chat", tags=["chat"])


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # Map user_id to WebSocket connection
        self.active_connections: Dict[uuid.UUID, WebSocket] = {}
        # Map conversation_id to set of connected user_ids
        self.conversation_participants: Dict[uuid.UUID, Set[uuid.UUID]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: uuid.UUID):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            # Remove user from all conversation participants
            for conv_id in list(self.conversation_participants.keys()):
                if user_id in self.conversation_participants[conv_id]:
                    self.conversation_participants[conv_id].remove(user_id)
                    # Clean up empty conversations
                    if not self.conversation_participants[conv_id]:
                        del self.conversation_participants[conv_id]

    def register_conversation_participant(self, conversation_id: uuid.UUID, user_id: uuid.UUID):
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        self.conversation_participants[conversation_id].add(user_id)

    async def send_personal_message(self, user_id: uuid.UUID, message: Dict[str, Any]):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))

    async def broadcast_to_conversation(self, conversation_id: uuid.UUID, message: Dict[str, Any],
                                        exclude_user_id: uuid.UUID = None):
        if conversation_id in self.conversation_participants:
            for user_id in self.conversation_participants[conversation_id]:
                if user_id != exclude_user_id and user_id in self.active_connections:
                    await self.active_connections[user_id].send_text(json.dumps(message))


manager = ConnectionManager()


# Auth for WebSockets
async def get_current_user_ws(token: str, db: Session):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None

        user = db.get(User, uuid.UUID(user_id))
        if user is None:
            return None

        return user
    except:
        return None


# WebSocket endpoint
@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(deps.get_db)):
    user = await get_current_user_ws(token, db)
    if user is None:
        await websocket.close(code=1008)  # Policy violation
        return

    await manager.connect(websocket, user.id)

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message_type = message_data.get("type")

            if message_type == "join_conversation":
                conversation_id = uuid.UUID(message_data["conversation_id"])

                # Check if user is participant
                if not check_participant(db, conversation_id, user.id):
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Not a participant in this conversation"
                    }))
                    continue

                manager.register_conversation_participant(conversation_id, user.id)

                # Send confirmation
                await websocket.send_text(json.dumps({
                    "type": "joined",
                    "conversation_id": str(conversation_id)
                }))

            elif message_type == "leave_conversation":
                conversation_id = uuid.UUID(message_data["conversation_id"])
                if conversation_id in manager.conversation_participants:
                    if user.id in manager.conversation_participants[conversation_id]:
                        manager.conversation_participants[conversation_id].remove(user.id)

                # Send confirmation
                await websocket.send_text(json.dumps({
                    "type": "left",
                    "conversation_id": str(conversation_id)
                }))

            elif message_type == "send_message":
                conversation_id = uuid.UUID(message_data["conversation_id"])
                content = message_data["content"]

                # Check if user is participant
                if not check_participant(db, conversation_id, user.id):
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Not a participant in this conversation"
                    }))
                    continue

                # Create message
                msg_create = MessageCreate(
                    content=content,
                    conversation_id=conversation_id
                )
                db_message = create_message(db, msg_create, user.id)

                # Format for sending
                message_out = {
                    "type": "message",
                    "message_id": str(db_message.id),
                    "conversation_id": str(conversation_id),
                    "sender_id": str(user.id),
                    "content": content,
                    "sent_at": db_message.sent_at.isoformat()
                }

                # Send to sender for confirmation
                await websocket.send_text(json.dumps(message_out))

                # Broadcast to other participants
                await manager.broadcast_to_conversation(
                    conversation_id, message_out, exclude_user_id=user.id
                )

            elif message_type == "read_receipt":
                message_id = uuid.UUID(message_data["message_id"])
                conversation_id = uuid.UUID(message_data["conversation_id"])

                # Check if user is participant
                if not check_participant(db, conversation_id, user.id):
                    continue

                # Check message exists and belongs to conversation
                message = db.get(Message, message_id)
                if message and message.conversation_id == conversation_id:
                    # Create read receipt
                    receipt = create_read_receipt(db, message_id, user.id)

                    # Check if read receipts are enabled for this user
                    stmt = select(ConversationParticipant).where(
                        and_(
                            ConversationParticipant.conversation_id == conversation_id,
                            ConversationParticipant.user_id == user.id
                        )
                    )
                    participant = db.exec(stmt).first()

                    if participant and participant.enable_read_receipts:
                        # Broadcast read receipt
                        receipt_data = {
                            "type": "read_receipt",
                            "message_id": str(message_id),
                            "conversation_id": str(conversation_id),
                            "user_id": str(user.id),
                            "read_at": receipt.read_at.isoformat()
                        }

                        await manager.broadcast_to_conversation(conversation_id, receipt_data)

    except WebSocketDisconnect:
        manager.disconnect(user.id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user.id)


# HTTP routes for conversations and messages
@router.get("/conversations", response_model=List[ConversationRead])
def get_user_conversations(
        db: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100
):
    """Get all conversations for the current user"""
    conversations_data = get_conversations_for_user(db, current_user.id, skip, limit)

    result = []
    for conversation, latest_date, unread_count, total_count in conversations_data:
        # Get participant count
        participant_count = len(conversation.participants_link)

        result.append(ConversationRead(
            id=conversation.id,
            name=conversation.name,
            is_group=conversation.is_group,
            created_at=conversation.created_at,
            updated_at=latest_date,
            participant_count=participant_count,
            unread_count=unread_count,
            total_messages=total_count
        ))

    return result


@router.post("/conversations", response_model=ConversationRead)
def create_new_conversation(
        conversation: ConversationCreate,
        current_user: CurrentUser,
        db: Session = Depends(deps.get_db)
):
    """Create a new conversation"""
    # Validate participants exist
    for participant_id in conversation.participant_ids:
        if not db.get(User, participant_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {participant_id} not found"
            )

    # Create conversation
    db_conversation = create_conversation(db, conversation, current_user.id)

    # Return formatted response
    return ConversationRead(
        id=db_conversation.id,
        name=db_conversation.name,
        is_group=db_conversation.is_group,
        created_at=db_conversation.created_at,
        updated_at=db_conversation.updated_at,
        participant_count=len(db_conversation.participants_link)
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def read_conversation(
        conversation_id: uuid.UUID,
        db: SessionDep,
        current_user: CurrentUser
):
    """Get a specific conversation"""
    # Check if user is participant
    if not check_participant(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation"
        )

    conversation = get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Count participants
    participant_count = len(conversation.participants_link)

    return ConversationRead(
        id=conversation.id,
        name=conversation.name,
        is_group=conversation.is_group,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        participant_count=participant_count
    )


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageRead])
def read_conversation_messages(
        conversation_id: uuid.UUID,
        db: SessionDep,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 100,
):
    """Get messages for a specific conversation"""
    # Check if user is participant
    if not check_participant(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation"
        )

    messages = get_messages(db, conversation_id, skip, limit)

    result = []
    for message in messages:
        # Get read receipts
        read_by = [receipt.user_id for receipt in message.read_receipts]

        result.append(MessageRead(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            content=message.content,
            sent_at=message.sent_at,
            read_by=read_by
        ))

        # Mark as read if not sender
        if message.sender_id != current_user.id:
            create_read_receipt(db, message.id, current_user.id)

    return result


@router.post("/conversations/{conversation_id}/toggle-read-receipts")
def toggle_read_receipts_endpoint(
        conversation_id: uuid.UUID,
        enable: bool,
        db: SessionDep,
        current_user: CurrentUser
):
    """Toggle read receipts for current user in a conversation"""
    # Check if user is participant
    if not check_participant(db, conversation_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation"
        )

    success = toggle_read_receipts(db, conversation_id, current_user.id, enable)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation participant not found"
        )

    return {"status": "success", "enable_read_receipts": enable}
