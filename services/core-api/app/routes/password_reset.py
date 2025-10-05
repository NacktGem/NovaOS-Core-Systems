# routes/password_reset.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt
import logging
from datetime import datetime

from ..db.base import get_session
from ..db.models.users import User
from ..models.password_reset import PasswordReset
from ..services.email_service import email_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str


class ResetPasswordResponse(BaseModel):
    success: bool
    message: str


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Initiate password reset process"""
    try:
        # Use session generator
        for db in get_session():
            # Check if user exists
            user = db.query(User).filter(User.email == request.email).first()

            # Always return success for security (don't reveal if email exists)
            response = ForgotPasswordResponse(
                success=True,
                message="If an account with that email exists, we've sent password reset instructions.",
            )

            if user:
                # Create password reset token
                reset_record, token = PasswordReset.create_reset_token(request.email)

                # Save to database
                db.add(reset_record)
                db.commit()

                # Send email
                email_sent = await email_service.send_password_reset_email(
                    to_email=request.email, reset_token=token, user_name=user.username
                )

                if not email_sent:
                    logger.error(f"Failed to send password reset email to {request.email}")
                    # Still return success to user for security

            return response

    except Exception as e:
        logger.error(f"Error in forgot_password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    try:
        # Use session generator
        for db in get_session():
            # Find password reset record
            reset_record = (
                db.query(PasswordReset).filter(PasswordReset.token == request.token).first()
            )

            if not reset_record:
                raise HTTPException(status_code=400, detail="Invalid or expired reset token")

            if not reset_record.is_valid():
                raise HTTPException(status_code=400, detail="Reset token has expired or been used")

            # Find user
            user = db.query(User).filter(User.email == reset_record.email).first()
            if not user:
                raise HTTPException(status_code=400, detail="User not found")

            # Validate new password
            if len(request.new_password) < 8:
                raise HTTPException(
                    status_code=400, detail="Password must be at least 8 characters long"
                )

            # Hash new password
            hashed_password = bcrypt.hashpw(request.new_password.encode("utf-8"), bcrypt.gensalt())

            # Update user password
            user.password_hash = hashed_password.decode("utf-8")
            user.updated_at = datetime.utcnow()

            # Mark reset token as used
            reset_record.mark_used()

            # Commit changes
            db.commit()

            # Send confirmation email
            await email_service.send_password_changed_notification(
                to_email=user.email, user_name=user.username
            )

            logger.info(f"Password reset successful for user {user.email}")

            return ResetPasswordResponse(
                success=True,
                message="Password has been reset successfully. You can now log in with your new password.",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reset_password: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    try:
        for db in get_session():
            reset_record = db.query(PasswordReset).filter(PasswordReset.token == token).first()

            if not reset_record or not reset_record.is_valid():
                return {"valid": False, "message": "Invalid or expired token"}

            return {
                "valid": True,
                "email": reset_record.email,
                "expires_at": reset_record.expires_at.isoformat(),
            }

    except Exception as e:
        logger.error(f"Error verifying reset token: {e}")
        return {"valid": False, "message": "Error verifying token"}
