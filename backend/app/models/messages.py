import uuid
import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel
from app.models.users import User


class ConversationBase(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    is_group: bool = Field(default=False)


class ConversationCreate(ConversationBase):
    participant_ids: List[uuid.UUID]


class ConversationUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)


class Conversation(ConversationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # Relationships
    participants: List["ConversationParticipant"] = Relationship(back_populates="conversation")
    messages: List["Message"] = Relationship(back_populates="conversation")


class ConversationParticipant(SQLModel, table=True):
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)

    # Relationships
    conversation: Conversation = Relationship(back_populates="participants")
    user: "User" = Relationship()


class MessageBase(SQLModel):
    content: str = Field(max_length=4000)


class MessageCreate(MessageBase):
    conversation_id: uuid.UUID


class MessageUpdate(SQLModel):
    content: Optional[str] = Field(default=None, max_length=4000)


class Message(MessageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sender_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )
    updated_at: Optional[datetime.datetime] = Field(default=None)
    deleted: bool = Field(default=False)
    deleted_at: Optional[datetime.datetime] = Field(default=None)

    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")
    sender: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Message.sender_id]"}
    )
    read_status: List["MessageReadStatus"] = Relationship(back_populates="message")


# Junction table for storing read status by each recipient
class MessageReadStatus(SQLModel, table=True):
    message_id: uuid.UUID = Field(foreign_key="message.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    read_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # Relationships
    message: Message = Relationship(back_populates="read_status")
    user: "User" = Relationship()


# User blocking table
class UserBlock(SQLModel, table=True):
    blocker_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    blocked_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # Relationships
    blocker: "User" = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[UserBlock.blocker_id]",
            "back_populates": "blocked_users"
        }
    )
    blocked: "User" = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[UserBlock.blocked_id]",
            "back_populates": "blocked_by_users"
        }
    )


class ReadReceipt(SQLModel):
    user_id: uuid.UUID
    read_at: datetime.datetime


class MessagePublic(MessageBase):
    id: uuid.UUID
    sender_id: uuid.UUID
    conversation_id: uuid.UUID
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None
    deleted: bool
    read_by: List[ReadReceipt] = []


class MessagesPublic(SQLModel):
    data: List[MessagePublic]
    count: int


class ConversationParticipantPublic(SQLModel):
    user_id: uuid.UUID


class ConversationPublic(ConversationBase):
    id: uuid.UUID
    created_at: datetime.datetime
    last_message: Optional[str] = None
    last_message_time: Optional[datetime.datetime] = None
    unread_count: int = Field(default=0)
    participants: List[ConversationParticipantPublic]


class ConversationsPublic(SQLModel):
    data: List[ConversationPublic]
    count: int


class UserBlockCreate(SQLModel):
    blocked_id: uuid.UUID


class UserBlockPublic(SQLModel):
    blocker_id: uuid.UUID
    blocked_id: uuid.UUID
    created_at: datetime.datetime