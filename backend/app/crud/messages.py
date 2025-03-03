from typing import List, Optional, Tuple
from uuid import UUID

from sqlmodel import Session, select, or_, and_, func, col
import datetime

from app.models.messages import (
    Message,
    MessageCreate,
    MessageUpdate,
    MessageRecipient,
    MessageReadStatus,
    ReadReceipt,
    Conversation
)


def create_message(
        session: Session,
        *,
        sender_id: UUID,
        message_in: MessageCreate
) -> Message:
    """Create a new message with multiple recipients"""
    # Create the base message
    db_message = Message(
        sender_id=sender_id,
        content=message_in.content,
        is_group_chat=message_in.is_group_chat or len(message_in.receiver_ids) > 1,
    )
    session.add(db_message)
    session.flush()  # Flush to get the message ID

    # Create the recipient entries
    for receiver_id in message_in.receiver_ids:
        recipient = MessageRecipient(
            message_id=db_message.id,
            user_id=receiver_id
        )
        session.add(recipient)

    session.commit()
    session.refresh(db_message)
    return db_message


def get_message(session: Session, message_id: UUID) -> Optional[Message]:
    """Get a message by ID with its recipients"""
    return session.get(Message, message_id)


def get_message_recipients(session: Session, message_id: UUID) -> List[UUID]:
    """Get all recipient IDs for a message"""
    query = select(MessageRecipient.user_id).where(
        MessageRecipient.message_id == message_id
    )
    return [user_id for user_id, in session.exec(query)]


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
            message_id=status.message_id,
            user_id=status.user_id,
            read_at=status.read_at
        )
        for status in read_statuses
    ]

    return message, read_receipts


def get_conversations(
        session: Session,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
) -> Tuple[List[Conversation], int]:
    """
    Get all conversations for a user, including both direct messages and group chats
    Returns a list of conversations with the last message and unread count
    """
    # First, identify all conversations the user is part of
    # A conversation is defined by a unique set of participants

    # Find all messages where the user is either sender or recipient
    sent_query = select(Message.id).where(Message.sender_id == user_id)
    received_query = select(MessageRecipient.message_id).where(
        MessageRecipient.user_id == user_id
    )

    # Get all message IDs for this user's conversations
    user_message_ids_query = sent_query.union(received_query)
    user_message_ids = [id for id, in session.exec(user_message_ids_query)]

    if not user_message_ids:
        return [], 0

    # Get conversations grouped by participants
    conversations = []

    # Handle group conversations and direct messages separately

    # 1. First get all group chats
    group_query = select(Message).where(
        Message.id.in_(user_message_ids),
        Message.is_group_chat == True
    ).order_by(Message.created_at.desc())

    group_messages = session.exec(group_query).all()

    # Create a map of conversation fingerprints to track already processed groups
    processed_groups = {}

    for message in group_messages:
        # Get all participants (including sender and recipients)
        recipients_query = select(MessageRecipient.user_id).where(
            MessageRecipient.message_id == message.id
        )
        recipients = [user_id for user_id, in session.exec(recipients_query)]

        # Create a unique identifier for this group based on participants
        participants = sorted([str(message.sender_id)] + [str(r) for r in recipients])
        group_key = ",".join(participants)

        # Skip if we've already processed this group
        if group_key in processed_groups:
            continue

        processed_groups[group_key] = True

        # Get the latest message for this group
        latest_query = select(Message).where(
            Message.sender_id.in_([UUID(p) for p in participants]),
            or_(
                *[
                    and_(
                        Message.sender_id == UUID(p),
                        Message.id.in_(
                            select(MessageRecipient.message_id).where(
                                MessageRecipient.user_id.in_([UUID(r) for r in participants if r != p])
                            )
                        )
                    )
                    for p in participants
                ]
            ),
            Message.is_group_chat == True
        ).order_by(Message.created_at.desc()).limit(1)

        latest_message = session.exec(latest_query).first()

        if not latest_message:
            continue

        # Count unread messages
        unread_count_query = select(func.count(Message.id)).where(
            Message.id.in_(
                select(MessageRecipient.message_id).where(
                    MessageRecipient.user_id == user_id
                )
            ),
            Message.sender_id != user_id,
            Message.is_group_chat == True,
            ~Message.id.in_(
                select(MessageReadStatus.message_id).where(
                    MessageReadStatus.user_id == user_id
                )
            )
        )

        unread_count = session.exec(unread_count_query).one()

        # Create conversation object
        conversation = Conversation(
            id=UUID(group_key.split(",")[0]),  # Use first participant's ID for now
            name=None,  # Group name could be added in the future
            is_group=True,
            last_message=latest_message.content,
            last_message_time=latest_message.created_at,
            unread_count=unread_count or 0,
            participants=[UUID(p) for p in participants]
        )

        conversations.append(conversation)

    # 2. Now get direct messages (one-to-one)
    direct_query = select(Message).where(
        Message.id.in_(user_message_ids),
        Message.is_group_chat == False
    ).order_by(Message.created_at.desc())

    direct_messages = session.exec(direct_query).all()

    # Track processed direct conversations
    processed_direct = set()

    for message in direct_messages:
        # Determine the other user in the conversation
        other_user_id = None

        if message.sender_id == user_id:
            # Get the recipient
            recipient_query = select(MessageRecipient.user_id).where(
                MessageRecipient.message_id == message.id
            ).limit(1)
            other_user_id_result = session.exec(recipient_query).first()
            if other_user_id_result:
                other_user_id = other_user_id_result
        else:
            other_user_id = message.sender_id

        if not other_user_id or str(other_user_id) in processed_direct:
            continue

        processed_direct.add(str(other_user_id))

        # Get the latest message between these two users
        latest_query = select(Message).where(
            or_(
                and_(
                    Message.sender_id == user_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == other_user_id
                        )
                    )
                ),
                and_(
                    Message.sender_id == other_user_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == user_id
                        )
                    )
                )
            ),
            Message.is_group_chat == False
        ).order_by(Message.created_at.desc()).limit(1)

        latest_message = session.exec(latest_query).first()

        if not latest_message:
            continue

        # Count unread messages
        unread_count_query = select(func.count(Message.id)).where(
            Message.sender_id == other_user_id,
            Message.id.in_(
                select(MessageRecipient.message_id).where(
                    MessageRecipient.user_id == user_id
                )
            ),
            Message.is_group_chat == False,
            ~Message.id.in_(
                select(MessageReadStatus.message_id).where(
                    MessageReadStatus.user_id == user_id
                )
            )
        )

        unread_count = session.exec(unread_count_query).one()

        # Create conversation object
        conversation = Conversation(
            id=other_user_id,  # Use the other user's ID as the conversation ID for direct messages
            is_group=False,
            last_message=latest_message.content,
            last_message_time=latest_message.created_at,
            unread_count=unread_count or 0,
            participants=[user_id, other_user_id]
        )

        conversations.append(conversation)

    # Sort by latest message time
    conversations.sort(key=lambda x: x.last_message_time or datetime.datetime.min, reverse=True)

    total = len(conversations)
    paginated_conversations = conversations[skip: skip + limit]

    return paginated_conversations, total


