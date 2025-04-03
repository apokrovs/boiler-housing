import logging
import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
import uuid

from app.models.images import ImageFileType

logger = logging.getLogger(__name__)


def get_file_format(filename: str) -> str:
    """Convert file extension to MIME type"""
    if not filename or "." not in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    extension = filename.split(".")[-1].lower()

    # Map extension to MIME type
    extension_to_mime = {
        "jpg": "image/jpg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
        "pdf": "application/pdf",
        "txt": "text/plain"
    }

    if extension not in extension_to_mime:
        raise HTTPException(
            status_code=400,
            detail=f"File format not allowed. Allowed formats: jpg, jpeg, png, webp, gif, pdf, txt"
        )

    return extension_to_mime[extension]


class FileStorageService:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, listing_id: uuid.UUID) -> str:
        """Save an uploaded file to the storage system and return the file path"""
        # Validate file type and convert to ImageFileType enum
        file_type = get_file_format(file.filename)

        # Create directory for listing if it doesn't exist
        listing_dir = self.base_dir / str(listing_id)
        os.makedirs(listing_dir, exist_ok=True)

        # Extract just the extension for the filename
        extension = file.filename.split(".")[-1].lower()

        # Create unique filename
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = listing_dir / unique_filename

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return relative path from base_dir
        return str(Path(str(listing_id)) / unique_filename)

    def get_file_path(self, relative_path: str) -> Path:
        """Get the full path for a stored file"""
        return self.base_dir / relative_path

    async def delete_file(self, relative_path: str) -> bool:
        """Delete a file from storage"""
        file_path = self.get_file_path(relative_path)
        if file_path.exists():
            os.remove(file_path)
            return True
        return False

    async def delete_listing_directory(self, listing_id: uuid.UUID) -> bool:
        """
        Delete an entire listing directory with all its files.

        Args:
            listing_id: ID of the listing to delete files for

        Returns:
            True if successful, False otherwise
        """
        try:
            listing_dir = self.base_dir / str(listing_id)

            # Check if directory exists
            if not listing_dir.exists():
                logger.info(f"Directory for listing {listing_id} doesn't exist, nothing to delete")
                return True  # Nothing to delete

            # Use shutil.rmtree to delete directory and all contents
            shutil.rmtree(listing_dir)
            logger.info(f"Successfully deleted directory for listing {listing_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting listing directory for {listing_id}: {e}")
            return False