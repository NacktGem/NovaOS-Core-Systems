"""
Creator Productivity Models - Posts, Drafts, Scheduled Content, Vault Bundles
==============================================================================

Database models for advanced creator productivity features to compete with OnlyFans/Fansly:
- Scheduled posts with background worker processing
- Draft management with media support
- Vault bundles with discount logic
- Revenue tracking and analytics

Fully integrated with NovaOS role-based access control and Master Palette theming.
"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enum import Enum
from app.db.base import Base


class PostType(str, Enum):
    """Post destination types for scheduling system"""

    HOME = "home"  # Public home feed
    EXPLORE = "explore"  # Discoverable in explore feed
    VAULT = "vault"  # Premium vault content
    STORY = "story"  # Temporary story content


class PostStatus(str, Enum):
    """Post lifecycle status tracking"""

    DRAFT = "draft"  # Saved draft, not scheduled
    SCHEDULED = "scheduled"  # Scheduled for future publishing
    PUBLISHED = "published"  # Live and visible to users
    CANCELLED = "cancelled"  # Cancelled before publishing
    FAILED = "failed"  # Failed to publish (retry needed)


class ScheduledPost(Base):
    """
    Scheduled posts for creators - supports Home, Explore, and Vault content

    Copilot Enhancement Notes:
    - Add AI content suggestions based on engagement patterns
    - Implement optimal timing recommendations using analytics
    - Support recurring post schedules (daily/weekly rituals)
    """

    __tablename__ = "scheduled_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Content fields
    caption = Column(Text)
    media_urls = Column(JSON, default=[])  # Array of media file URLs
    tags = Column(JSON, default=[])  # Array of tags/hashtags

    # Post configuration
    post_type = Column(sa.Enum(PostType), nullable=False, default=PostType.HOME)
    vault_price = Column(Float)  # Only for vault posts
    ritual_name = Column(String(100))  # For ritual countdowns

    # Scheduling
    scheduled_for = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(sa.Enum(PostStatus), nullable=False, default=PostStatus.SCHEDULED, index=True)
    published_at = Column(DateTime(timezone=True))

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    failure_reason = Column(Text)  # For failed publishing attempts
    retry_count = Column(Integer, default=0)

    # Analytics prep
    engagement_score = Column(Float)  # Calculated post-publishing
    revenue_generated = Column(Float, default=0.0)  # For vault posts

    # Relationships
    creator = relationship("User", back_populates="scheduled_posts")

    def __repr__(self):
        return f"<ScheduledPost {self.id}: {self.post_type} by {self.creator_id} at {self.scheduled_for}>"


class PostDraft(Base):
    """
    Draft posts for creators - full CRUD with media support

    Copilot Enhancement Notes:
    - Auto-save every 30 seconds during editing
    - AI writing assistance for captions
    - Duplicate detection to prevent accidental reposts
    """

    __tablename__ = "post_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Content fields (same structure as scheduled posts for easy conversion)
    caption = Column(Text)
    media_urls = Column(JSON, default=[])
    tags = Column(JSON, default=[])

    # Draft configuration
    post_type = Column(sa.Enum(PostType), nullable=False, default=PostType.HOME)
    vault_price = Column(Float)
    ritual_name = Column(String(100))

    # Draft metadata
    title = Column(String(200))  # Optional draft title for organization
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_edited = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", back_populates="post_drafts")

    def to_scheduled_post(self, scheduled_for: datetime) -> ScheduledPost:
        """Convert draft to scheduled post"""
        return ScheduledPost(
            creator_id=self.creator_id,
            caption=self.caption,
            media_urls=self.media_urls,
            tags=self.tags,
            post_type=self.post_type,
            vault_price=self.vault_price,
            ritual_name=self.ritual_name,
            scheduled_for=scheduled_for,
        )


class VaultBundle(Base):
    """
    Vault content bundles with discount pricing

    Copilot Enhancement Notes:
    - Smart bundle suggestions based on purchase patterns
    - Dynamic pricing optimization using conversion analytics
    - Time-limited bundle offers with scarcity marketing
    """

    __tablename__ = "vault_bundles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Bundle details
    title = Column(String(200), nullable=False)
    description = Column(Text)
    thumbnail_url = Column(String(500))

    # Pricing
    individual_total = Column(Float, nullable=False)  # Sum of individual item prices
    bundle_price = Column(Float, nullable=False)  # Discounted bundle price
    discount_percent = Column(Float, nullable=False)  # Calculated discount percentage

    # Bundle configuration
    content_ids = Column(JSON, nullable=False)  # Array of vault content IDs
    is_active = Column(Boolean, default=True, index=True)
    expires_at = Column(DateTime(timezone=True))  # Optional expiration
    max_purchases = Column(Integer)  # Optional purchase limit
    current_purchases = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Analytics
    view_count = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)

    # Relationships
    creator = relationship("User", back_populates="vault_bundles")
    purchases = relationship("VaultBundlePurchase", back_populates="bundle")

    @property
    def is_expired(self) -> bool:
        """Check if bundle has expired"""
        if not self.expires_at:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def is_sold_out(self) -> bool:
        """Check if bundle has reached purchase limit"""
        if not self.max_purchases:
            return False
        return self.current_purchases >= self.max_purchases

    @property
    def savings_amount(self) -> float:
        """Calculate savings amount in currency"""
        return self.individual_total - self.bundle_price


class VaultBundlePurchase(Base):
    """
    Track bundle purchases for revenue analytics and user access

    Copilot Enhancement Notes:
    - Implement purchase analytics for conversion optimization
    - Add referral tracking for creator affiliate programs
    - Support gift purchases and promotional codes
    """

    __tablename__ = "vault_bundle_purchases"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()"))
    bundle_id = Column(
        UUID(as_uuid=True), ForeignKey("vault_bundles.id"), nullable=False, index=True
    )
    purchaser_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Purchase details
    price_paid = Column(Float, nullable=False)  # Actual price paid (may include promo)
    discount_applied = Column(Float, default=0.0)  # Any additional discounts
    payment_method = Column(String(50))
    transaction_id = Column(String(100), index=True)

    # Metadata
    purchased_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    refunded_at = Column(DateTime(timezone=True))
    refund_reason = Column(Text)

    # Relationships
    bundle = relationship("VaultBundle", back_populates="purchases")
    purchaser = relationship("User", back_populates="vault_bundle_purchases")

    @property
    def total_savings(self) -> float:
        """Total savings including bundle discount and any additional discounts"""
        bundle_savings = self.bundle.savings_amount
        return bundle_savings + self.discount_applied


# Add relationships to User model (these would be added to existing User model)
"""
Add these to the User model in users.py:

# Creator productivity relationships
scheduled_posts = relationship("ScheduledPost", back_populates="creator")
post_drafts = relationship("PostDraft", back_populates="creator") 
vault_bundles = relationship("VaultBundle", back_populates="creator")
vault_bundle_purchases = relationship("VaultBundlePurchase", back_populates="purchaser")
"""
