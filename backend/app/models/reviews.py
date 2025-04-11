import uuid
import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel

class ReviewBase(SQLModel):
    item_name: str = Field(max_length=255)
    item_type: str = Field(max_length=50)  # "renter", "leaser", "property"
    rating: int
    review: Optional[str] = Field(default=None, max_length=1000)

class ReviewCreate(ReviewBase):
    item_id: uuid.UUID
    reviewer_id: Optional[uuid.UUID] = None

class ReviewUpdate(SQLModel):
    review: Optional[str] = Field(default=None, max_length=1000)
    rating: Optional[int] = None

class Review(ReviewBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_id: uuid.UUID
    reviewer_id: Optional[uuid.UUID] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow, nullable=False)

class ReviewPublic(ReviewBase):
    id: uuid.UUID
    item_id: uuid.UUID
    reviewer_id: Optional[uuid.UUID]
    created_at: datetime.datetime

class ReviewsPublic(SQLModel):
    data: List[ReviewPublic]
    count: int
