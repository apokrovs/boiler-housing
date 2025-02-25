from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models.users import Item, User
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers
from app.models.messages import Conversation, ConversationParticipant, Message, ReadReceipt


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        # Initialize the database
        init_db(session)

        # Ensure superuser exists with correct credentials
        from app.crud import users as user_crud
        from app.models.users import UserCreate

        # Check if superuser exists
        superuser = user_crud.get_user_by_email(session=session, email=settings.FIRST_SUPERUSER)
        if not superuser:
            # Create superuser if it doesn't exist
            superuser_in = UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            )
            user_crud.create_user(session=session, user_create=superuser_in)
        else:
            # Update password to ensure it's correct
            from app.core.security import get_password_hash
            superuser.hashed_password = get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            session.add(superuser)
            session.commit()

        yield session

        # Clean up all data
        # Delete in correct order to avoid foreign key violations
        statement = delete(ConversationParticipant)
        session.execute(statement)

        statement = delete(ReadReceipt)
        session.execute(statement)

        statement = delete(Message)
        session.execute(statement)

        statement = delete(Conversation)
        session.execute(statement)

        statement = delete(Item)
        session.execute(statement)

        statement = delete(User)
        session.execute(statement)

        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
