import uuid
import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel


class FAQBase(SQLModel):
    question: str = Field(max_length=255)
    answer: Optional[str] = Field(default=None, max_length=4000)


class FAQCreate(FAQBase):
    pass


class FAQUpdate(SQLModel):
    answer: Optional[str] = Field(default=None, max_length=4000)


class FAQ(FAQBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow, nullable=False)


class FAQPublic(FAQBase):
    id: uuid.UUID
    created_at: datetime.datetime


class FAQsPublic(SQLModel):
    data: List[FAQPublic]
    count: int