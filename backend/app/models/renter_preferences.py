import uuid
from typing import List, Optional
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel

class RenterPreferenceBase(SQLModel):
    num_bedrooms: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))  # ✅ JSONB
    num_bathrooms: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))  # ✅ JSONB
    address: Optional[str] | None = Field(default=None, max_length=255)
    realty_company: Optional[str] | None = Field(default=None, max_length=255)
    min_price: Optional[float] | None = Field(default=None, ge=0)
    max_price: Optional[float] | None = Field(default=None, ge=0)
    included_utilities: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))  # ✅ JSONB
    security_deposit: Optional[str] | None = Field(default="no")  # "yes", "no", "noPreference"
    amenities: Optional[List[str]] | None = Field(default=None, sa_column=Column(JSONB))  # ✅ JSONB
    lease_start_date: Optional[str] | None = Field(default=None)
    lease_end_date: Optional[str] | None = Field(default=None)

class RenterPreferenceCreate(RenterPreferenceBase):
    pass

class RenterPreferenceUpdate(RenterPreferenceBase):
    pass

class RenterPreference(RenterPreferenceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False
    )
    owner: Optional["User"] = Relationship(back_populates="renter_preferences")

class RenterPreferencePublic(RenterPreferenceBase):
    id: uuid.UUID
    owner_id: uuid.UUID

class RenterPreferencesPublic(SQLModel):
    data: list[RenterPreferencePublic]