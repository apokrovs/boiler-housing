import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.config import settings
from app.models.messages import (
    Conversation, ConversationParticipant, Message,
)
from app.tests.utils.user import create_random_user


def test_create_conversation(
        client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    # Create another user to chat with
    other_user = create_random_user(db)

    # Create new conversation
    conversation_name = "Test Conversation"
    data = {
        "name": conversation_name,
        "is_group": True,
        "participant_ids": [str(other_user.id)]
    }

    r = client.post(
        f"{settings.API_V1_STR}/chat/conversations",
        headers=superuser_token_headers,
        json=data,
    )
    assert 200 <= r.status_code < 300
    created_conversation = r.json()
    assert created_conversation["name"] == conversation_name
    assert created_conversation["is_group"] is True
    assert created_conversation["participant_count"] == 2  # Creator + other user

    # Check participants in DB
    conv_id = uuid.UUID(created_conversation["id"])
    statement = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conv_id
    )
    participants = db.exec(statement).all()
    assert len(participants) == 2


def test_get_conversations(
        client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Get current user ID directly from the token
    me_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers
    )
    current_user_id = uuid.UUID(me_response.json()["id"])

    # Create another user
    other_user = create_random_user(db)

    # Create conversation
    conversation = Conversation(name="Test Get Conversation", is_group=False)
    db.add(conversation)
    db.flush()

    # Add participants
    user_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=current_user_id
    )
    other_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=other_user.id
    )
    db.add(user_participant)
    db.add(other_participant)
    db.commit()
    db.refresh(conversation)

    # Get conversations
    r = client.get(
        f"{settings.API_V1_STR}/chat/conversations",
        headers=normal_user_token_headers
    )
    assert 200 <= r.status_code < 300
    conversations = r.json()
    assert len(conversations) >= 1

    # Check our created conversation is in the list
    found = False
    for conv in conversations:
        if uuid.UUID(conv["id"]) == conversation.id:
            found = True
            assert conv["name"] == "Test Get Conversation"
            assert conv["is_group"] is False
            assert conv["participant_count"] == 2
    assert found


def test_get_conversation_messages(
        client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First get user id from token
    me_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers
    )
    current_user_id = uuid.UUID(me_response.json()["id"])

    # Create another user
    other_user = create_random_user(db)

    # Create conversation
    conversation = Conversation(name="Test Messages", is_group=False)
    db.add(conversation)
    db.flush()

    # Add participants
    user_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=current_user_id
    )
    other_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=other_user.id
    )
    db.add(user_participant)
    db.add(other_participant)
    db.flush()

    # Add messages
    message1 = Message(
        content="Hello!",
        conversation_id=conversation.id,
        sender_id=current_user_id
    )
    message2 = Message(
        content="Hi there!",
        conversation_id=conversation.id,
        sender_id=other_user.id
    )
    db.add(message1)
    db.add(message2)
    db.commit()

    # Get messages
    r = client.get(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}/messages",
        headers=normal_user_token_headers
    )
    assert 200 <= r.status_code < 300
    messages = r.json()
    assert len(messages) == 2

    # Check message content
    assert any(m["content"] == "Hello!" for m in messages)
    assert any(m["content"] == "Hi there!" for m in messages)

    # Give the backend time to create read receipts (if it's happening asynchronously)
    db.commit()
    db.refresh(message2)

    # Check read receipts directly in the database
    from app.models.messages import ReadReceipt
    receipt_statement = select(ReadReceipt).where(
        ReadReceipt.message_id == message2.id,
        ReadReceipt.user_id == current_user_id
    )
    receipt = db.exec(receipt_statement).first()
    assert receipt is not None, "Read receipt should be created in the database"

    # Now check the API response
    r = client.get(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}/messages",
        headers=normal_user_token_headers
    )
    messages = r.json()

    # Find the message from other_user
    for message in messages:
        if uuid.UUID(message["sender_id"]) == other_user.id:
            # Should have been marked as read by current user
            read_by_uuids = [uuid.UUID(uid) for uid in message["read_by"]]
            assert current_user_id in read_by_uuids, f"Expected {current_user_id} in read_by list, got {read_by_uuids}"


def test_toggle_read_receipts(
        client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # First get user id from token
    me_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers
    )
    current_user_id = uuid.UUID(me_response.json()["id"])

    # Create another user
    other_user = create_random_user(db)

    # Create conversation
    conversation = Conversation(name="Test Read Receipts", is_group=False)
    db.add(conversation)
    db.flush()

    # Add participants
    user_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=current_user_id
    )
    other_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=other_user.id
    )
    db.add(user_participant)
    db.add(other_participant)
    db.commit()

    # Toggle off read receipts
    r = client.post(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}/toggle-read-receipts?enable=false",
        headers=normal_user_token_headers
    )
    assert 200 <= r.status_code < 300
    response = r.json()
    assert response["status"] == "success"
    assert response["enable_read_receipts"] is False

    # Check setting updated in database
    statement = select(ConversationParticipant).where(
        ConversationParticipant.conversation_id == conversation.id,
        ConversationParticipant.user_id == current_user_id
    )
    participant = db.exec(statement).first()
    assert participant.enable_read_receipts is False

    # Toggle back on
    r = client.post(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}/toggle-read-receipts?enable=true",
        headers=normal_user_token_headers
    )
    assert 200 <= r.status_code < 300
    response = r.json()
    assert response["status"] == "success"
    assert response["enable_read_receipts"] is True

    # Check setting updated in database
    db.refresh(participant)
    assert participant.enable_read_receipts is True


def test_get_conversation_unauthorized(
        client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create users
    user1 = create_random_user(db)
    user2 = create_random_user(db)

    # Create conversation between user1 and user2 (not including normal_user)
    conversation = Conversation(name="Private Chat", is_group=False)
    db.add(conversation)
    db.flush()

    # Add participants (not including normal_user)
    participant1 = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=user1.id
    )
    participant2 = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=user2.id
    )
    db.add(participant1)
    db.add(participant2)
    db.commit()

    # Try to access with normal_user (should be forbidden)
    r = client.get(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}",
        headers=normal_user_token_headers
    )
    assert r.status_code == 403
    response = r.json()
    assert response["detail"] == "Not a participant in this conversation"


def test_get_messages_unauthorized(
        client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create users
    user1 = create_random_user(db)
    user2 = create_random_user(db)

    # Create conversation between user1 and user2 (not including normal_user)
    conversation = Conversation(name="Private Chat", is_group=False)
    db.add(conversation)
    db.flush()

    # Add participants (not including normal_user)
    participant1 = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=user1.id
    )
    participant2 = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=user2.id
    )
    db.add(participant1)
    db.add(participant2)
    db.commit()

    # Try to access messages with normal_user (should be forbidden)
    r = client.get(
        f"{settings.API_V1_STR}/chat/conversations/{conversation.id}/messages",
        headers=normal_user_token_headers
    )
    assert r.status_code == 403
    response = r.json()
    assert response["detail"] == "Not a participant in this conversation"