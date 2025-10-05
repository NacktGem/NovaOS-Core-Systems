# routes/profile.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import logging
from datetime import datetime

from ..db.base import get_session
from ..db.models.users import User
from ..models.file_upload import FileUpload
from agents.common.security import authorize_headers
from ..services.email_service import email_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    display_name: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileResponse(BaseModel):
    success: bool
    user: dict
    message: Optional[str] = None


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(claims: dict = Depends(authorize_headers)):
    """Get user profile"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Get user's profile image
            profile_image = (
                db.query(FileUpload)
                .filter(
                    FileUpload.user_id == user_id,
                    FileUpload.category == "profiles",
                    FileUpload.is_active == True,
                )
                .first()
            )

            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": getattr(user, "display_name", user.username),
                "bio": getattr(user, "bio", ""),
                "location": getattr(user, "location", ""),
                "website": getattr(user, "website", ""),
                "profile_image_url": profile_image.to_dict()["url"] if profile_image else None,
                "role": user.role,
                "tier": getattr(user, "tier", "free"),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            }

            return ProfileResponse(success=True, user=user_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving profile")


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(request: ProfileUpdateRequest, claims: dict = Depends(authorize_headers)):
    """Update user profile"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Check if email is already taken (if email is being updated)
            if request.email and request.email != user.email:
                existing_user = (
                    db.query(User).filter(User.email == request.email, User.id != user_id).first()
                )
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already in use")

            # Check if username is already taken (if username is being updated)
            if request.username and request.username != user.username:
                existing_user = (
                    db.query(User)
                    .filter(User.username == request.username, User.id != user_id)
                    .first()
                )
                if existing_user:
                    raise HTTPException(status_code=400, detail="Username already in use")

            # Update fields
            if request.username:
                user.username = request.username
            if request.email:
                user.email = request.email
            if request.bio is not None:
                if not hasattr(user, "bio"):
                    # Add bio column if it doesn't exist (for existing users)
                    from sqlalchemy import Column, Text

                    user.__table__.append_column(Column("bio", Text))
                user.bio = request.bio
            if request.display_name is not None:
                if not hasattr(user, "display_name"):
                    from sqlalchemy import Column, String

                    user.__table__.append_column(Column("display_name", String(100)))
                user.display_name = request.display_name
            if request.location is not None:
                if not hasattr(user, "location"):
                    from sqlalchemy import Column, String

                    user.__table__.append_column(Column("location", String(100)))
                user.location = request.location
            if request.website is not None:
                if not hasattr(user, "website"):
                    from sqlalchemy import Column, String

                    user.__table__.append_column(Column("website", String(255)))
                user.website = request.website

            user.updated_at = datetime.utcnow()
            db.commit()

            # Get updated profile
            profile_image = (
                db.query(FileUpload)
                .filter(
                    FileUpload.user_id == user_id,
                    FileUpload.category == "profiles",
                    FileUpload.is_active == True,
                )
                .first()
            )

            user_data = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": getattr(user, "display_name", user.username),
                "bio": getattr(user, "bio", ""),
                "location": getattr(user, "location", ""),
                "website": getattr(user, "website", ""),
                "profile_image_url": profile_image.to_dict()["url"] if profile_image else None,
                "role": user.role,
                "tier": getattr(user, "tier", "free"),
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            }

            return ProfileResponse(
                success=True, user=user_data, message="Profile updated successfully"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=500, detail="Error updating profile")


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest, claims: dict = Depends(authorize_headers)
):
    """Change user password"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Verify current password
            if not bcrypt.checkpw(
                request.current_password.encode("utf-8"), user.password_hash.encode("utf-8")
            ):
                raise HTTPException(status_code=400, detail="Current password is incorrect")

            # Validate new password
            if len(request.new_password) < 8:
                raise HTTPException(
                    status_code=400, detail="New password must be at least 8 characters long"
                )

            # Hash new password
            hashed_password = bcrypt.hashpw(request.new_password.encode("utf-8"), bcrypt.gensalt())

            # Update password
            user.password_hash = hashed_password.decode("utf-8")
            user.updated_at = datetime.utcnow()
            db.commit()

            # Send notification email
            await email_service.send_password_changed_notification(
                to_email=user.email, user_name=user.username
            )

            logger.info(f"Password changed for user {user.email}")

            return {"success": True, "message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=500, detail="Error changing password")


@router.delete("/profile/image")
async def delete_profile_image(claims: dict = Depends(authorize_headers)):
    """Delete user's profile image"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            # Find active profile image
            profile_image = (
                db.query(FileUpload)
                .filter(
                    FileUpload.user_id == user_id,
                    FileUpload.category == "profiles",
                    FileUpload.is_active == True,
                )
                .first()
            )

            if not profile_image:
                raise HTTPException(status_code=404, detail="No profile image found")

            # Mark as deleted
            profile_image.is_active = False
            profile_image.deleted_at = datetime.utcnow()
            profile_image.updated_at = datetime.utcnow()

            # Update user record
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.profile_image_url = None
                user.updated_at = datetime.utcnow()

            db.commit()

            return {"success": True, "message": "Profile image deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete profile image error: {e}")
        raise HTTPException(status_code=500, detail="Error deleting profile image")
