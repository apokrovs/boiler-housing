import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from typing import List
from app.models.items import Item
from sqlalchemy import JSON
from sqlmodel import Column


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    phone_number: str | None = Field(index=True, unique=True, max_length=10)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=255)
    profile_type: str | None = Field(default=None, max_length=255)
    auto_logout: float = Field(default=30)
    is_2fa_enabled: bool | None = Field(default=False)
    saved_listings: List[str] = []
    hasTakenRoommateQuiz: bool | None = Field(default=False)
    cleanScore: int | None = Field(default=None)
    visitScore: int | None = Field(default=None)
    sleepTime: int | None = Field(default=None)
    pets: int | None = Field(default=None)
    smoking: int | None = Field(default=None)
    alcoholScore: int | None = Field(default=None)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    phone_number: str | None = Field(unique=True, max_length=10)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    auto_logout: float = Field(default=30)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)
    auto_logout: float | None = Field(default=30)
    pin: str | None = Field(default=None, min_length=4, max_length=4)
    is_2fa_enabled: bool | None = Field(default=False)
    hasTakenRoommateQuiz: bool | None = Field(default=False)
    cleanScore: int | None = Field(default=None)
    visitScore: int | None = Field(default=None)
    sleepTime: int | None = Field(default=None)
    pets: int | None = Field(default=None)
    smoking: int | None = Field(default=None)
    alcoholScore: int | None = Field(default=None)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(index=True, unique=True, max_length=10)
    bio: str | None = Field(default=None, max_length=255)
    profile_type: str | None = Field(default=None, max_length=255)
    auto_logout: float | None = Field(default=30)
    hasTakenRoommateQuiz: bool | None = Field(default=False)
    cleanScore: int | None = Field(default=None)
    visitScore: int | None = Field(default=None)
    sleepTime: int | None = Field(default=None)
    pets: int | None = Field(default=None)
    smoking: int | None = Field(default=None)
    alcoholScore: int | None = Field(default=None)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


class UpdatePin(SQLModel):
    current_pin: str = Field(min_length=4, max_length=4)
    new_pin: str = Field(min_length=4, max_length=4)


# Database model, database table inferred from class sender_name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    hashed_pin: str | None = Field(default=None)
    is_2fa_enabled: bool | None = Field(default=False)
    latest_otp: str | None = Field(default=None)
    items: List["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    profile_tutorial_completed: bool = Field(default=False)

    # Add these fields for user blocking
    blocked_users: List["UserBlock"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserBlock.blocker_id]", "back_populates": "blocker"}
    )
    blocked_by_users: List["UserBlock"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserBlock.blocked_id]", "back_populates": "blocked"}
    )

    listings: List["Listing"] = Relationship(back_populates="owner", cascade_delete=True)

    saved_listings: List[str] = Field(default_factory=list, sa_column=Column(JSON))


class PinLogin(SQLModel):
    email: EmailStr = Field(max_length=255)
    pin: str = Field(min_length=4, max_length=4)


class UserCreateWithPin(UserCreate):
    pin: str | None = Field(default=None, min_length=4, max_length=4)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int


class UpdateSavedListings(SQLModel):
    saved_listings: List[str]
