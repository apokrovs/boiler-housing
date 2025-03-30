import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
from typing import Tuple
import magic


class FileStorageService:
    def __init__(self, upload_dir: str):
        self.upload_dir = upload_dir
        self.images_dir = os.path.join(upload_dir, "images")

        # Create directories
        os.makedirs(self.images_dir, exist_ok=True)

    async def validate_image_file(self, file: UploadFile) -> Tuple[bool, str]:
        """Validate if the file is an allowed image type and return the file type."""
        # Read the first chunk to detect file type
        contents = await file.read(1024)
        # Reset file position
        await file.seek(0)

        # Use python-magic for more accurate file type detection
        mime = magic.Magic(mime=True)
        detected_type = mime.from_buffer(contents)

        # Valid image types
        valid_types = [
            "image/jpeg", "image/jpg", "image/png",
            "image/webp", "image/gif"
        ]

        if detected_type in valid_types:
            return True, detected_type
        return False, None

    async def save_image(self, file: UploadFile, listing_id: uuid.UUID) -> Tuple[str, str, int]:
        """Save an image file and return the file path, type and size."""
        is_valid, file_type = await self.validate_image_file(file)

        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        # Create a directory for the listing if it doesn't exist
        listing_dir = os.path.join(self.images_dir, str(listing_id))
        os.makedirs(listing_dir, exist_ok=True)

        # Generate a unique filename
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(listing_dir, filename)

        # Get file size
        await file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        await file.seek(0)  # Reset position

        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the relative path for storage in the database
        return os.path.join("images", str(listing_id), filename), file_type, file_size

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file."""
        full_path = os.path.join(self.upload_dir, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

    async def delete_listing_files(self, listing_id: uuid.UUID) -> bool:
        """Delete all files for a listing."""
        images_listing_dir = os.path.join(self.images_dir, str(listing_id))

        if os.path.exists(images_listing_dir):
            shutil.rmtree(images_listing_dir)
            return True
        return False