import os
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta
from typing import List, Optional

from app.db.base import get_session
from app.db.models import Purchase, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

PLATFORM_CUT = float(os.getenv("PLATFORM_CUT", "0.12"))


class UpgradeBody(BaseModel):
    target: str  # "tier" or "palette"
    id: str
    price_cents: int


class RevenueStats(BaseModel):
    total_revenue_cents: int
    platform_cut_cents: int
    creator_cut_cents: int
    transaction_count: int
    period: str


class ContentSale(BaseModel):
    id: str
    sale_type: str  # "vault_unlock", "subscription", "inbox_content"
    content_id: str | None  # None for subscriptions
    content_type: str | None  # "photo", "video", "live_stream", None for subscriptions
    buyer_id: str
    buyer_username: str | None
    creator_id: str
    creator_username: str
    creator_studio: str  # "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    sale_price_cents: int
    platform_cut_cents: int  # Always 12%
    creator_cut_cents: int  # Always 88%
    sale_date: str
    status: str  # "completed", "pending", "refunded", "failed"
    is_nsfw: bool
    consent_verified: bool  # Required for NSFW content
    recurring: bool  # True for monthly subscriptions
    subscription_period: str | None  # "monthly" for recurring subscriptions


class PayoutRecord(BaseModel):
    id: str
    creator_id: str
    creator_username: str
    amount_cents: int
    period_start: str
    period_end: str
    status: str  # "pending", "processing", "completed", "failed"
    created_at: str
    processed_at: str | None
    payment_method: str | None
    transaction_reference: str | None


class PayoutAction(BaseModel):
    payout_id: str
    action: str  # "approve", "reject", "mark_completed"
    notes: str | None = None


class CreatorStats(BaseModel):
    creator_id: str
    creator_username: str
    creator_studio: str  # "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    total_earnings_cents: int
    total_sales: int
    average_sale_cents: int
    pending_payout_cents: int
    last_sale_date: str | None
    # Revenue breakdown by type
    vault_earnings_cents: int
    subscription_earnings_cents: int
    inbox_earnings_cents: int
    # Subscription metrics
    active_subscribers: int
    monthly_recurring_revenue_cents: int
    # Content metrics
    nsfw_content_percentage: float
    consent_verified: bool
    payout_threshold_met: bool  # >= $50 USD (5000 cents)


# Black Rose Collective User Management Models
class BlackRoseUser(BaseModel):
    id: str
    username: str
    display_name: str | None
    creator_studio: str | None  # "scarlet", "lightbox", "ink_steel", "expression", "cipher_core"
    role: str  # "creator", "user"
    is_verified: bool
    consent_verified: bool
    total_earnings_cents: int
    active_subscriptions: int
    content_count: int
    nsfw_content_percentage: float
    last_active: str | None
    created_at: str
    profile_private: bool
    vault_locked: bool


class UserSearchResult(BaseModel):
    users: List[BlackRoseUser]
    total_count: int
    page: int
    has_more: bool


class AuditLogEntry(BaseModel):
    id: str
    admin_user_id: str
    admin_username: str
    target_user_id: str
    target_username: str
    action: str  # "profile_view", "content_access", "vault_bypass"
    timestamp: str
    reason: str | None
    ip_address: str | None


