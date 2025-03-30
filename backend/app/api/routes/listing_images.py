import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List
import uuid

from app.models.images import Image, ImagePublic, FileType
from app.models.listings import Listing
from app.api.deps import get_db, CurrentUser
from app.services.file_service import FileStorageService

router = APIRouter()


# Dependency for FileStorageService
def get_file_storage_service():
    from app.core.config import settings
    return FileStorageService(upload_dir=settings.UPLOADS_DIR)


@router.post("/listings/{listing_id}/images/", response_model=ImagePublic)
async def upload_listing_image(
        listing_id: uuid.UUID,
        file: UploadFile = File(...),
        is_primary: bool = Form(False),
        display_order: int = Form(0),
        db: Session = Depends(get_db),
        file_service: FileStorageService = Depends(get_file_storage_service),
        current_user=Depends(CurrentUser)
):
    # Check if listing exists and belongs to the user
    listing = db.exec(
        select(Listing).where(Listing.id == listing_id, Listing.owner_id == current_user.id)
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Save the file and get the path, type and size
    file_path, file_type, file_size = await file_service.save_image(file, listing_id)

    # If this is marked as primary, update other images
    if is_primary:
        other_images = db.exec(
            select(Image).where(Image.listing_id == listing_id, Image.is_primary == True)
        ).all()
        for img in other_images:
            img.is_primary = False
            db.add(img)

    # Create image record
    image = Image(
        filename=file.filename,
        file_path=file_path,
        file_type=FileType(file_type),
        file_size=file_size,
        is_primary=is_primary,
        display_order=display_order,
        listing_id=listing_id
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image


@router.get("/listings/{listing_id}/images/", response_model=List[ImagePublic])
async def get_listing_images(
        listing_id: uuid.UUID,
        db: Session = Depends(get_db)
):
    # Get all images for the listing
    images = db.exec(
        select(Image).where(Image.listing_id == listing_id)
    ).all()

    return images


@router.put("/images/{image_id}", response_model=ImagePublic)
async def update_image(
        image_id: uuid.UUID,
        is_primary: bool = Form(None),
        display_order: int = Form(None),
        db: Session = Depends(get_db),
        current_user=Depends(CurrentUser)
):
    # Get the image and check ownership
    image = db.exec(
        select(Image)
        .join(Listing)
        .where(
            Image.id == image_id,
            Listing.owner_id == current_user.id
        )
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found or you don't have permission")

    # Update the image
    if is_primary is not None:
        if is_primary:
            # Update other images if this is becoming primary
            other_images = db.exec(
                select(Image).where(
                    Image.listing_id == image.listing_id,
                    Image.id != image_id,
                    Image.is_primary == True
                )
            ).all()
            for img in other_images:
                img.is_primary = False
                db.add(img)

        image.is_primary = is_primary

    if display_order is not None:
        image.display_order = display_order

    db.add(image)
    db.commit()
    db.refresh(image)

    return image


@router.delete("/images/{image_id}")
async def delete_image(
        image_id: uuid.UUID,
        db: Session = Depends(get_db),
        file_service: FileStorageService = Depends(get_file_storage_service),
        current_user=Depends(CurrentUser)
):
    # Get the image and check ownership
    image = db.exec(
        select(Image)
        .join(Listing)
        .where(
            Image.id == image_id,
            Listing.owner_id == current_user.id
        )
    ).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found or you don't have permission")

    # Delete the file
    await file_service.delete_file(image.file_path)

    # Delete the database record
    db.delete(image)
    db.commit()

    return {"detail": "Image deleted successfully"}


# Route to serve images
@router.get("/images/{path:path}")
async def get_image(
        path: str,
        file_service: FileStorageService = Depends(get_file_storage_service)
):
    file_path = os.path.join(file_service.upload_dir, path)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(file_path)