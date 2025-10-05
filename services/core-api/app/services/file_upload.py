# services/file-upload.py
import os
import uuid
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any, List
import mimetypes
from datetime import datetime
import asyncio
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)


class FileUploadService:
    def __init__(self):
        self.base_upload_path = Path(os.getenv("UPLOAD_PATH", "/app/uploads"))
        self.max_file_size = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB default
        self.allowed_extensions = {
            "images": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"},
            "documents": {".pdf", ".doc", ".docx", ".txt", ".rtf"},
            "videos": {".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv"},
            "audio": {".mp3", ".wav", ".flac", ".aac", ".ogg"},
            "archives": {".zip", ".rar", ".7z", ".tar", ".gz"},
        }
        self.base_upload_path.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        for category in ["profiles", "vault", "documents", "temp"]:
            (self.base_upload_path / category).mkdir(exist_ok=True)

    def get_file_category(self, filename: str) -> str:
        """Determine file category based on extension"""
        extension = Path(filename).suffix.lower()

        for category, extensions in self.allowed_extensions.items():
            if extension in extensions:
                return category

        return "documents"  # Default category

    def is_allowed_file(self, filename: str, category: Optional[str] = None) -> bool:
        """Check if file type is allowed"""
        extension = Path(filename).suffix.lower()

        if category:
            return extension in self.allowed_extensions.get(category, set())

        # Check if file is in any allowed category
        for extensions in self.allowed_extensions.values():
            if extension in extensions:
                return True

        return False

    def generate_secure_filename(self, original_filename: str, user_id: str) -> str:
        """Generate secure filename with hash"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_extension = Path(original_filename).suffix.lower()

        # Create hash from user_id + timestamp + original filename
        hash_input = f"{user_id}_{timestamp}_{original_filename}".encode("utf-8")
        file_hash = hashlib.sha256(hash_input).hexdigest()[:12]

        return f"{timestamp}_{file_hash}{file_extension}"

    async def upload_file(
        self,
        file: UploadFile,
        user_id: str,
        category: str = "documents",
        subfolder: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Upload file with security validation"""

        try:
            # Validate file
            if not file.filename:
                raise HTTPException(status_code=400, detail="No file selected")

            if not self.is_allowed_file(
                file.filename, "images" if category == "profiles" else None
            ):
                raise HTTPException(status_code=400, detail="File type not allowed")

            # Read file content
            content = await file.read()

            if len(content) > self.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {self.max_file_size} bytes",
                )

            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Empty file")

            # Generate secure filename
            secure_filename = self.generate_secure_filename(file.filename, user_id)

            # Determine file path
            file_path = self.base_upload_path / category
            if subfolder:
                file_path = file_path / subfolder
                file_path.mkdir(parents=True, exist_ok=True)

            full_path = file_path / secure_filename

            # Save file
            with open(full_path, "wb") as f:
                f.write(content)

            # Get file info
            file_info = {
                "id": str(uuid.uuid4()),
                "filename": secure_filename,
                "original_filename": file.filename,
                "file_path": str(full_path.relative_to(self.base_upload_path)),
                "file_size": len(content),
                "content_type": file.content_type or mimetypes.guess_type(file.filename)[0],
                "category": category,
                "user_id": user_id,
                "uploaded_at": datetime.utcnow().isoformat(),
                "file_hash": hashlib.sha256(content).hexdigest(),
                "url": f"/uploads/{category}/{subfolder + '/' if subfolder else ''}{secure_filename}",
            }

            logger.info(f"File uploaded successfully: {secure_filename} by user {user_id}")
            return file_info

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"File upload error: {e}")
            raise HTTPException(status_code=500, detail="File upload failed")

    async def upload_profile_image(self, file: UploadFile, user_id: str) -> Dict[str, Any]:
        """Upload profile image with specific validation"""

        # Additional validation for profile images
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        return await self.upload_file(file, user_id, category="profiles")

    async def upload_vault_content(
        self, file: UploadFile, user_id: str, content_type: str = "media"
    ) -> Dict[str, Any]:
        """Upload vault content with content-specific validation"""

        return await self.upload_file(file, user_id, category="vault", subfolder=content_type)

    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        try:
            full_path = self.base_upload_path / file_path
            if full_path.exists() and full_path.is_file():
                full_path.unlink()
                logger.info(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"File deletion error: {e}")
            return False

    def get_file_url(self, file_path: str) -> str:
        """Get public URL for file"""
        return f"/uploads/{file_path}"

    def validate_image_file(self, file_content: bytes) -> bool:
        """Validate that file is actually an image"""
        try:
            # Check for common image headers
            image_signatures = {
                b"\xff\xd8\xff": "jpg",
                b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a": "png",
                b"\x47\x49\x46\x38": "gif",
                b"\x52\x49\x46\x46": "webp",
                b"\x42\x4d": "bmp",
            }

            for signature in image_signatures:
                if file_content.startswith(signature):
                    return True

            return False
        except:
            return False


# Global file upload service instance
file_upload_service = FileUploadService()
