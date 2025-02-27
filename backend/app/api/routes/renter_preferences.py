import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models.renter_preferences import RenterPreference, RenterPreferenceCreate, RenterPreferencePublic, RenterPreferencesPublic, RenterPreferenceUpdate
from app.models.utils import Message

router = APIRouter(prefix="/renter_preferences", tags=["renter_preferences"])


@router.get("/", response_model=RenterPreferencesPublic)
def read_preferences(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve renter preferences.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(RenterPreference)
        count = session.exec(count_statement).one()
        statement = select(RenterPreference).offset(skip).limit(limit)
        renter_preferences = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(RenterPreference)
            .where(RenterPreference.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(RenterPreference)
            .where(RenterPreference.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        renter_preferences = session.exec(statement).all()

    return RenterPreferencesPublic(data=renter_preferences, count=count)


@router.get("/{id}", response_model=RenterPreferencePublic)
def read_renter_preference(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get renter preference by ID.
    """
    renter_preference = session.get(RenterPreference, id)
    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")
    if not current_user.is_superuser and (renter_preference.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return renter_preference


@router.post("/", response_model=RenterPreferencePublic)
def create_renter_preference(
    *, session: SessionDep, current_user: CurrentUser, renter_preference_in: RenterPreferenceCreate
) -> Any:
    """
    Create new renter preference.
    """
    renter_preference = RenterPreference.model_validate(renter_preference_in, update={"owner_id": current_user.id})
    session.add(renter_preference)
    session.commit()
    session.refresh(renter_preference)
    return renter_preference


@router.put("/{id}", response_model=RenterPreferencePublic)
def update_renter_preference(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    renter_preference_in: RenterPreferenceUpdate,
) -> Any:
    """
    Update a renter preference.
    """
    renter_preference = session.get(RenterPreference, id)
    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")
    if not current_user.is_superuser and (renter_preference.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = renter_preference_in.model_dump(exclude_unset=True)
    renter_preference.sqlmodel_update(update_dict)
    session.add(renter_preference)
    session.commit()
    session.refresh(renter_preference)
    return renter_preference


@router.delete("/{id}")
def delete_renter_preference(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a renter preference.
    """
    renter_preference = session.get(RenterPreference, id)
    if not renter_preference:
        raise HTTPException(status_code=404, detail="Renter preference not found")
    if not current_user.is_superuser and (renter_preference.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(renter_preference)
    session.commit()
    return Message(message="Renter preference deleted successfully")
