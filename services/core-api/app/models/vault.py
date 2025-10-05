# models/vault_content.py
from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, Numeric, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


class VaultContent(Base):
    __tablename__ = "vault_content"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, nullable=False, index=True)
    creator_name = Column(String, nullable=False)
    studio = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String, nullable=False)  # photo_set, video, audio, text
    price = Column(Numeric(10, 2), nullable=False)
    nsfw_level = Column(Integer, default=0)  # 0-5 scale
    thumbnail_url = Column(String, nullable=True)
    content_urls = Column(ARRAY(String), nullable=True)  # Array of content URLs
    item_count = Column(Integer, default=1)
    tags = Column(ARRAY(String), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "creatorId": self.creator_id,
            "creatorName": self.creator_name,
            "studio": self.studio,
            "title": self.title,
            "description": self.description,
            "contentType": self.content_type,
            "price": float(self.price) if self.price else 0,
            "nsfwLevel": self.nsfw_level,
            "thumbnail": self.thumbnail_url,
            "contentUrls": self.content_urls or [],
            "itemCount": self.item_count,
            "tags": self.tags or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "isActive": self.is_active,
        }


class VaultPurchase(Base):
    __tablename__ = "vault_purchases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    content_id = Column(String, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="completed")  # pending, completed, failed, refunded
    transaction_id = Column(String, nullable=True)
    purchased_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "itemId": self.content_id,
            "amount": float(self.amount) if self.amount else 0,
            "status": self.status,
            "timestamp": self.purchased_at.isoformat() if self.purchased_at else None,
            "transaction_id": self.transaction_id,
        }


class UserBalance(Base):
    __tablename__ = "user_balances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, unique=True, index=True)
    balance = Column(Numeric(10, 2), default=0.0)
    total_spent = Column(Numeric(10, 2), default=0.0)
    total_earned = Column(Numeric(10, 2), default=0.0)  # For creators
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "userId": self.user_id,
            "balance": float(self.balance) if self.balance else 0,
            "totalSpent": float(self.total_spent) if self.total_spent else 0,
            "totalEarned": float(self.total_earned) if self.total_earned else 0,
            "verified": self.verified,
        }