@router.post("/upgrade")
def upgrade(
    body: UpgradeBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    platform = int(body.price_cents * PLATFORM_CUT)
    creator = body.price_cents - platform
    purchase = Purchase(
        user_id=user.id,
        item_type=body.target,
        item_id=body.id,
        gross_cents=body.price_cents,
        platform_cut_cents=platform,
        creator_cut_cents=creator,
    )
    session.add(purchase)
    session.flush()
    return {"platform_cut": platform, "creator_cut": creator}


@router.get("/revenue/stats")
def get_revenue_stats(
    period: str = Query("all_time", regex="^(daily|monthly|all_time)$"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get revenue statistics for GodMode dashboard"""
    if user.role != "godmode":
        return {"error": "Access denied"}

    query = session.query(
        func.sum(Purchase.gross_cents).label("total_revenue"),
        func.sum(Purchase.platform_cut_cents).label("platform_cut"),
        func.sum(Purchase.creator_cut_cents).label("creator_cut"),
        func.count(Purchase.id).label("transaction_count"),
    )

    now = datetime.utcnow()
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Purchase.created_at >= start_date)
    elif period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Purchase.created_at >= start_date)

    result = query.first()

    return RevenueStats(
        total_revenue_cents=result.total_revenue or 0,
        platform_cut_cents=result.platform_cut or 0,
        creator_cut_cents=result.creator_cut or 0,
        transaction_count=result.transaction_count or 0,
        period=period,
    )


@router.get("/revenue/transactions")
def get_recent_transactions(
    limit: int = Query(10, le=100),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get recent transactions for GodMode dashboard"""
    if user.role != "godmode":
        return {"error": "Access denied"}

    transactions = session.query(Purchase).order_by(Purchase.created_at.desc()).limit(limit).all()

    return [
        {
            "id": str(t.id),
            "item_type": t.item_type,
            "item_id": t.item_id,
            "gross_cents": t.gross_cents,
            "platform_cut_cents": t.platform_cut_cents,
            "creator_cut_cents": t.creator_cut_cents,
            "created_at": t.created_at.isoformat(),
            "user_id": str(t.user_id),
        }
        for t in transactions
    ]


# Content Sales Endpoints
@router.get("/sales", response_model=List[ContentSale])
def get_content_sales(
    limit: int = Query(25, le=100),
    content_type: Optional[str] = Query(None, regex="^(photo|video|live_stream)$"),
    sale_type: Optional[str] = Query(None, regex="^(vault_unlock|subscription|inbox_content)$"),
    studio: Optional[str] = Query(
        None, regex="^(scarlet|lightbox|ink_steel|expression|cipher_core)$"
    ),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get content sales for GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual database queries
    # In production, this would join Purchase with User table and content metadata
    mock_sales = [
        # Vault Unlock - Scarlet Studio
        ContentSale(
            id="sale_001",
            sale_type="vault_unlock",
            content_id="vault_scarlet_001",
            content_type="photo",
            buyer_id="user_123",
            buyer_username="premium_subscriber_42",
            creator_id="creator_velora",
            creator_username="Velora",
            creator_studio="scarlet",
            sale_price_cents=2999,  # $29.99
            platform_cut_cents=360,  # 12%
            creator_cut_cents=2639,  # 88%
            sale_date=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            status="completed",
            is_nsfw=True,
            consent_verified=True,
            recurring=False,
            subscription_period=None,
        ),
        # Monthly Subscription - Lightbox Studio
        ContentSale(
            id="sale_002",
            sale_type="subscription",
            content_id=None,  # No specific content for subscription
            content_type=None,
            buyer_id="user_456",
            buyer_username="gold_member_88",
            creator_id="creator_lyra",
            creator_username="Lyra",
            creator_studio="lightbox",
            sale_price_cents=1999,  # $19.99/month
            platform_cut_cents=240,  # 12%
            creator_cut_cents=1759,  # 88%
            sale_date=(datetime.utcnow() - timedelta(hours=5)).isoformat(),
            status="completed",
            is_nsfw=False,
            consent_verified=True,
            recurring=True,
            subscription_period="monthly",
        ),
        # Inbox Content Purchase - Ink & Steel Studio
        ContentSale(
            id="sale_003",
            sale_type="inbox_content",
            content_id="inbox_video_003",
            content_type="video",
            buyer_id="user_789",
            buyer_username="ink_enthusiast_22",
            creator_id="creator_riven",
            creator_username="Riven",
            creator_studio="ink_steel",
            sale_price_cents=4999,  # $49.99
            platform_cut_cents=600,  # 12%
            creator_cut_cents=4399,  # 88%
            sale_date=(datetime.utcnow() - timedelta(hours=8)).isoformat(),
            status="completed",
            is_nsfw=True,
            consent_verified=True,
            recurring=False,
            subscription_period=None,
        ),
        # Vault Unlock - Expression Studio
        ContentSale(
            id="sale_004",
            sale_type="vault_unlock",
            content_id="vault_cosplay_004",
            content_type="video",
            buyer_id="user_101",
            buyer_username="cosplay_fan_77",
            creator_id="creator_nova",
            creator_username="Nova",
            creator_studio="expression",
            sale_price_cents=3499,  # $34.99
            platform_cut_cents=420,  # 12%
            creator_cut_cents=3079,  # 88%
            sale_date=(datetime.utcnow() - timedelta(hours=12)).isoformat(),
            status="completed",
            is_nsfw=False,
            consent_verified=True,
            recurring=False,
            subscription_period=None,
        ),
        # Monthly Subscription - Cipher Core Studio
        ContentSale(
            id="sale_005",
            sale_type="subscription",
            content_id=None,
            content_type=None,
            buyer_id="user_202",
            buyer_username="dev_supporter_99",
            creator_id="creator_echo",
            creator_username="Echo",
            creator_studio="cipher_core",
            sale_price_cents=2499,  # $24.99/month
            platform_cut_cents=300,  # 12%
            creator_cut_cents=2199,  # 88%
            sale_date=(datetime.utcnow() - timedelta(hours=18)).isoformat(),
            status="completed",
            is_nsfw=False,
            consent_verified=True,
            recurring=True,
            subscription_period="monthly",
        ),
    ]

    # Apply filters
    if content_type:
        mock_sales = [sale for sale in mock_sales if sale.content_type == content_type]

    if sale_type:
        mock_sales = [sale for sale in mock_sales if sale.sale_type == sale_type]

    if studio:
        mock_sales = [sale for sale in mock_sales if sale.creator_studio == studio]

    return mock_sales[:limit]


# Creator Payout Endpoints
@router.get("/payouts", response_model=List[PayoutRecord])
def get_creator_payouts(
    status_filter: Optional[str] = Query(None, regex="^(pending|processing|completed|failed)$"),
    limit: int = Query(25, le=100),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get creator payouts for GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual payout records table
    mock_payouts = [
        PayoutRecord(
            id="payout_001",
            creator_id="creator_velora",
            creator_username="Velora",
            amount_cents=125000,  # $1,250.00
            period_start=(datetime.utcnow() - timedelta(days=30)).isoformat(),
            period_end=(datetime.utcnow() - timedelta(days=1)).isoformat(),
            status="pending",
            created_at=(datetime.utcnow() - timedelta(hours=24)).isoformat(),
            processed_at=None,
            payment_method="bank_transfer",
            transaction_reference=None,
        ),
        PayoutRecord(
            id="payout_002",
            creator_id="creator_lyra",
            creator_username="Lyra",
            amount_cents=89500,  # $895.00
            period_start=(datetime.utcnow() - timedelta(days=30)).isoformat(),
            period_end=(datetime.utcnow() - timedelta(days=1)).isoformat(),
            status="processing",
            created_at=(datetime.utcnow() - timedelta(hours=48)).isoformat(),
            processed_at=(datetime.utcnow() - timedelta(hours=12)).isoformat(),
            payment_method="paypal",
            transaction_reference="PP-TXN-123456",
        ),
        PayoutRecord(
            id="payout_003",
            creator_id="creator_riven",
            creator_username="Riven",
            amount_cents=67200,  # $672.00
            period_start=(datetime.utcnow() - timedelta(days=60)).isoformat(),
            period_end=(datetime.utcnow() - timedelta(days=31)).isoformat(),
            status="completed",
            created_at=(datetime.utcnow() - timedelta(days=7)).isoformat(),
            processed_at=(datetime.utcnow() - timedelta(days=3)).isoformat(),
            payment_method="crypto_wallet",
            transaction_reference="0xabcd1234...",
        ),
        PayoutRecord(
            id="payout_004",
            creator_id="creator_nova",
            creator_username="Nova",
            amount_cents=145600,  # $1,456.00
            period_start=(datetime.utcnow() - timedelta(days=30)).isoformat(),
            period_end=(datetime.utcnow() - timedelta(days=1)).isoformat(),
            status="failed",
            created_at=(datetime.utcnow() - timedelta(hours=72)).isoformat(),
            processed_at=(datetime.utcnow() - timedelta(hours=24)).isoformat(),
            payment_method="bank_transfer",
            transaction_reference=None,
        ),
    ]

    # Filter by status if specified
    if status_filter:
        mock_payouts = [payout for payout in mock_payouts if payout.status == status_filter]

    return mock_payouts[:limit]


@router.post("/payouts/action")
def process_payout_action(
    action_request: PayoutAction,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Process payout action from GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    valid_actions = ["approve", "reject", "mark_completed"]
    if action_request.action not in valid_actions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")

    # Mock implementation - replace with actual payout status updates
    return {
        "success": True,
        "payout_id": action_request.payout_id,
        "action": action_request.action,
        "processed_by": user.username,
        "processed_at": datetime.utcnow().isoformat(),
        "notes": action_request.notes,
    }


# Creator Statistics Endpoint
@router.get("/creators/stats", response_model=List[CreatorStats])
def get_creator_stats(
    limit: int = Query(10, le=50),
    sort_by: str = Query("earnings", regex="^(earnings|sales|average)$"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get creator statistics for GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual aggregation queries from Purchase and User tables
    mock_creator_stats = [
        CreatorStats(
            creator_id="creator_velora",
            creator_username="Velora",
            creator_studio="scarlet",
            total_earnings_cents=245600,  # $2,456.00
            total_sales=42,
            average_sale_cents=5848,  # $58.48
            pending_payout_cents=125000,  # $1,250.00 (over $50 threshold)
            last_sale_date=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            vault_earnings_cents=180000,  # $1,800.00 from vault unlocks
            subscription_earnings_cents=45600,  # $456.00 from monthly subs
            inbox_earnings_cents=20000,  # $200.00 from inbox sales
            active_subscribers=23,
            monthly_recurring_revenue_cents=45600,  # $456.00/month
            nsfw_content_percentage=85.0,
            consent_verified=True,
            payout_threshold_met=True,
        ),
        CreatorStats(
            creator_id="creator_nova",
            creator_username="Nova",
            creator_studio="expression",
            total_earnings_cents=198300,  # $1,983.00
            total_sales=28,
            average_sale_cents=7082,  # $70.82
            pending_payout_cents=145600,  # $1,456.00 (over $50 threshold)
            last_sale_date=(datetime.utcnow() - timedelta(hours=18)).isoformat(),
            vault_earnings_cents=145000,  # $1,450.00 from vault unlocks
            subscription_earnings_cents=35300,  # $353.00 from monthly subs
            inbox_earnings_cents=18000,  # $180.00 from inbox sales
            active_subscribers=18,
            monthly_recurring_revenue_cents=35300,  # $353.00/month
            nsfw_content_percentage=20.0,  # Mostly cosplay/fashion
            consent_verified=True,
            payout_threshold_met=True,
        ),
        CreatorStats(
            creator_id="creator_lyra",
            creator_username="Lyra",
            creator_studio="lightbox",
            total_earnings_cents=156800,  # $1,568.00
            total_sales=35,
            average_sale_cents=4480,  # $44.80
            pending_payout_cents=89500,  # $895.00 (over $50 threshold)
            last_sale_date=(datetime.utcnow() - timedelta(hours=5)).isoformat(),
            vault_earnings_cents=95000,  # $950.00 from vault unlocks
            subscription_earnings_cents=55800,  # $558.00 from monthly subs
            inbox_earnings_cents=6000,  # $60.00 from inbox sales
            active_subscribers=28,
            monthly_recurring_revenue_cents=55800,  # $558.00/month
            nsfw_content_percentage=35.0,
            consent_verified=True,
            payout_threshold_met=True,
        ),
        CreatorStats(
            creator_id="creator_riven",
            creator_username="Riven",
            creator_studio="ink_steel",
            total_earnings_cents=123400,  # $1,234.00
            total_sales=18,
            average_sale_cents=6856,  # $68.56
            pending_payout_cents=67200,  # $672.00 (over $50 threshold)
            last_sale_date=(datetime.utcnow() - timedelta(hours=12)).isoformat(),
            vault_earnings_cents=89000,  # $890.00 from vault unlocks
            subscription_earnings_cents=24400,  # $244.00 from monthly subs
            inbox_earnings_cents=10000,  # $100.00 from inbox sales
            active_subscribers=12,
            monthly_recurring_revenue_cents=24400,  # $244.00/month
            nsfw_content_percentage=70.0,
            consent_verified=True,
            payout_threshold_met=True,
        ),
        CreatorStats(
            creator_id="creator_echo",
            creator_username="Echo",
            creator_studio="cipher_core",
            total_earnings_cents=45300,  # $453.00
            total_sales=8,
            average_sale_cents=5663,  # $56.63
            pending_payout_cents=3200,  # $32.00 (under $50 threshold)
            last_sale_date=(datetime.utcnow() - timedelta(days=3)).isoformat(),
            vault_earnings_cents=15000,  # $150.00 from vault unlocks (dev tutorials)
            subscription_earnings_cents=25300,  # $253.00 from monthly subs
            inbox_earnings_cents=5000,  # $50.00 from inbox sales
            active_subscribers=15,
            monthly_recurring_revenue_cents=25300,  # $253.00/month
            nsfw_content_percentage=0.0,  # Tech content only
            consent_verified=True,
            payout_threshold_met=False,  # Under $50 minimum
        ),
    ]

    # Sort based on requested criteria
    if sort_by == "earnings":
        mock_creator_stats.sort(key=lambda x: x.total_earnings_cents, reverse=True)
    elif sort_by == "sales":
        mock_creator_stats.sort(key=lambda x: x.total_sales, reverse=True)
    elif sort_by == "average":
        mock_creator_stats.sort(key=lambda x: x.average_sale_cents, reverse=True)

    return mock_creator_stats[:limit]


# Black Rose Collective User Management Endpoints
@router.get("/blackrose/users/search", response_model=UserSearchResult)
def search_blackrose_users(
    query: str = Query("", description="Username or display name search"),
    studio: Optional[str] = Query(
        None, regex="^(scarlet|lightbox|ink_steel|expression|cipher_core)$"
    ),
    role: Optional[str] = Query(None, regex="^(creator|user)$"),
    verified_only: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Search Black Rose Collective users for GodMode auditing"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual database queries
    mock_users = [
        BlackRoseUser(
            id="br_user_001",
            username="velora_scarlet",
            display_name="Velora",
            creator_studio="scarlet",
            role="creator",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=245600,  # $2,456.00
            active_subscriptions=23,
            content_count=156,
            nsfw_content_percentage=85.0,
            last_active=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=45)).isoformat(),
            profile_private=True,
            vault_locked=True,
        ),
        BlackRoseUser(
            id="br_user_002",
            username="nova_expression",
            display_name="Nova Cosplay",
            creator_studio="expression",
            role="creator",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=198300,  # $1,983.00
            active_subscriptions=18,
            content_count=89,
            nsfw_content_percentage=20.0,
            last_active=(datetime.utcnow() - timedelta(hours=18)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=32)).isoformat(),
            profile_private=False,
            vault_locked=True,
        ),
        BlackRoseUser(
            id="br_user_003",
            username="lyra_lightbox",
            display_name="Lyra Photography",
            creator_studio="lightbox",
            role="creator",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=156800,  # $1,568.00
            active_subscriptions=28,
            content_count=234,
            nsfw_content_percentage=35.0,
            last_active=(datetime.utcnow() - timedelta(hours=5)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=67)).isoformat(),
            profile_private=False,
            vault_locked=False,
        ),
        BlackRoseUser(
            id="br_user_004",
            username="riven_ink",
            display_name="Riven Steel",
            creator_studio="ink_steel",
            role="creator",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=123400,  # $1,234.00
            active_subscriptions=12,
            content_count=67,
            nsfw_content_percentage=70.0,
            last_active=(datetime.utcnow() - timedelta(hours=12)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=89)).isoformat(),
            profile_private=True,
            vault_locked=True,
        ),
        BlackRoseUser(
            id="br_user_005",
            username="echo_cipher",
            display_name="Echo Dev",
            creator_studio="cipher_core",
            role="creator",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=45300,  # $453.00
            active_subscriptions=15,
            content_count=23,
            nsfw_content_percentage=0.0,
            last_active=(datetime.utcnow() - timedelta(days=3)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=12)).isoformat(),
            profile_private=False,
            vault_locked=False,
        ),
        # Regular users
        BlackRoseUser(
            id="br_user_006",
            username="premium_subscriber_42",
            display_name="Alex Premium",
            creator_studio=None,
            role="user",
            is_verified=True,
            consent_verified=True,
            total_earnings_cents=0,
            active_subscriptions=0,
            content_count=0,
            nsfw_content_percentage=0.0,
            last_active=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=23)).isoformat(),
            profile_private=True,
            vault_locked=False,
        ),
        BlackRoseUser(
            id="br_user_007",
            username="gold_member_88",
            display_name="Jordan Gold",
            creator_studio=None,
            role="user",
            is_verified=False,
            consent_verified=False,
            total_earnings_cents=0,
            active_subscriptions=0,
            content_count=0,
            nsfw_content_percentage=0.0,
            last_active=(datetime.utcnow() - timedelta(hours=6)).isoformat(),
            created_at=(datetime.utcnow() - timedelta(days=8)).isoformat(),
            profile_private=False,
            vault_locked=False,
        ),
    ]

    # Apply filters
    filtered_users = mock_users

    if query:
        query_lower = query.lower()
        filtered_users = [
            user
            for user in filtered_users
            if query_lower in user.username.lower()
            or (user.display_name and query_lower in user.display_name.lower())
        ]

    if studio:
        filtered_users = [user for user in filtered_users if user.creator_studio == studio]

    if role:
        filtered_users = [user for user in filtered_users if user.role == role]

    if verified_only:
        filtered_users = [user for user in filtered_users if user.is_verified]

    # Pagination
    total_count = len(filtered_users)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_users = filtered_users[start_idx:end_idx]

    return UserSearchResult(
        users=paginated_users,
        total_count=total_count,
        page=page,
        has_more=end_idx < total_count,
    )


@router.post("/blackrose/users/{user_id}/audit")
def log_user_audit(
    user_id: str,
    action: str,
    reason: Optional[str] = None,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Log audit trail for Black Rose Collective user access"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock audit log creation - replace with actual database logging
    audit_entry = AuditLogEntry(
        id=f"audit_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{user_id}",
        admin_user_id=user.id,
        admin_username=user.username,
        target_user_id=user_id,
        target_username=f"user_{user_id}",  # Would be fetched from DB
        action=action,
        timestamp=datetime.utcnow().isoformat(),
        reason=reason,
        ip_address="192.168.1.1",  # Would be extracted from request
    )

    # In production, save to database
    # session.add(AuditLog(**audit_entry.dict()))
    # session.commit()

    return {
        "success": True,
        "audit_id": audit_entry.id,
        "message": f"Audit logged for {action} on user {user_id}",
        "timestamp": audit_entry.timestamp,
    }


@router.get("/blackrose/users/{user_id}/profile")
def get_user_profile_bypass(
    user_id: str,
    log_audit: bool = Query(True, description="Whether to log this access"),
    reason: Optional[str] = Query(None, description="Reason for access"),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get Black Rose Collective user profile with full bypass for auditing"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Log the audit trail if requested
    if log_audit:
        try:
            log_user_audit(user_id, "profile_view", reason, user, session)
        except Exception as e:
            # Don't fail the request if audit logging fails, but log the error
            print(f"Audit logging failed: {e}")

    # Mock user profile data - replace with actual database queries
    # This would bypass all privacy settings, payment walls, etc.
    profile_data = {
        "user_id": user_id,
        "username": f"user_{user_id}",
        "profile_url": f"/blackrose/profile/{user_id}",
        "vault_url": f"/blackrose/vault/{user_id}",
        "bypass_active": True,
        "content_accessible": True,
        "privacy_overridden": True,
        "vault_unlocked": True,
        "audit_logged": log_audit,
        "accessed_by": user.username,
        "access_timestamp": datetime.utcnow().isoformat(),
    }

    return profile_data
