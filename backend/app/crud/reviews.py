from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException
from app.models.reviews import Review, ReviewCreate, ReviewUpdate

def create_review(session: Session, review_in: ReviewCreate) -> Review:
    review = Review.model_validate(review_in)
    session.add(review)
    session.commit()
    session.refresh(review)
    return review

def get_all_reviews_by_item(session: Session, item_id: UUID) -> List[Review]:
    return session.exec(select(Review).where(Review.item_id == item_id)).all()

def get_review_by_id(session: Session, review_id: UUID) -> Optional[Review]:
    return session.get(Review, review_id)

def update_review(session: Session, review_id: UUID, review_update: ReviewUpdate) -> Review:
    db_review = session.get(Review, review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")

    update_data = review_update.model_dump(exclude_unset=True)
    db_review.sqlmodel_update(update_data)

    session.add(db_review)
    session.commit()
    session.refresh(db_review)
    return db_review

def delete_review(session: Session, review_id: UUID) -> bool:
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    session.delete(review)
    session.commit()
    return True
