# routes/uploads.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional, List
import logging
from datetime import datetime

from ..db.base import get_session
from ..models.file_upload import FileUpload
from ..db.models.users import User
from ..services.file_upload import file_upload_service
from agents.common.security import authorize_headers, IdentityClaims

# get_user_from_claims function may need to be implemented or imported from elsewhere

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload/profile-image")
async def upload_profile_image(
    file: UploadFile = File(...), claims: dict = Depends(authorize_headers)
):
    """Upload profile image"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        # Upload file
        file_info = await file_upload_service.upload_profile_image(file, user_id)

        # Save to database
        for db in get_session():
            # Check if user has existing profile image and mark as inactive
            existing_images = (
                db.query(FileUpload)
                .filter(
                    FileUpload.user_id == user_id,
                    FileUpload.category == "profiles",
                    FileUpload.is_active == True,
                )
                .all()
            )

            for img in existing_images:
                img.is_active = False
                img.updated_at = datetime.utcnow()

            # Save new file record
            file_record = FileUpload(
                id=file_info["id"],
                user_id=user_id,
                filename=file_info["filename"],
                original_filename=file_info["original_filename"],
                file_path=file_info["file_path"],
                file_size=file_info["file_size"],
                content_type=file_info["content_type"],
                category=file_info["category"],
                file_hash=file_info["file_hash"],
            )

            db.add(file_record)
            db.commit()

            # Update user profile image
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.profile_image_url = file_info["url"]
                user.updated_at = datetime.utcnow()
                db.commit()

            return {"success": True, "file": file_info}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile image upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.post("/upload/vault-content")
async def upload_vault_content(
    file: UploadFile = File(...),
    content_type: str = "media",
    claims: dict = Depends(authorize_headers),
):
    """Upload vault content"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        # Upload file
        file_info = await file_upload_service.upload_vault_content(file, user_id, content_type)

        # Save to database
        for db in get_session():
            file_record = FileUpload(
                id=file_info["id"],
                user_id=user_id,
                filename=file_info["filename"],
                original_filename=file_info["original_filename"],
                file_path=file_info["file_path"],
                file_size=file_info["file_size"],
                content_type=file_info["content_type"],
                category=file_info["category"],
                file_hash=file_info["file_hash"],
            )

            db.add(file_record)
            db.commit()

            return {"success": True, "file": file_info}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vault content upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.post("/upload/document")
async def upload_document(file: UploadFile = File(...), claims: dict = Depends(authorize_headers)):
    """Upload document"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        # Upload file
        file_info = await file_upload_service.upload_file(file, user_id, category="documents")

        # Save to database
        for db in get_session():
            file_record = FileUpload(
                id=file_info["id"],
                user_id=user_id,
                filename=file_info["filename"],
                original_filename=file_info["original_filename"],
                file_path=file_info["file_path"],
                file_size=file_info["file_size"],
                content_type=file_info["content_type"],
                category=file_info["category"],
                file_hash=file_info["file_hash"],
            )

            db.add(file_record)
            db.commit()

            return {"success": True, "file": file_info}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")


@router.get("/uploads/{category}/{filename}")
async def serve_file(category: str, filename: str):
    """Serve uploaded files"""
    try:
        file_path = Path(file_upload_service.base_upload_path) / category / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=500, detail="Error serving file")


@router.get("/uploads/{category}/{subfolder}/{filename}")
async def serve_file_with_subfolder(category: str, subfolder: str, filename: str):
    """Serve uploaded files with subfolder"""
    try:
        file_path = Path(file_upload_service.base_upload_path) / category / subfolder / filename

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File serve error: {e}")
        raise HTTPException(status_code=500, detail="Error serving file")


@router.get("/my-files")
async def get_user_files(category: Optional[str] = None, claims: dict = Depends(authorize_headers)):
    """Get user's uploaded files"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            query = db.query(FileUpload).filter(
                FileUpload.user_id == user_id, FileUpload.is_active == True
            )

            if category:
                query = query.filter(FileUpload.category == category)

            files = query.order_by(FileUpload.created_at.desc()).all()

            return {"success": True, "files": [file.to_dict() for file in files]}

    except Exception as e:
        logger.error(f"Get user files error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving files")


@router.delete("/files/{file_id}")
async def delete_file(file_id: str, claims: dict = Depends(authorize_headers)):
    """Delete user's file"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            file_record = (
                db.query(FileUpload)
                .filter(
                    FileUpload.id == file_id,
                    FileUpload.user_id == user_id,
                    FileUpload.is_active == True,
                )
                .first()
            )

            if not file_record:
                raise HTTPException(status_code=404, detail="File not found")

            # Mark as deleted
            file_record.is_active = False
            file_record.deleted_at = datetime.utcnow()
            file_record.updated_at = datetime.utcnow()

            # Delete physical file
            file_upload_service.delete_file(file_record.file_path)

            db.commit()

            return {"success": True, "message": "File deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete file error: {e}")
        raise HTTPException(status_code=500, detail="Error deleting file")
