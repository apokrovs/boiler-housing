import uuid

from sqlmodel import Session

from app.models.renter_preferences import RenterPreferenceCreate, RenterPreference


def create_renter_preference(*, session: Session, renter_preferences_in: RenterPreferenceCreate, owner_id: uuid.UUID) -> RenterPreference:
    db_renter_preferences = RenterPreference.model_validate(renter_preferences_in, update={"owner_id": owner_id})
    session.add(db_renter_preferences)
    session.commit()
    session.refresh(db_renter_preferences)
    return db_renter_preferences