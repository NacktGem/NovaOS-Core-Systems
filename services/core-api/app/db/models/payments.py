"""
Payment and Creator Account Database Models
==========================================

Models for tracking Stripe payments, creator accounts, and transactions
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer
from sqlalchemy.types import Numeric  # Use Numeric instead of Decimal in SQLAlchemy 2.0
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base
import sqlalchemy as sa


class CreatorStripeAccount(Base):
    """Creator Stripe Connect accounts for payouts"""

    __tablename__ = "creator_stripe_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    stripe_account_id = Column(String(255), unique=True, nullable=False, index=True)

    # Account status from Stripe
    charges_enabled = Column(Boolean, default=False)
    payouts_enabled = Column(Boolean, default=False)
    details_submitted = Column(Boolean, default=False)

    # Onboarding status
    onboarding_complete = Column(Boolean, default=False)
    requirements_pending = Column(Text)  # JSON array of pending requirements

    # Metadata
    country = Column(String(2), default="US")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", back_populates="stripe_account")
    transactions = relationship("PaymentTransaction", back_populates="creator_account")


class PaymentTransaction(Base):
    """Track all payment transactions"""

    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))

    # Stripe reference
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=False, index=True)

    # Participants
    purchaser_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    creator_stripe_account_id = Column(UUID(as_uuid=True), ForeignKey("creator_stripe_accounts.id"), nullable=False)

    # Purchase details
    bundle_id = Column(UUID(as_uuid=True), ForeignKey("vault_bundles.id"), nullable=True)
    content_id = Column(String(255), nullable=True)  # Individual content purchases
    purchase_type = Column(String(50), nullable=False)  # 'vault_bundle', 'individual_content', 'subscription'

    # Financial details (all amounts customer paid)
    base_amount = Column(Numeric(10, 2), nullable=False)        # Original item price
    stripe_fees = Column(Numeric(10, 2), nullable=False)       # Stripe processing fees
    customer_total = Column(Numeric(10, 2), nullable=False)    # Total customer paid
    platform_fee = Column(Numeric(10, 2), nullable=False)     # NovaOS 12% cut
    creator_amount = Column(Numeric(10, 2), nullable=False)    # Creator earnings

    # Status tracking
    status = Column(String(50), default="pending")  # pending, completed, failed, refunded
    payment_method = Column(String(50))  # card, bank_transfer, etc.

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime(timezone=True), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    purchaser = relationship("User", foreign_keys=[purchaser_id], back_populates="purchases")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="sales")
    creator_account = relationship("CreatorStripeAccount", back_populates="transactions")
    bundle = relationship("VaultBundle", back_populates="purchase_transactions")


class PromoCode(Base):
    """Promotional codes for discounts"""

    __tablename__ = "promo_codes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))

    # Code details
    code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text)

    # Discount settings
    discount_type = Column(String(20), nullable=False)  # 'percentage', 'fixed_amount'
    discount_value = Column(Numeric(10, 2), nullable=False)  # Percentage (0-100) or fixed amount

    # Usage limits
    max_uses = Column(Integer)  # Null = unlimited
    current_uses = Column(Integer, default=0)
    max_uses_per_user = Column(Integer, default=1)

    # Validity
    is_active = Column(Boolean, default=True)
    valid_from = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    valid_until = Column(DateTime(timezone=True))

    # Restrictions
    min_purchase_amount = Column(Numeric(10, 2))  # Minimum purchase to use code
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Null = platform-wide

    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class PromoCodeUsage(Base):
    """Track promo code usage"""

    __tablename__ = "promo_code_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))

    promo_code_id = Column(UUID(as_uuid=True), ForeignKey("promo_codes.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("payment_transactions.id"), nullable=False)

    discount_applied = Column(Numeric(10, 2), nullable=False)
    used_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    promo_code = relationship("PromoCode")
    user = relationship("User")
    transaction = relationship("PaymentTransaction")


# Add relationships to existing User model
"""
Add these to the User model in users.py:

# Payment relationships
stripe_account = relationship("CreatorStripeAccount", back_populates="creator", uselist=False)
purchases = relationship("PaymentTransaction", foreign_keys="PaymentTransaction.purchaser_id", back_populates="purchaser")
sales = relationship("PaymentTransaction", foreign_keys="PaymentTransaction.creator_id", back_populates="creator")

# Add to VaultBundle model:
purchase_transactions = relationship("PaymentTransaction", back_populates="bundle")
"""