def get_messages_for_conversation(
        session: Session,
        user_id: UUID,
        conversation_id: UUID,
        is_group: bool,
        skip: int = 0,
        limit: int = 100
) -> Tuple[List[Message], int]:
    """
    Get messages for a specific conversation
    - For direct messages, conversation_id is the other user's ID
    - For group chats, conversation_id is the group's ID
    """
    if is_group:
        # For group chats, get all messages where the user is a recipient and the sender is part of the group
        # This is a simplification - in a real system you'd have a groups table
        messages_query = select(Message).where(
            Message.is_group_chat == True,
            or_(
                and_(
                    Message.sender_id == user_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == conversation_id
                        )
                    )
                ),
                and_(
                    Message.sender_id == conversation_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == user_id
                        )
                    )
                )
            )
        ).order_by(Message.created_at.desc())
    else:
        # For direct messages, get all messages between the user and the conversation_id (other user)
        messages_query = select(Message).where(
            Message.is_group_chat == False,
            or_(
                and_(
                    Message.sender_id == user_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == conversation_id
                        )
                    )
                ),
                and_(
                    Message.sender_id == conversation_id,
                    Message.id.in_(
                        select(MessageRecipient.message_id).where(
                            MessageRecipient.user_id == user_id
                        )
                    )
                )
            )
        ).order_by(Message.created_at.desc())

    total = len(session.exec(messages_query).all())
    messages = session.exec(messages_query.offset(skip).limit(limit)).all()

    return messages, total


def mark_message_as_read(
        session: Session,
        message_id: UUID,
        user_id: UUID
) -> bool:
    """Mark a message as read by a specific user"""
    # Check if this user is a recipient of the message
    recipient_check = session.exec(
        select(MessageRecipient).where(
            MessageRecipient.message_id == message_id,
            MessageRecipient.user_id == user_id
        )
    ).first()

    if not recipient_check:
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
        conversation_id: UUID,
        is_group: bool
) -> int:
    """Mark all messages in a conversation as read"""
    # Find all unread messages in this conversation
    if is_group:
        # For group conversations
        unread_messages_query = select(Message).where(
            Message.is_group_chat == True,
            Message.sender_id != user_id,  # Only mark messages from others
            Message.id.in_(
                select(MessageRecipient.message_id).where(
                    MessageRecipient.user_id == user_id
                )
            ),
            ~Message.id.in_(
                select(MessageReadStatus.message_id).where(
                    MessageReadStatus.user_id == user_id
                )
            )
        )
    else:
        # For direct messages
        unread_messages_query = select(Message).where(
            Message.is_group_chat == False,
            Message.sender_id == conversation_id,  # From the other user
            Message.id.in_(
                select(MessageRecipient.message_id).where(
                    MessageRecipient.user_id == user_id
                )
            ),
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
        sender_id: Optional[UUID] = None
) -> int:
    """Get count of unread messages for a user"""
    query = select(func.count(Message.id)).where(
        Message.id.in_(
            select(MessageRecipient.message_id).where(
                MessageRecipient.user_id == user_id
            )
        ),
        ~Message.id.in_(
            select(MessageReadStatus.message_id).where(
                MessageReadStatus.user_id == user_id
            )
        )
    )

    if sender_id:
        query = query.where(Message.sender_id == sender_id)

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
            message_id=status.message_id,
            user_id=status.user_id,
            read_at=status.read_at
        )
        for status in read_statuses
    ]
