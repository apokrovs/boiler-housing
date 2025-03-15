import uuid
from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB

# Shared properties
class ListingBase(SQLModel):
    num_bedrooms: Optional[str] | None = Field(default=None)
    num_bathrooms: Optional[str] | None = Field(default=None)
    address: Optional[str] | None = Field(default=None, max_length=255)
    realty_company: Optional[str] | None = Field(default=None, max_length=255)
    rent: Optional[float] | None = Field(default=None, ge=0)
    included_utilities: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))
    security_deposit: Optional[str] | None = Field(default=None)
    amenities: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))
    lease_start_date: Optional[str] | None = Field(default=None)
    lease_end_date: Optional[str] | None = Field(default=None)


# Properties to receive on listing creation
class ListingCreate(ListingBase):
    pass


# Properties to receive on listing update
class ListingUpdate(ListingBase):
    pass


# Database model, database table inferred from class name
class Listing(ListingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: Optional["User"] = Relationship(back_populates="listings")


# Properties to return via API, id is always required
class ListingPublic(ListingBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ListingsPublic(SQLModel):
    data: list[ListingPublic]
    count: int