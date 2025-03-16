import uuid
from typing import Optional, List
from enum import Enum
from sqlmodel import Field, Relationship, SQLModel


class ContentType(str, Enum):
    JPEG = "image/jpeg"
    PNG = "image/png"
    GIF = "image/gif"
    PDF = "application/pdf"
    DOC = "application/msword"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    XLS = "application/vnd.ms-excel"
    XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    TXT = "text/plain"
    OTHER = "application/octet-stream"


class FileBase(SQLModel):
    filename: str = Field(min_length=1, max_length=255)
    file_path: str = Field(min_length=1, max_length=255)
    content_type: ContentType
    size: int = Field(ge=0)  # File size in bytes
    is_primary: bool = Field(default=False)  # For primary images in galleries


class File(FileBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign key relationships
    owner_id: Optional[str] = Field(default=None, foreign_key="users.id")


class FilePublic(FileBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class FilesPublic(SQLModel):
    data: list[FilePublic]
    count: int

class FileCreate(FileBase):
    pass