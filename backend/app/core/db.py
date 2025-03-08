from sqlmodel import Session, create_engine, select

from app.crud import users as crud_users
from app.core.config import settings
from app.models.users import User, UserCreate

engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_size=20,
    max_overflow=20,
    pool_timeout=60,
    pool_pre_ping=True,
    pool_recycle=3600
)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            phone_number="1234567890",
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True
        )
        user = crud_users.create_user(session=session, user_create=user_in)
