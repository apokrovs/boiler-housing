import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.files import File, FileCreate, FilePublic, FilesPublic, ContentType
from app.models.utils import Message

router = APIRouter(prefix="/files", tags=["files"])

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
def create_file(
    *, session: SessionDep, current_user: CurrentUser, file_in: FileCreate
) -> Any:
    """
    Create new item.
    """
    file = File.model_validate(file_in, update={"owner_id": current_user.id})
    session.add(file)
    session.commit()
    session.refresh(file)
    return file