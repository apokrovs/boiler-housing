import uuid
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum


class FileType(str, Enum):
    JPEG = "image/jpeg"
    JPG = "image/jpg"
    PNG = "image/png"
    WEBP = "image/webp"
    GIF = "image/gif"


class ImageBase(SQLModel):
    filename: str = Field(max_length=255)
    file_path: str = Field(max_length=255)
    file_type: FileType
    file_size: int
    is_primary: bool = Field(default=False)
    display_order: int = Field(default=0)


class ImageCreate(ImageBase):
    listing_id: uuid.UUID


class ImageUpdate(SQLModel):
    filename: Optional[str] = None
    is_primary: Optional[bool] = None
    display_order: Optional[int] = None


class Image(ImageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: uuid.UUID = Field(foreign_key="listing.id", nullable=False, ondelete="CASCADE")
    listing: Optional["Listing"] = Relationship(back_populates="images")


class ImagePublic(ImageBase):
    id: uuid.UUID
    listing_id: uuid.UUID