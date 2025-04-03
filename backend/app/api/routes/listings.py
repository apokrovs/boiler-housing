import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.listings import Listing, ListingCreate, ListingPublic, ListingsPublic, ListingUpdate
from app.models.utils import Message

from app.crud import users as crud_users
import logging

from app.utils import generate_listing_like_email, send_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("/", response_model=ListingsPublic)
def read_listings(
        session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve listings.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Listing)
        count = session.exec(count_statement).one()
        statement = select(Listing).offset(skip).limit(limit)
        listings = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Listing)
            .where(Listing.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Listing)
            .where(Listing.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        listings = session.exec(statement).all()

    processed_listings = []
    for listing in listings:
        listing_dict = listing.dict()
        # Convert Image objects to dictionaries
        listing_dict["images"] = [img.dict() for img in listing.images]
        processed_listings.append(ListingPublic.model_validate(listing_dict))

    return ListingsPublic(data=processed_listings, count=count)


@router.get("/all", response_model=ListingsPublic)
def read_all_listings(
        session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve listings.
    """

    count_statement = select(func.count()).select_from(Listing)
    count = session.exec(count_statement).one()
    statement = select(Listing).offset(skip).limit(limit)
    listings = session.exec(statement).all()

    # Convert listings to ListingPublic objects with image data
    processed_listings = []
    for listing in listings:
        listing_dict = listing.dict()
        # Convert Image objects to dictionaries
        listing_dict["images"] = [img.dict() for img in listing.images]
        processed_listings.append(ListingPublic.model_validate(listing_dict))

    return ListingsPublic(data=processed_listings, count=count)


@router.get("/{id}", response_model=ListingPublic)
def read_listing(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get listing by ID.
    """
    listing = session.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_superuser and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # For images
    listing_dict = listing.dict()
    listing_dict["images"] = [img.dict() for img in listing.images]

    return ListingPublic.model_validate(listing_dict)


@router.post("/", response_model=ListingPublic)
def create_listing(
        *, session: SessionDep, current_user: CurrentUser, listing_in: ListingCreate
) -> Any:
    """
    Create new listing.
    """
    listing = Listing.model_validate(listing_in, update={"owner_id": current_user.id})
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return listing


@router.put("/{id}", response_model=ListingPublic)
def update_listing(
        *,
        session: SessionDep,
        current_user: CurrentUser,
        id: uuid.UUID,
        listing_in: ListingUpdate,
) -> Any:
    """
    Update a listing.
    """
    listing = session.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_superuser and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = listing_in.model_dump(exclude_unset=True)
    listing.sqlmodel_update(update_dict)
    session.add(listing)
    session.commit()
    session.refresh(listing)
    return listing


@router.delete("/{id}")
def delete_listing(
        session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a listing.
    """
    listing = session.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_superuser and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(listing)
    session.commit()
    return Message(message="Listing deleted successfully")

@router.post("/like/{email}", response_model=Message)
def listing_like_email(*, session: SessionDep, email: str) -> Message:

    user = crud_users.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )

    logger.info(f"Sending new message email to {user.email}")
    email_data = generate_listing_like_email(email_to=user.email)
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Email sent successfully.")

@router.get("/by-id/{id}", response_model=ListingPublic)
def read_listing_public(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get a listing by ID.
    """
    listing = session.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
