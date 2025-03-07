from typing import List, Optional, Tuple
from uuid import UUID

from sqlmodel import Session, select, or_, and_, func, col
import datetime
from fastapi import HTTPException

from app.models.messages import (
    Message,
    MessageCreate,
    MessageUpdate,
    MessageReadStatus,
    ReadReceipt,
    Conversation,
    ConversationCreate,
    ConversationParticipant,
    UserBlock
)


# User Blocking CRUD Operations
def block_user(
        session: Session,
        blocker_id: UUID,
        blocked_id: UUID
) -> UserBlock:
    """Block a user"""
    # Check if already blocked
    existing = session.exec(
        select(UserBlock).where(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id
        )
    ).first()

    if existing:
        return existing

    # Create block
    block = UserBlock(
        blocker_id=blocker_id,
        blocked_id=blocked_id
    )
    session.add(block)
    session.commit()
    session.refresh(block)
    return block


def unblock_user(
        session: Session,
        blocker_id: UUID,
        blocked_id: UUID
) -> bool:
    """Unblock a user"""
    block = session.exec(
        select(UserBlock).where(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id
        )
    ).first()

    if not block:
        return False

    session.delete(block)
    session.commit()
    return True


def get_blocked_users(
        session: Session,
        user_id: UUID
) -> List[UUID]:
    """Get all users blocked by a user"""
    query = select(UserBlock.blocked_id).where(
        UserBlock.blocker_id == user_id
    )
    return [blocked_id for blocked_id in session.exec(query)]


def is_user_blocked(
        session: Session,
        user_id: UUID,
        target_id: UUID
) -> bool:
    """Check if a user is blocked by another user"""
    block = session.exec(
        select(UserBlock).where(
            or_(
                and_(
                    UserBlock.blocker_id == user_id,
                    UserBlock.blocked_id == target_id
                ),
                and_(
                    UserBlock.blocker_id == target_id,
                    UserBlock.blocked_id == user_id
                )
            )
        )
    ).first()

    return block is not None


# Conversation CRUD Operations
def create_conversation(
        session: Session,
        *,
        creator_id: UUID,
        conversation_in: ConversationCreate
) -> Conversation:
    """Create a new conversation with multiple participants"""
    # Check for blocked users
    participant_ids = set(conversation_in.participant_ids)
    participant_ids.add(creator_id)  # Always include the creator

    # Check if any participants have blocked each other
    for user_id in participant_ids:
        blocked_users = get_blocked_users(session, user_id)
        for blocked_id in blocked_users:
            if blocked_id in participant_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot create conversation with blocked users"
                )

    # Create the base conversation
    db_conversation = Conversation(
        name=conversation_in.name,
        is_group=conversation_in.is_group
    )
    session.add(db_conversation)
    session.flush()  # Flush to get the conversation ID

    # Create the participant entries
    for participant_id in participant_ids:
        participant = ConversationParticipant(
            conversation_id=db_conversation.id,
            user_id=participant_id
        )
        session.add(participant)

    session.commit()
    session.refresh(db_conversation)
    return db_conversation


def get_conversation(session: Session, conversation_id: UUID) -> Optional[Conversation]:
    """Get a conversation by ID with its participants"""
    return session.get(Conversation, conversation_id)


def get_conversation_participants(session: Session, conversation_id: UUID) -> List[UUID]:
    """Get all participant IDs for a conversation"""
    query = select(ConversationParticipant.user_id).where(
        ConversationParticipant.conversation_id == conversation_id
    )
    return [user_id for user_id in session.exec(query)]


