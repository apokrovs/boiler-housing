from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlmodel import select
from typing import List
import uuid

from app.api.deps import CurrentUser, SessionDep
from app.models.lease_agreements import LeaseAgreement, LeaseAgreementPublic, LeaseFileType
from app.models.listings import Listing
from app.services.file_service import FileStorageService, get_file_format

router = APIRouter(prefix="/listings", tags=["lease_agreements"])

def get_file_storage_service():
    from app.core.config import settings
    return FileStorageService(base_dir=settings.UPLOADS_DIR)

@router.post("/{listing_id}/lease-agreements/", response_model=LeaseAgreementPublic)
async def upload_lease_agreement(*,
                                 listing_id: uuid.UUID,
                                 file: UploadFile = File(...),
                                 description: str = Form(None),
                                 session: SessionDep,
                                 file_service: FileStorageService = Depends(get_file_storage_service),
                                 current_user=CurrentUser):
    # Check if listing exists and belongs to the user
    listing = session.exec(
        select(Listing).where(Listing.id == listing_id, Listing.owner_id == current_user.id)
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Enforce one-to-one: ensure there is no existing lease agreement for the listing
    if listing.lease_agreement:
        raise HTTPException(status_code=400, detail="Lease agreement already exists for this listing")

    # Validate file type
    file_type = get_file_format(file.filename)
    allowed_types = ["application/pdf", "text/plain"]
    if file_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File format not allowed for lease agreements. Allowed formats: pdf, txt"
        )

    try:
        file_type = LeaseFileType(file_type)
    except ValueError:
        print(f"Invalid file type: {file_type}")
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file_type}")

    # Save file and get its path
    file_path = await file_service.save_file(file, listing_id)
    file_size = file.size

    # Create new lease agreement record
    new_agreement = LeaseAgreement(
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        description=description,
        listing_id=listing_id
    )

    session.add(new_agreement)
    session.commit()
    session.refresh(new_agreement)

    return new_agreement

@router.delete("/{listing_id}/lease-agreements/{agreement_id}")
async def delete_lease_agreement(*,
                                 listing_id: uuid.UUID,
                                 agreement_id: uuid.UUID,
                                 session: SessionDep,
                                 file_service: FileStorageService = Depends(get_file_storage_service),
                                 current_user=CurrentUser):
    # Check if listing exists and belongs to current user
    listing = session.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get lease agreement
    agreement = session.get(LeaseAgreement, agreement_id)
    if not agreement or agreement.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Lease agreement not found")

    # Delete file from storage
    await file_service.delete_file(agreement.file_path)

    # Delete record
    session.delete(agreement)
    session.commit()

    return {"status": "success"}

@router.get("/{listing_id}/lease-agreements", response_model=List[LeaseAgreementPublic])
async def get_lease_agreements(*,
                               listing_id: uuid.UUID,
                               session: SessionDep,
                               current_user=CurrentUser):
    # Check if listing exists
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check if user is owner or a superuser
    if listing.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to view these lease agreements")

    if listing.lease_agreement:
        return listing.lease_agreement
    else:
        return None

@router.put("/{listing_id}/lease-agreements/{agreement_id}", response_model=LeaseAgreementPublic)
async def update_lease_agreement(*,
                                 listing_id: uuid.UUID,
                                 agreement_id: uuid.UUID,
                                 description: str = Body(None, embed=True),
                                 session: SessionDep,
                                 current_user=CurrentUser):
    """Update lease agreement properties like description"""
    # Check if listing exists and belongs to current user
    listing = session.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get lease agreement
    agreement = session.get(LeaseAgreement, agreement_id)
    if not agreement or agreement.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Lease agreement not found")

    # Update agreement
    if description is not None:
        agreement.description = description

    session.add(agreement)
    session.commit()
    session.refresh(agreement)

    return agreement
