import uuid
from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel, JSON


# Shared properties
class ListingBase(SQLModel):
    num_bedrooms: str | None = Field(default=None)
    num_bathrooms: str | None = Field(default=None)
    address: str | None = Field(default=None, max_length=255)
    realty_company: str | None = Field(default=None, max_length=255)
    rent: float | None = Field(default=None, ge=0)
    included_utilities: List[str] | None = Field(default=None, sa_type=JSON)
    security_deposit: str | None = Field(default=None)
    amenities: List[str] | None = Field(default=None, sa_type=JSON)
    lease_start_date: str | None = Field(default=None)
    lease_end_date: str | None = Field(default=None)


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
    images: List["Image"] = Relationship(back_populates="listing",
                                        sa_relationship_kwargs={"cascade": "all, delete"})


# Properties to return via API, id is always required
class ListingPublic(ListingBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    images: List["ImagePublic"] = []


class ListingsPublic(SQLModel):
    data: List[ListingPublic]
    count: int


# Helper function for loading images with selectinload
def with_images(query):
    """Add image loading to a listing query"""
    from sqlalchemy.orm import selectinload
    return query.options(selectinload(Listing.images))