def get_user_conversations(
        session: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
) -> Tuple[List[dict], int]:
    """Get all conversations for a user excluding those with blocked users"""
    # Get IDs of users that this user has blocked or is blocked by
    blocked_query = select(UserBlock.blocked_id, UserBlock.blocker_id).where(
        or_(
            UserBlock.blocker_id == user_id,
            UserBlock.blocked_id == user_id
        )
    )
    blocked_relationships = session.exec(blocked_query).all()

    # Extract all blocked user IDs
    blocked_ids = set()
    for blocker_id, blocked_id in blocked_relationships:
        if blocker_id == user_id:
            blocked_ids.add(blocked_id)
        else:
            blocked_ids.add(blocker_id)

    # Find conversations where user is a participant
    query = select(Conversation).where(
        Conversation.id.in_(
            select(ConversationParticipant.conversation_id).where(
                ConversationParticipant.user_id == user_id
            )
        )
    )

    # Count total before filtering out blocked users
    total_query = select(func.count()).where(
        Conversation.id.in_(
            select(ConversationParticipant.conversation_id).where(
                ConversationParticipant.user_id == user_id
            )
        )
    )
    total = session.exec(total_query).one()

    # Get paginated conversations
    conversations = session.exec(query.offset(skip).limit(limit)).all()

    # For each conversation, get additional info and filter out direct conversations with blocked users
    result = []
    for conversation in conversations:
        # Get participant IDs
        participants = get_conversation_participants(session, conversation.id)

        # Skip one-on-one conversations with blocked users
        if not conversation.is_group and len(participants) == 2:
            other_user = next((p for p in participants if p != user_id), None)
            if other_user and other_user in blocked_ids:
                continue

        # Get the last message
        last_message_query = select(Message).where(
            Message.conversation_id == conversation.id,
            Message.deleted == False
        ).order_by(Message.created_at.desc()).limit(1)

        last_message = session.exec(last_message_query).first()

        # Count unread messages
        unread_count_query = select(func.count(Message.id)).where(
            Message.conversation_id == conversation.id,
            Message.sender_id != user_id,  # Not from the current user
            Message.deleted == False,
            ~Message.id.in_(
                select(MessageReadStatus.message_id).where(
                    MessageReadStatus.user_id == user_id
                )
            )
        )
        unread_count = session.exec(unread_count_query).one()

        # Use a dictionary that matches your ConversationPublic model
        conversation_info = {
            "id": conversation.id,
            "name": conversation.name,
            "is_group": conversation.is_group,
            "created_at": conversation.created_at,
            "last_message": last_message.content if last_message else None,
            "last_message_time": last_message.created_at if last_message else None,
            "unread_count": unread_count or 0,
            "participants": [{"user_id": p} for p in participants]
        }

        result.append(conversation_info)

    # Sort by latest message time
    result.sort(key=lambda x: x.get("last_message_time") or datetime.datetime.min, reverse=True)

    return result, total


