import uuid
from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel
from pydantic import constr


# Many-to-many relationship table for conversation participants
class ConversationParticipant(SQLModel, table=True):
    conversation_id: uuid.UUID = Field(
        foreign_key="conversation.id", primary_key=True
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True
    )
    enable_read_receipts: bool = Field(default=True)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="participants_link")
    user: "User" = Relationship(back_populates="conversations_link")


# Base Conversation model
class ConversationBase(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    is_group: bool = Field(default=False)


# Database model for Conversation
class Conversation(ConversationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    messages: List["Message"] = Relationship(back_populates="conversation",
                                             sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    participants_link: List[ConversationParticipant] = Relationship(back_populates="conversation",
                                                                    sa_relationship_kwargs={
                                                                        "cascade": "all, delete-orphan"})


# ConversationCreate model
class ConversationCreate(ConversationBase):
    participant_ids: List[uuid.UUID]


# ConversationRead model
class ConversationRead(ConversationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    participant_count: int


# Base Message model
class MessageBase(SQLModel):
    content: constr(min_length=1, max_length=5000)


# Messages model
class Message(MessageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id")
    sender_id: uuid.UUID = Field(foreign_key="user.id")
    sent_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
    sender: "User" = Relationship()
    read_receipts: List["ReadReceipt"] = Relationship(back_populates="message",
                                                      sa_relationship_kwargs={"cascade": "all, delete-orphan"})


# MessageCreate model
class MessageCreate(MessageBase):
    conversation_id: uuid.UUID


# MessageRead model
class MessageRead(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    sent_at: datetime
    read_by: List[uuid.UUID] = []  # Not a relation because this is meant for returning data through the API


# Database model for ReadReceipt
class ReadReceipt(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    message_id: uuid.UUID = Field(foreign_key="message.id")
    user_id: uuid.UUID = Field(foreign_key="user.id")
    read_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    message: Message = Relationship(back_populates="read_receipts")
    user: "User" = Relationship()
