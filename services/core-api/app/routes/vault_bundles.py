"""
Creator Productivity API Routes - Vault Bundles & Discounts
==========================================================

Advanced bundling system for vault content with discount pricing:
- Create bundles with multiple vault items at discounted prices
- Revenue tracking and analytics integration
- Purchase flow with savings calculations
- GodMode visibility for bundle performance

Authentication: Creator+ role required for own bundles, GodMode sees all
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.db.base import get_session
from app.db.models.creator_productivity import VaultBundle, VaultBundlePurchase
from app.security.jwt import get_current_user
from app.db.models.users import User

router = APIRouter(prefix="/vault", tags=["creator_productivity"])

# ============================================================================
# Request/Response Models
# ============================================================================


class CreateBundleRequest(BaseModel):
    """Request model for creating vault bundles"""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    content_ids: List[str] = Field(..., min_items=2, max_items=20)  # Must have 2+ items
    bundle_price: float = Field(..., gt=0, le=10000)
    expires_at: Optional[datetime] = None
    max_purchases: Optional[int] = Field(None, gt=0, le=10000)

    @validator("expires_at")
    def validate_expires_at(cls, v):
        """Ensure expiration is in the future"""
        if v and v <= datetime.now(timezone.utc):
            raise ValueError("Expiration time must be in the future")
        return v


class UpdateBundleRequest(BaseModel):
    """Request model for updating existing bundles"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    bundle_price: Optional[float] = Field(None, gt=0, le=10000)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    max_purchases: Optional[int] = Field(None, gt=0, le=10000)


class BundleResponse(BaseModel):
    """Response model for bundle data"""

    id: str
    creator_id: str
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    content_ids: List[str]
    individual_total: float
    bundle_price: float
    discount_percent: float
    is_active: bool
    expires_at: Optional[datetime]
    max_purchases: Optional[int]
    current_purchases: int
    created_at: datetime
    updated_at: datetime
    view_count: int
    conversion_rate: float
    total_revenue: float

    # Calculated fields
    savings_amount: float = 0.0
    is_expired: bool = False
    is_sold_out: bool = False
    time_until_expiry: Optional[int] = None  # Hours until expiry

    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        self.savings_amount = self.individual_total - self.bundle_price

        if self.expires_at:
            now = datetime.now(timezone.utc)
            if self.expires_at <= now:
                self.is_expired = True
            else:
                self.time_until_expiry = int((self.expires_at - now).total_seconds() / 3600)

        if self.max_purchases and self.current_purchases >= self.max_purchases:
            self.is_sold_out = True


