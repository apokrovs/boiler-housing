import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from typing import List
import uuid

from app.models.images import FileType


def get_file_format(filename: str) -> str:
    """Extract file format from filename"""
    if not filename or "." not in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return filename.split(".")[-1].lower()


class FileStorageService:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    async def save_file(self, file: UploadFile, listing_id: uuid.UUID) -> str:
        """Save an uploaded file to the storage system and return the file path"""
        # Validate file type
        file_format = get_file_format(file.filename)
        if file_format not in [format.value for format in FileType]:
            raise HTTPException(
                status_code=400,
                detail=f"File format not allowed. Allowed formats: {', '.join([f.value for f in FileType])}"
            )

        # Create directory for listing if it doesn't exist
        listing_dir = self.base_dir / str(listing_id)
        os.makedirs(listing_dir, exist_ok=True)

        # Create unique filename
        unique_filename = f"{uuid.uuid4()}.{file_format}"
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