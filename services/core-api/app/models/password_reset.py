# models/password_reset.py
from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
import uuid

Base = declarative_base()


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, index=True)
    token = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    @classmethod
    def create_reset_token(cls, email: str) -> str:
        """Create a new password reset token"""
        token = str(uuid.uuid4()) + str(uuid.uuid4()).replace("-", "")
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry

        return cls(email=email, token=token, expires_at=expires_at), token

    def is_valid(self) -> bool:
        """Check if token is still valid"""
        return not self.used and datetime.utcnow() < self.expires_at

    def mark_used(self):
        """Mark token as used"""
        self.used = True
