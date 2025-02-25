from datetime import datetime
from typing import List, Optional, Tuple
import uuid

from sqlmodel import Session, select, or_, and_, col

from app.models.messages import (
    Conversation, ConversationParticipant, Message, ReadReceipt,
    ConversationCreate, MessageCreate
)
from app.models.users import User


def get_conversation(db: Session, conversation_id: uuid.UUID) -> Optional[Conversation]:
    return db.get(Conversation, conversation_id)


def get_conversations_for_user(
        db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[Tuple[Conversation, datetime, int, int]]:
    """
    Get conversations for a user with:
    - Latest message date
    - Unread count
    - Total messages count
    """
    # First get conversation IDs the user is part of
    statement = select(ConversationParticipant.conversation_id).where(
        ConversationParticipant.user_id == user_id
    )
    results = db.exec(statement).all()
    conversation_ids = [result for result in results]

    if not conversation_ids:
        return []

    # Get conversations with latest message date and counts
    conversations = []
    for conv_id in conversation_ids:
        # Get the conversation
        conversation = get_conversation(db, conv_id)
        if not conversation:
            continue

        # Get latest message date
        latest_msg_stmt = select(Message).where(
            Message.conversation_id == conv_id
        ).order_by(Message.sent_at.desc()).limit(1)
        latest_msg = db.exec(latest_msg_stmt).first()
        latest_date = latest_msg.sent_at if latest_msg else conversation.created_at

        # Count total messages
        total_msgs_stmt = select(Message).where(Message.conversation_id == conv_id)
        total_count = db.exec(total_msgs_stmt).all()
        total_count = len(total_count)

        # Count unread messages
        # Get all messages in conversation
        all_msgs_stmt = select(Message).where(Message.conversation_id == conv_id)
        all_messages = db.exec(all_msgs_stmt).all()

        # For each message, check if user has read it
        unread_count = 0
        for msg in all_messages:
            read_receipt_stmt = select(ReadReceipt).where(
                and_(
                    ReadReceipt.message_id == msg.id,
                    ReadReceipt.user_id == user_id
                )
            )
            read_receipt = db.exec(read_receipt_stmt).first()
            if not read_receipt and msg.sender_id != user_id:
                unread_count += 1

        conversations.append((conversation, latest_date, unread_count, total_count))

    # Sort by latest message date
    conversations.sort(key=lambda x: x[1], reverse=True)

    # Apply pagination
    return conversations[skip:skip + limit]


def create_conversation(
        db: Session, conversation: ConversationCreate, creator_id: uuid.UUID
) -> Conversation:
    """Create a new conversation and add participants"""
    # Create conversation
    db_conversation = Conversation(
        name=conversation.name,
        is_group=conversation.is_group,
    )
    db.add(db_conversation)
    db.flush()

    # Add creator as participant
    creator_participant = ConversationParticipant(
        conversation_id=db_conversation.id,
        user_id=creator_id
    )
    db.add(creator_participant)

    # Add other participants
    for participant_id in conversation.participant_ids:
        if participant_id != creator_id:  # Skip creator as they're already added
            participant = ConversationParticipant(
                conversation_id=db_conversation.id,
                user_id=participant_id
            )
            db.add(participant)

    db.commit()
    db.refresh(db_conversation)
    return db_conversation


def get_messages(
        db: Session, conversation_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[Message]:
    """Get messages for a conversation with pagination"""
    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.sent_at.desc()).offset(skip).limit(limit)

    messages = db.exec(statement).all()
    # Convert to list and reverse to get oldest first
    return list(reversed(messages))


def create_message(
        db: Session, message: MessageCreate, sender_id: uuid.UUID
) -> Message:
    """Create a new message in a conversation"""
    db_message = Message(
        content=message.content,
        conversation_id=message.conversation_id,
        sender_id=sender_id
    )
    db.add(db_message)

    # Update conversation's updated_at timestamp
    conversation = db.get(Conversation, message.conversation_id)
    if conversation:
        conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_message)
    return db_message


def create_read_receipt(
        db: Session, message_id: uuid.UUID, user_id: uuid.UUID
) -> ReadReceipt:
    """Mark a message as read by a user"""
    # Check if read receipt already exists
    statement = select(ReadReceipt).where(
        and_(
            ReadReceipt.message_id == message_id,
            ReadReceipt.user_id == user_id
        )
    )
    existing = db.exec(statement).first()

    if existing:
        return existing

    # Create new read receipt
    db_receipt = ReadReceipt(
        message_id=message_id,
        user_id=user_id
    )
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    return db_receipt


def toggle_read_receipts(
        db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID, enable: bool
) -> bool:
    """Toggle read receipts for a user in a conversation"""
    statement = select(ConversationParticipant).where(
        and_(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id
        )
    )
    participant = db.exec(statement).first()

    if not participant:
        return False

    participant.enable_read_receipts = enable
    db.add(participant)
    db.commit()
    return True


def check_participant(
        db: Session, conversation_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Check if a user is a participant in a conversation"""
    statement = select(ConversationParticipant).where(
        and_(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id
        )
    )
    participant = db.exec(statement).first()
    return participant is not None