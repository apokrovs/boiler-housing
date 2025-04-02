from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List
import uuid

from app.models.images import Image, ImagePublic
from app.models.users import User
from app.models.listings import Listing
from app.api.deps import get_db, CurrentUser
from app.services.file_service import FileStorageService, get_file_format

router = APIRouter()


# Dependency for FileStorageService
def get_file_storage_service():
    from app.core.config import settings
    return FileStorageService(base_dir=settings.UPLOADS_DIR)


@router.post("/listings/{listing_id}/images/", response_model=ImagePublic)
async def upload_listing_image(*,
        listing_id: uuid.UUID,
        file: UploadFile = File(...),
        is_primary: bool = Form(False),
        db: Session = Depends(get_db),
        file_service: FileStorageService = Depends(get_file_storage_service),
        current_user = Depends(CurrentUser)
):
    # Check if listing exists and belongs to the user
    listing = db.exec(
        select(Listing).where(Listing.id == listing_id, Listing.owner_id == current_user.id)
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Save the file and get the path, type and size
    file_path = await file_service.save_file(file, listing_id)
    file_format = get_file_format(file.filename)

    # If this is marked as primary, update all other images
    if is_primary:
        existing_primary_images = db.exec(
            select(Image).where(
                Image.listing_id == listing_id,
                Image.is_primary == True
            )
        ).all()

        for image in existing_primary_images:
            image.is_primary = False
            db.add(image)

    # Create new image record
    new_image = Image(
        file_path=file_path,
        file_format=file_format,
        is_primary=is_primary,
        listing_id=listing_id
    )

    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image


@router.get("/listings/{listing_id}/images/", response_model=List[ImagePublic])
async def get_listing_images(*,
        listing_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    # Get all images for the listing
    images = db.exec(
        select(Image).where(Image.listing_id == listing_id)
    ).all()

    return images


@router.delete("/listings/{listing_id}/images/{image_id}")
async def delete_listing_image(*,
        listing_id: uuid.UUID,
        image_id: uuid.UUID,
        db: Session = Depends(get_db),
        file_service: FileStorageService = Depends(get_file_storage_service),
        current_user: User = Depends(CurrentUser)
):
    # Check if listing exists and belongs to current user
    listing = db.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get image
    image = db.get(Image, image_id)
    if not image or image.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file
    await file_service.delete_file(image.file_path)

    # Delete record
    db.delete(image)
    db.commit()

    return {"status": "success"}


@router.get("/listings/{listing_id}/images", response_model=List[ImagePublic])
async def get_listing_images(*,
        listing_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    # Check if listing exists
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get images
    images = db.exec(
        select(Image).where(Image.listing_id == listing_id)
    ).all()

    return images