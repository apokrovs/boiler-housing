import uuid

from sqlmodel import Session

from app.models.files import File, FileCreate


def create_file(*, session: Session,
                file_in: FileCreate,
                owner_id: uuid.UUID) -> File:

    db_file = File.model_validate(file_in, update={"owner_id": owner_id})

    session.add(db_file)
    session.commit()
    session.refresh(db_file)
    return db_file
