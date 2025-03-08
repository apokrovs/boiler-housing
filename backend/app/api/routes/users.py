import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import col, delete, func, select, Session

from app.crud import users as crud_users
from app.crud.users import update_user
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.models.items import Item

from app.models.users import (
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
    UpdatePin,
    ChangePassword
)

from app.models.utils import Message
from app.utils import generate_new_account_email, send_email
from app.api.deps import get_db, get_current_user
router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    response_model=UsersPublic
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()

    return UsersPublic(data=users, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = crud_users.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user = crud_users.create_user(session=session, user_create=user_in)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.get("/by-email/{email}", response_model=UserPublic)
def read_user_by_email(*, email: str, session: SessionDep) -> Any:
    """
    Get a specific user by email.
    """
    user = crud_users.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """
    if user_in.email:
        existing_user = crud_users.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.patch("/me/profile", response_model=Message)
def update_active_profile(
    *, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Switch the active profile type.
    """

    if current_user.active_profile_type == "Renter":
        current_user.active_profile_type = "Leaser"
    else :
        current_user.active_profile_type = "Renter"

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return Message(message="Active profile switched successfully")

@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.post("/me/pin", response_model=Message)
def update_user_pin(
    *, session: SessionDep, body: UpdatePin, current_user: CurrentUser
) -> Any:
    """
    Set or update the user's PIN.
    """
    if not body.new_pin.isdigit() or len(body.new_pin) != 4:
        raise HTTPException(
            status_code=400, detail="PIN must be a 4-digit number"
        )

    hashed_pin = get_password_hash(body.new_pin)
    current_user.hashed_pin = hashed_pin
    session.add(current_user)
    session.commit()
    return Message(message="PIN updated successfully")


@router.post("/me/verify-pin", response_model=Message)
def verify_user_pin(
    *, session: SessionDep, pin: str, current_user: CurrentUser
) -> Any:
    """
    Verify the user's PIN.
    """
    if not current_user.hashed_pin:
        raise HTTPException(status_code=400, detail="PIN not set")

    if not verify_password(pin, current_user.hashed_pin):
        raise HTTPException(status_code=401, detail="Incorrect PIN")

    return Message(message="PIN verified successfully")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user

@router.delete("/me/renter", response_model=Message)
def delete_renter_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own renter profile
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    current_user.profile_type = "Leaser"
    session.add(current_user)
    session.commit()
    return Message(message="Renter profile deleted successfully")

@router.delete("/me/leaser", response_model=Message)
def delete_leaser_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own leaser profile
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    current_user.profile_type = "Renter"
    session.add(current_user)
    session.commit()
    return Message(message="Leaser profile deleted successfully")

@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = crud_users.get_user_by_email(session=session, email=user_in.email)
    user2 = crud_users.get_user_by_phone_number(session=session, phone_number=user_in.phone_number)
    if user or user2:
        raise HTTPException(
            status_code=400,
            detail="The user with this email or phone number already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = crud_users.create_user(session=session, user_create=user_create)
    return user


@router.get("/by-id/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    # if not current_user.is_superuser:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="The user doesn't have enough privileges",
    #     )
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    if user_in.email:
        existing_user = crud_users.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    db_user = crud_users.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    # Directly reference the model attribute for filtering
    statement = delete(Item).where(Item.owner_id == user_id)
    session.exec(statement)  # type: ignore
    session.delete(user)
    session.commit()
    return Message(message="User deleted successfully")

@router.post("/change-password")
def change_password(
    password_data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")


    if password_data.new_password != password_data.confirm_new_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")


    user_update = UserUpdate(password=password_data.new_password)
    updated_user = update_user(session=db, db_user=current_user, user_in=user_update)

    return {"detail": "Password updated successfully"}


@router.patch("/me/2fa", response_model=UserPublic)
def update_2fa_status(
    *, session: SessionDep, current_user: CurrentUser, enabled: bool
) -> Any:
    """
    Enable or disable two-factor authentication for the current user.
    """
    current_user.is_2fa_enabled = enabled
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user