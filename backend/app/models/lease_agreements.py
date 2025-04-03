import uuid
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum

if TYPE_CHECKING:
    from .listings import Listing

class LeaseFileType(str, Enum):
    PDF = "application/pdf"
    TXT = "text/plain"

class LeaseAgreementBase(SQLModel):
    filename: str = Field(max_length=255)
    file_path: str = Field(max_length=255)
    file_type: LeaseFileType
    file_size: int
    description: Optional[str] = Field(default=None, max_length=500)

class LeaseAgreementCreate(LeaseAgreementBase):
    listing_id: uuid.UUID

class LeaseAgreementUpdate(SQLModel):
    filename: Optional[str] = None
    description: Optional[str] = None

class LeaseAgreement(LeaseAgreementBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    listing_id: uuid.UUID = Field(
        foreign_key="listing.id",
        nullable=False,
        ondelete="CASCADE",
        sa_column_kwargs={"unique": True}
    )
    listing: Optional["Listing"] = Relationship(back_populates="lease_agreement")

class LeaseAgreementPublic(LeaseAgreementBase):
    id: uuid.UUID
    listing_id: uuid.UUID
