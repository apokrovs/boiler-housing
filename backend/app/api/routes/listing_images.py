from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlmodel import select
from typing import List
import uuid

from app.api.deps import CurrentUser, SessionDep
from app.models.images import Image, ImagePublic, ImageFileType
from app.models.listings import Listing
from app.services.file_service import FileStorageService, get_file_format

router = APIRouter(prefix="/listings", tags=["listings"])


# Dependency for FileStorageService
def get_file_storage_service():
    from app.core.config import settings
    return FileStorageService(base_dir=settings.UPLOADS_DIR)


@router.post("/{listing_id}/images/", response_model=ImagePublic)
async def upload_listing_image(*,
                               listing_id: uuid.UUID,
                               file: UploadFile = File(...),
                               is_primary: bool = Form(False),
                               session: SessionDep,
                               file_service: FileStorageService = Depends(get_file_storage_service),
                               current_user = CurrentUser
                               ):
    # Check if listing exists and belongs to the user
    listing = session.exec(
        select(Listing).where(Listing.id == listing_id, Listing.owner_id == current_user.id)
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get file type first
    file_type = get_file_format(file.filename)

    print(f"From listingImages file type is {file_type}")

    # try:
    #     file_type = ImageFileType(file_type)
    # except ValueError:
    #     print(f"Invalid file type: {file_type}")
    #     raise HTTPException(status_code=400, detail=f"Invalid file type: {file_type}")

    # Save the file and get the path
    file_path = await file_service.save_file(file, listing_id)

    # Get file size
    file_size = file.size

    # If this is marked as primary, update all other images
    if is_primary:
        existing_primary_images = session.exec(
            select(Image).where(
                Image.listing_id == listing_id,
                Image.is_primary == True
            )
        ).all()

        for image in existing_primary_images:
            image.is_primary = False
            session.add(image)

    # Create new image record
    new_image = Image(
        filename=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        is_primary=is_primary,
        listing_id=listing_id
    )

    session.add(new_image)
    session.commit()
    session.refresh(new_image)

    return new_image


@router.delete("/{listing_id}/images/{image_id}")
async def delete_listing_image(*,
        listing_id: uuid.UUID,
        image_id: uuid.UUID,
        session: SessionDep,
        file_service: FileStorageService = Depends(get_file_storage_service),
        current_user: CurrentUser
):
    # Check if listing exists and belongs to current user
    listing = session.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get image
    image = session.get(Image, image_id)
    if not image or image.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file
    await file_service.delete_file(image.file_path)

    # Delete record
    session.delete(image)
    session.commit()

    return {"status": "success"}


@router.get("/{listing_id}/images", response_model=List[ImagePublic])
async def get_listing_images(*,
        listing_id: uuid.UUID,
        session: SessionDep
):
    # Check if listing exists
    listing = session.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get images
    images = session.exec(
        select(Image).where(Image.listing_id == listing_id)
    ).all()

    return images


@router.put("/{listing_id}/images/{image_id}", response_model=ImagePublic)
async def update_listing_image(*,
                              listing_id: uuid.UUID,
                              image_id: uuid.UUID,
                              is_primary: bool = Body(False, embed=True),
                              display_order: int = Body(0, embed=True),
                              session: SessionDep,
                              current_user: CurrentUser
                              ):
    """Update image properties like primary status"""
    # Check if listing exists and belongs to current user
    listing = session.get(Listing, listing_id)
    if not listing or listing.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Get image
    image = session.get(Image, image_id)
    if not image or image.listing_id != listing_id:
        raise HTTPException(status_code=404, detail="Image not found")

    # If setting this image as primary, update all other images
    if is_primary:
        existing_primary_images = session.exec(
            select(Image).where(
                Image.listing_id == listing_id,
                Image.is_primary == True,
                Image.id != image_id
            )
        ).all()

        for existing_image in existing_primary_images:
            existing_image.is_primary = False
            session.add(existing_image)

    # Update image
    image.is_primary = is_primary
    image.display_order = display_order
    session.add(image)
    session.commit()
    session.refresh(image)

    return image
