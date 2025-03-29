import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.listings import Listing, ListingCreate, ListingPublic, ListingsPublic, ListingUpdate
from app.models.utils import Message

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

    return ListingsPublic(data=listings, count=count)

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
    return ListingsPublic(data=listings, count=count)

@router.get("/{id}", response_model=ListingPublic)
def read_listing(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get listing by ID.
    """
    listing = session.get(Listing, id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if not current_user.is_superuser and (listing.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return listing


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
