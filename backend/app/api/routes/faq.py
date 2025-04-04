from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from sqlmodel import Session
from app.api.deps import SessionDep
from app.crud import faq as faq_crud
from app.models.faq import FAQCreate, FAQUpdate, FAQPublic, FAQsPublic

router = APIRouter(prefix="/faq", tags=["FAQ"])

@router.post("/", response_model=FAQPublic)
def create_faq(
    faq_in: FAQCreate,
    session: SessionDep
):
    faq = faq_crud.create_faq(session, faq_in)
    return faq

@router.get("/", response_model=FAQsPublic)
def get_all_faqs(session: SessionDep):
    faqs = faq_crud.get_all_faqs(session)
    return FAQsPublic(data=faqs, count=len(faqs))

@router.get("/{faq_id}", response_model=FAQPublic)
def get_faq(faq_id: UUID, session: SessionDep):
    faq = faq_crud.get_faq_by_id(session, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq

@router.patch("/{faq_id}", response_model=FAQPublic)
def update_faq(
    faq_id: UUID,
    faq_update: FAQUpdate,
    session: SessionDep
):
    updated_faq = faq_crud.update_faq_answer(session, faq_id, faq_update)
    return updated_faq

@router.delete("/{faq_id}", response_model=dict)
def delete_faq(faq_id: UUID, session: SessionDep):
    success = faq_crud.delete_faq(session, faq_id)
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted successfully"}
