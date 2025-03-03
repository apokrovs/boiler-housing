import uuid
import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel


class MessageBase(SQLModel):
    content: str = Field(max_length=4000)
    is_group_chat: bool = Field(default=False)


class MessageCreate(MessageBase):
    # For individual chats: one receiver
    # For group chats: multiple receivers
    receiver_ids: List[uuid.UUID]


class MessageUpdate(SQLModel):
    pass


# Junction table for storing read status by each recipient
class MessageReadStatus(SQLModel, table=True):
    message_id: uuid.UUID = Field(foreign_key="message.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    read_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )


class Message(MessageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sender_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.utcnow, nullable=False
    )

    # Store the recipients as a separate table relationship through MessageRecipient
    recipients: List["MessageRecipient"] = Relationship(back_populates="message")
    sender: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Message.sender_id]"}
    )

    # Relationship to read status
    read_status: List["MessageReadStatus"] = Relationship()


class MessageRecipient(SQLModel, table=True):
    message_id: uuid.UUID = Field(foreign_key="message.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)

    message: Message = Relationship(back_populates="recipients")
    user: "User" = Relationship()


class ReadReceipt(SQLModel):
    message_id: uuid.UUID
    user_id: uuid.UUID
    read_at: datetime.datetime


class MessagePublic(MessageBase):
    id: uuid.UUID
    sender_id: uuid.UUID
    receiver_ids: List[uuid.UUID]
    created_at: datetime.datetime
    read_by: List[ReadReceipt] = []


class MessagesPublic(SQLModel):
    data: List[MessagePublic]
    count: int


class Conversation(SQLModel):
    id: uuid.UUID
    name: Optional[str] = None
    is_group: bool
    last_message: Optional[str] = None
    last_message_time: Optional[datetime.datetime] = None
    unread_count: int
    participants: List[uuid.UUID]


class ConversationsPublic(SQLModel):
    data: List[Conversation]
    count: int