import shutil
import uuid
from typing import Any
import os
import aiofiles

from fastapi import APIRouter, Depends, File as FastAPIFile, UploadFile, HTTPException
from fastapi.responses import FileResponse
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.files import File, FileCreate, FilePublic, FilesPublic, ContentType
from app.crud.files import create_file
from app.models.utils import Message

router = APIRouter(prefix="/files", tags=["files"])
UPLOAD_DIR = "app/uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=FilesPublic)
def read_files(
        session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve files
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(File)
        count = session.exec(count_statement).one()
        statement = select(File).offset(skip).limit(limit)
        files = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(File)
            .where(File.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(File)
            .where(File.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        files = session.exec(statement).all()

    return FilesPublic(data=files, count=count)


@router.get("/{id}", response_model=FilePublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get item by ID.
    """
    file = session.get(File, id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if not current_user.is_superuser and (file.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return file


@router.post("/", response_model=FilePublic)
async def upload_file(
    *, session: SessionDep, current_user: CurrentUser, file: UploadFile = FastAPIFile(...)
) -> Any:
    """
    Create new item.
    """

    # Create unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file to disk using async I/O
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

    # Convert the content type string to enum
    content_type_str = file.content_type or "application/octet-stream"
    try:
        content_type_enum = ContentType(content_type_str)
    except ValueError:
        # Fallback based on extension
        if file_extension.lower() in ['.jpg', '.jpeg']:
            content_type_enum = ContentType.JPEG
        elif file_extension.lower() == '.png':
            content_type_enum = ContentType.PNG
        # Add more mappings as needed
        else:
            content_type_enum = ContentType.OTHER

    # Create instance with all required fields
    new_file = FileCreate(
        file_path=file_path,
        filename=file.filename,
        content_type=content_type_enum,
        size=os.path.getsize(file_path)
    )

    # Save file info to database
    db_file = create_file(
        session=session,
        file_in=new_file,
        owner_id=current_user.id
    )

    return db_file