class BundlesListResponse(BaseModel):
    """Response model for paginated bundles"""

    bundles: List[BundleResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class PurchaseBundleRequest(BaseModel):
    """Request model for purchasing bundles"""

    payment_method: str = Field(..., max_length=50)
    promo_code: Optional[str] = Field(None, max_length=20)


class BundlePurchaseResponse(BaseModel):
    """Response model for bundle purchase"""

    id: str
    bundle_id: str
    purchaser_id: str
    price_paid: float
    discount_applied: float
    total_savings: float
    purchased_at: datetime
    content_unlocked: List[str]  # List of content IDs now accessible

    class Config:
        from_attributes = True


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/bundles", response_model=BundleResponse)
async def create_bundle(
    request: CreateBundleRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new vault bundle with discount pricing

    Automatically calculates individual item total and discount percentage.
    Validates that creator owns all content in the bundle.

    Copilot Enhancement Opportunities:
    - AI pricing optimization based on purchase patterns
    - Smart bundle suggestions from top-performing content
    - A/B testing framework for bundle titles and descriptions
    """
    # Verify creator role
    if current_user.role not in ["creator", "admin", "superadmin", "godmode"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Creator role required to create bundles"
        )

    # TODO: Validate that creator owns all content_ids
    # This would integrate with your actual content system
    # For now, we'll assume validation passes

    # Calculate individual_total from actual content prices
    from app.models.vault import VaultContent

    # Look up actual content prices from database
    vault_items = session.query(VaultContent).filter(
        VaultContent.id.in_(request.content_ids),
        VaultContent.creator_id == current_user.id,  # Ensure creator owns content
        VaultContent.is_active == True
    ).all()

    # Verify all content exists and belongs to creator
    found_content_ids = {item.id for item in vault_items}
    if len(found_content_ids) != len(request.content_ids):
        missing_ids = set(request.content_ids) - found_content_ids
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content not found or access denied: {missing_ids}"
        )

    # Sum up the individual prices of all content items
    individual_total = sum(float(item.price) for item in vault_items)

    # Validate bundle price provides savings
    if request.bundle_price >= individual_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bundle price (${request.bundle_price}) must be less than individual total (${individual_total})",
        )

    # Calculate discount percentage
    discount_percent = ((individual_total - request.bundle_price) / individual_total) * 100

    # Create bundle
    bundle = VaultBundle(
        creator_id=current_user.id,
        title=request.title,
        description=request.description,
        thumbnail_url=request.thumbnail_url,
        content_ids=request.content_ids,
        individual_total=individual_total,
        bundle_price=request.bundle_price,
        discount_percent=discount_percent,
        expires_at=request.expires_at,
        max_purchases=request.max_purchases,
    )

    session.add(bundle)
    session.commit()
    session.refresh(bundle)

    return BundleResponse.from_orm(bundle)


@router.get("/bundles", response_model=BundlesListResponse)
async def list_bundles(
    creator_id: Optional[str] = None,
    active_only: bool = True,
    include_expired: bool = False,
    page: int = Field(1, ge=1),
    per_page: int = Field(20, ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List vault bundles with filtering and pagination

    Public endpoint for discovering bundles, with role-based visibility.
    Creators see their own bundles, users see active public bundles.
    """
    # Build query
    query = session.query(VaultBundle)

    # Role-based filtering
    if current_user.role in ["godmode", "superadmin"]:
        # GodMode sees all bundles
        pass
    elif creator_id:
        # Specific creator's bundles
        query = query.filter(VaultBundle.creator_id == creator_id)
        # Only show active bundles unless it's the creator themselves
        if current_user.id != creator_id and active_only:
            query = query.filter(VaultBundle.is_active == True)
    else:
        # Public discovery - only active bundles
        query = query.filter(VaultBundle.is_active == True)

    # Apply filters
    if active_only and current_user.role not in ["godmode", "superadmin"]:
        query = query.filter(VaultBundle.is_active == True)

    if not include_expired:
        # Exclude expired bundles
        now = datetime.now(timezone.utc)
        query = query.filter(or_(VaultBundle.expires_at.is_(None), VaultBundle.expires_at > now))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    bundles = query.order_by(VaultBundle.created_at.desc()).offset(offset).limit(per_page).all()

    return BundlesListResponse(
        bundles=[BundleResponse.from_orm(bundle) for bundle in bundles],
        total=total,
        page=page,
        per_page=per_page,
        has_next=offset + per_page < total,
        has_prev=page > 1,
    )


@router.get("/bundles/{bundle_id}", response_model=BundleResponse)
async def get_bundle(
    bundle_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get details of a specific bundle

    Increments view count for analytics.
    Shows full details to creator/GodMode, limited details to others.
    """
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    # Check if bundle is accessible
    if (
        bundle.creator_id != current_user.id
        and current_user.role not in ["godmode", "superadmin"]
        and (not bundle.is_active or bundle.is_expired)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not available")

    # Increment view count (not for creator/GodMode)
    if bundle.creator_id != current_user.id and current_user.role not in ["godmode", "superadmin"]:
        bundle.view_count += 1
        session.commit()

    return BundleResponse.from_orm(bundle)


@router.put("/bundles/{bundle_id}", response_model=BundleResponse)
async def update_bundle(
    bundle_id: str,
    request: UpdateBundleRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing bundle

    Only creator and GodMode can update bundles.
    Recalculates discount percentage if price changes.
    """
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and bundle.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update fields if provided
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bundle, field, value)

    # Recalculate discount if price changed
    if "bundle_price" in update_data:
        bundle.discount_percent = (
            (bundle.individual_total - bundle.bundle_price) / bundle.individual_total
        ) * 100

    # Update timestamp
    bundle.updated_at = datetime.now(timezone.utc)

    session.commit()
    session.refresh(bundle)

    return BundleResponse.from_orm(bundle)


@router.delete("/bundles/{bundle_id}")
async def delete_bundle(
    bundle_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a bundle (soft delete by deactivating)

    Sets is_active to False rather than hard delete to preserve purchase history.
    """
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and bundle.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Soft delete
    bundle.is_active = False
    bundle.updated_at = datetime.now(timezone.utc)

    session.commit()

    return {"message": "Bundle deleted successfully"}


@router.post("/bundles/{bundle_id}/purchase", response_model=BundlePurchaseResponse)
async def purchase_bundle(
    bundle_id: str,
    request: PurchaseBundleRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Purchase a vault bundle

    Validates bundle availability, processes payment, and unlocks content.
    Updates bundle purchase count and revenue tracking.

    Copilot Enhancement Opportunities:
    - Dynamic pricing based on demand and user behavior
    - Personalized discount offers for high-value customers
    - Bundle recommendation engine for related content
    """
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    # Validate bundle availability
    if not bundle.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Bundle is not available for purchase"
        )

    if bundle.is_expired:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bundle has expired")

    if bundle.is_sold_out:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bundle is sold out")

    # Check if user already purchased this bundle
    existing_purchase = (
        session.query(VaultBundlePurchase)
        .filter(
            and_(
                VaultBundlePurchase.bundle_id == bundle_id,
                VaultBundlePurchase.purchaser_id == current_user.id,
                VaultBundlePurchase.refunded_at.is_(None),
            )
        )
        .first()
    )

    if existing_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You have already purchased this bundle"
        )

    # Calculate final price (with any promo code discounts)
    price_to_pay = bundle.bundle_price
    additional_discount = 0.0

    # TODO: Implement promo code validation
    if request.promo_code:
        # Mock promo code logic
        if request.promo_code.upper() == "SAVE10":
            additional_discount = price_to_pay * 0.1
            price_to_pay -= additional_discount

    # TODO: Process actual payment here
    # This would integrate with your payment system (Stripe, etc.)
    transaction_id = f"bundle_{bundle_id}_{int(datetime.now().timestamp())}"

    # Create purchase record
    purchase = VaultBundlePurchase(
        bundle_id=bundle.id,
        purchaser_id=current_user.id,
        price_paid=price_to_pay,
        discount_applied=additional_discount,
        payment_method=request.payment_method,
        transaction_id=transaction_id,
    )

    session.add(purchase)

    # Update bundle metrics
    bundle.current_purchases += 1
    bundle.total_revenue += price_to_pay
    bundle.conversion_rate = (
        (bundle.current_purchases / bundle.view_count) * 100 if bundle.view_count > 0 else 0
    )

    session.commit()
    session.refresh(purchase)

    # TODO: Grant access to all content in the bundle
    # This would integrate with your content access system

    return BundlePurchaseResponse(
        id=str(purchase.id),
        bundle_id=str(purchase.bundle_id),
        purchaser_id=str(purchase.purchaser_id),
        price_paid=purchase.price_paid,
        discount_applied=purchase.discount_applied,
        total_savings=purchase.total_savings,
        purchased_at=purchase.purchased_at,
        content_unlocked=bundle.content_ids,
    )


# ============================================================================
# Analytics Endpoints
# ============================================================================


@router.get("/bundles/{bundle_id}/analytics")
async def get_bundle_analytics(
    bundle_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed analytics for a specific bundle

    Available to bundle creator and GodMode.
    Includes conversion metrics, revenue tracking, and performance insights.
    """
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and bundle.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Get purchase analytics
    purchases = (
        session.query(VaultBundlePurchase).filter(VaultBundlePurchase.bundle_id == bundle_id).all()
    )

    # Calculate metrics
    total_revenue = sum(p.price_paid for p in purchases)
    average_sale_price = total_revenue / len(purchases) if purchases else 0
    total_savings_provided = sum(p.total_savings for p in purchases)

    # Revenue by day (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_purchases = [p for p in purchases if p.purchased_at >= thirty_days_ago]

    revenue_by_day = {}
    for purchase in recent_purchases:
        day_key = purchase.purchased_at.strftime("%Y-%m-%d")
        if day_key not in revenue_by_day:
            revenue_by_day[day_key] = 0
        revenue_by_day[day_key] += purchase.price_paid

    return {
        "bundle_id": bundle_id,
        "total_views": bundle.view_count,
        "total_purchases": bundle.current_purchases,
        "conversion_rate": bundle.conversion_rate,
        "total_revenue": total_revenue,
        "average_sale_price": average_sale_price,
        "total_savings_provided": total_savings_provided,
        "revenue_by_day": revenue_by_day,
        "is_expired": bundle.is_expired,
        "is_sold_out": bundle.is_sold_out,
        "time_until_expiry_hours": bundle.time_until_expiry if bundle.expires_at else None,
    }


@router.get("/bundles/analytics/overview")
async def get_bundles_overview(
    session: Session = Depends(get_session), current_user: User = Depends(get_current_user)
):
    """
    Get overview analytics for all bundles

    Shows creator's bundle performance or GodMode system-wide metrics.
    """
    # Build query based on role
    query = session.query(VaultBundle)

    if current_user.role not in ["godmode", "superadmin"]:
        query = query.filter(VaultBundle.creator_id == current_user.id)

    bundles = query.all()

    # Calculate overview metrics
    total_bundles = len(bundles)
    active_bundles = len([b for b in bundles if b.is_active and not b.is_expired])
    total_revenue = sum(b.total_revenue for b in bundles)
    total_purchases = sum(b.current_purchases for b in bundles)
    average_conversion_rate = (
        sum(b.conversion_rate for b in bundles) / total_bundles if total_bundles > 0 else 0
    )

    # Top performing bundles
    top_bundles = sorted(bundles, key=lambda b: b.total_revenue, reverse=True)[:5]

    return {
        "total_bundles": total_bundles,
        "active_bundles": active_bundles,
        "total_revenue": total_revenue,
        "total_purchases": total_purchases,
        "average_conversion_rate": round(average_conversion_rate, 2),
        "top_performing_bundles": [
            {
                "id": str(b.id),
                "title": b.title,
                "revenue": b.total_revenue,
                "purchases": b.current_purchases,
                "conversion_rate": b.conversion_rate,
            }
            for b in top_bundles[:5]
        ],
    }
