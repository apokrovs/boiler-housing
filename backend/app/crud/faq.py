from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException
from app.models.faq import FAQ, FAQCreate, FAQUpdate

def create_faq(session: Session, faq_in: FAQCreate) -> FAQ:
    faq = FAQ(**faq_in.dict())
    session.add(faq)
    session.commit()
    session.refresh(faq)
    return faq

def get_all_faqs(session: Session) -> List[FAQ]:
    return session.exec(select(FAQ)).all()

def get_faq_by_id(session: Session, faq_id: UUID) -> Optional[FAQ]:
    return session.get(FAQ, faq_id)

def update_faq_answer(session: Session, faq_id: UUID, faq_update: FAQUpdate) -> FAQ:
    faq = session.get(FAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    if faq_update.answer is not None:
        faq.answer = faq_update.answer

    session.add(faq)
    session.commit()
    session.refresh(faq)
    return faq

def delete_faq(session: Session, faq_id: UUID) -> bool:
    faq = session.get(FAQ, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")

    session.delete(faq)
    session.commit()
    return True
