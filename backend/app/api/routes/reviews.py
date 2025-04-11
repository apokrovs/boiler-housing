from fastapi import APIRouter, HTTPException
from typing import List
from uuid import UUID
from app.api.deps import SessionDep
from app.crud import reviews as review_crud
from app.models.reviews import ReviewCreate, ReviewUpdate, ReviewPublic, ReviewsPublic

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=ReviewPublic)
def create_review(review_in: ReviewCreate, session: SessionDep):
    review = review_crud.create_review(session, review_in)
    return review

@router.get("/{item_id}", response_model=ReviewsPublic)
def get_reviews(item_id: UUID, session: SessionDep):
    reviews = review_crud.get_all_reviews_by_item(session, item_id)
    return ReviewsPublic(data=reviews, count=len(reviews))

@router.get("/review/{review_id}", response_model=ReviewPublic)
def get_review(review_id: UUID, session: SessionDep):
    review = review_crud.get_review_by_id(session, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.patch("/{review_id}", response_model=ReviewPublic)
def update_review(review_id: UUID, review_update: ReviewUpdate, session: SessionDep):
    updated_review = review_crud.update_review(session, review_id, review_update)
    return updated_review

@router.delete("/{review_id}", response_model=dict)
def delete_review(review_id: UUID, session: SessionDep):
    success = review_crud.delete_review(session, review_id)
    if not success:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted successfully"}