# Message CRUD Operations
def create_message(
        session: Session,
        *,
        sender_id: UUID,
        message_in: MessageCreate
) -> Message:
    """Create a new message in a conversation"""
    # Verify the conversation exists
    conversation = session.get(Conversation, message_in.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get all participants
    participants = get_conversation_participants(session, message_in.conversation_id)

    # Verify sender is a participant in the conversation
    if sender_id not in participants:
        raise HTTPException(status_code=403, detail="User is not a participant in this conversation")

    # Check if sender is blocked by any participant or has blocked any participant
    for participant_id in participants:
        if participant_id != sender_id and is_user_blocked(session, sender_id, participant_id):
            raise HTTPException(status_code=403, detail="Cannot send message to blocked user")

    # Create the message
    db_message = Message(
        sender_id=sender_id,
        conversation_id=message_in.conversation_id,
        content=message_in.content
    )
    session.add(db_message)
    session.commit()
    session.refresh(db_message)
    return db_message


def get_message(session: Session, message_id: UUID) -> Optional[Message]:
    """Get a message by ID"""
    return session.get(Message, message_id)


def update_message(
        session: Session,
        *,
        message_id: UUID,
        user_id: UUID,
        message_update: MessageUpdate
) -> Optional[Message]:
    """Update a message if user is the sender"""
    message = session.get(Message, message_id)
    if not message:
        return None

    # Only the sender can update the message
    if message.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Only the sender can update the message")

    # Cannot update deleted messages
    if message.deleted:
        raise HTTPException(status_code=400, detail="Cannot update deleted messages")

    # Update fields
    if message_update.content is not None:
        message.content = message_update.content
        message.updated_at = datetime.datetime.utcnow()

    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def delete_message(
        session: Session,
        *,
        message_id: UUID,
        user_id: UUID
) -> Optional[Message]:
    """Soft delete a message if user is the sender"""
    message = session.get(Message, message_id)
    if not message:
        return None

    # Only the sender can delete the message
    if message.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Only the sender can delete the message")

    # Soft delete the message
    message.deleted = True
    message.deleted_at = datetime.datetime.utcnow()

    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def get_conversation_messages(
        session: Session,
        conversation_id: UUID,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False
) -> Tuple[List[Message], int]:
    """Get messages for a specific conversation"""
    # Verify the conversation exists
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Get messages for this conversation
    query = select(Message).where(
        Message.conversation_id == conversation_id
    )

    # Optionally exclude deleted messages
    if not include_deleted:
        query = query.where(Message.deleted == False)

    query = query.order_by(Message.created_at.desc())

    # Total count
    total_query = select(func.count()).where(
        Message.conversation_id == conversation_id
    )

    if not include_deleted:
        total_query = total_query.where(Message.deleted == False)

    total = session.exec(total_query).one()
    messages = session.exec(query.offset(skip).limit(limit)).all()

    return messages, total


def get_message_with_read_status(session: Session, message_id: UUID) -> Tuple[Optional[Message], List[ReadReceipt]]:
    """Get a message with its read status information"""
    message = session.get(Message, message_id)
    if not message:
        return None, []

    # Get read receipts
    query = select(MessageReadStatus).where(
        MessageReadStatus.message_id == message_id
    )
    read_statuses = session.exec(query).all()

    read_receipts = [
        ReadReceipt(
            user_id=status.user_id,
            read_at=status.read_at
        )
        for status in read_statuses
    ]

    return message, read_receipts


def mark_message_as_read(
        session: Session,
        message_id: UUID,
        user_id: UUID
) -> bool:
    """Mark a message as read by a specific user"""
    # Get the message
    message = session.get(Message, message_id)
    if not message:
        return False

    # Check if user is a participant in the conversation
    participant_check = session.exec(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == message.conversation_id,
            ConversationParticipant.user_id == user_id
        )
    ).first()

    if not participant_check:
        return False

    # Check if already marked as read
    existing = session.exec(
        select(MessageReadStatus).where(
            MessageReadStatus.message_id == message_id,
            MessageReadStatus.user_id == user_id
        )
    ).first()

    if existing:
        return True  # Already marked as read

    # Mark as read
    read_status = MessageReadStatus(
        message_id=message_id,
        user_id=user_id
    )
    session.add(read_status)
    session.commit()

    return True


def mark_conversation_as_read(
        session: Session,
        user_id: UUID,
        conversation_id: UUID
) -> int:
    """Mark all messages in a conversation as read"""
    # Verify the conversation exists and user is a participant
    participant_check = session.exec(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id
        )
    ).first()

    if not participant_check:
        return 0

    # Find all unread messages in this conversation
    unread_messages_query = select(Message).where(
        Message.conversation_id == conversation_id,
        Message.sender_id != user_id,  # Only mark messages from others
        Message.deleted == False,
        ~Message.id.in_(
            select(MessageReadStatus.message_id).where(
                MessageReadStatus.user_id == user_id
            )
        )
    )

    unread_messages = session.exec(unread_messages_query).all()
    count = 0

    for message in unread_messages:
        read_status = MessageReadStatus(
            message_id=message.id,
            user_id=user_id
        )
        session.add(read_status)
        count += 1

    if count > 0:
        session.commit()

    return count


def get_unread_count(
        session: Session,
        user_id: UUID,
        conversation_id: Optional[UUID] = None
) -> int:
    """Get count of unread messages for a user, optionally in a specific conversation"""
    query = select(func.count(Message.id)).where(
        ~Message.id.in_(
            select(MessageReadStatus.message_id).where(
                MessageReadStatus.user_id == user_id
            )
        ),
        Message.sender_id != user_id,  # Don't count user's own messages
        Message.deleted == False,
        Message.conversation_id.in_(
            select(ConversationParticipant.conversation_id).where(
                ConversationParticipant.user_id == user_id
            )
        )
    )

    if conversation_id:
        query = query.where(Message.conversation_id == conversation_id)

    return session.exec(query).one() or 0


def get_message_read_receipts(
        session: Session,
        message_id: UUID
) -> List[ReadReceipt]:
    """Get all read receipts for a message"""
    query = select(MessageReadStatus).where(
        MessageReadStatus.message_id == message_id
    )

    read_statuses = session.exec(query).all()

    return [
        ReadReceipt(
            user_id=status.user_id,
            read_at=status.read_at
        )
        for status in read_statuses
    ]