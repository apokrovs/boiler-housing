import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.renter_preferences import RenterPreference, RenterPreferenceCreate, RenterPreferencePublic, RenterPreferencesPublic, RenterPreferenceUpdate
from app.models.utils import Message

router = APIRouter(prefix="/renter_preferences", tags=["renter_preferences"])


@router.get("/", response_model=RenterPreferencePublic)
def read_renter_preference(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Retrieve the current user's renter preference.
    """
    statement = select(RenterPreference).where(RenterPreference.owner_id == current_user.id)
    renter_preference = session.exec(statement).first()

    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")

    return renter_preference


@router.post("/", response_model=RenterPreferencePublic)
def create_renter_preference(
    *, session: SessionDep, current_user: CurrentUser, renter_preference_in: RenterPreferenceCreate
) -> Any:
    """
    Create a new renter preference. Each user can only have one.
    """
    # Check if the user already has a preference
    existing_preference = session.exec(
        select(RenterPreference).where(RenterPreference.owner_id == current_user.id)
    ).first()

    if existing_preference:
        raise HTTPException(status_code=400, detail="User already has a renter preference")

    # Create new preference
    renter_preference = RenterPreference.model_validate(
        renter_preference_in, update={"owner_id": current_user.id}
    )
    session.add(renter_preference)
    session.commit()
    session.refresh(renter_preference)
    return renter_preference


@router.put("/", response_model=RenterPreferencePublic)
def update_renter_preference(
    *, session: SessionDep, current_user: CurrentUser, renter_preference_in: RenterPreferenceUpdate
) -> Any:
    """
    Update the current user's renter preference.
    """
    # Find the user's existing preference
    renter_preference = session.exec(
        select(RenterPreference).where(RenterPreference.owner_id == current_user.id)
    ).first()

    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")

    # Update preference fields
    update_dict = renter_preference_in.model_dump(exclude_unset=True)
    renter_preference.sqlmodel_update(update_dict)

    session.add(renter_preference)
    session.commit()
    session.refresh(renter_preference)
    return renter_preference


@router.delete("/", response_model=Message)
def delete_renter_preference(session: SessionDep, current_user: CurrentUser) -> Message:
    """
    Delete the current user's renter preference.
    """
    renter_preference = session.exec(
        select(RenterPreference).where(RenterPreference.owner_id == current_user.id)
    ).first()

    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")

    session.delete(renter_preference)
    session.commit()
    return Message(message="Renter preference deleted successfully")