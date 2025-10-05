"""
Creator Productivity API Routes - Scheduled Posts
================================================

Advanced scheduling system for creators competing with OnlyFans/Fansly:
- Schedule posts for Home, Explore, and Vault
- Background worker processing with retry logic
- GodMode visibility for all scheduled content
- Ritual countdown integration for premium posts

Authentication: Creator+ role required for own content, GodMode sees all
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.db.base import get_session
from app.db.models.creator_productivity import ScheduledPost, PostStatus, PostType
from app.security.jwt import get_current_user
from app.db.models.users import User

router = APIRouter(prefix="/posts", tags=["creator_productivity"])

# ============================================================================
# Request/Response Models
# ============================================================================


class SchedulePostRequest(BaseModel):
    """Request model for scheduling new posts"""

    caption: Optional[str] = Field(None, max_length=5000)
    media_urls: List[str] = Field(default_factory=list, max_items=10)
    tags: List[str] = Field(default_factory=list, max_items=20)
    post_type: PostType = PostType.HOME
    vault_price: Optional[float] = Field(None, gt=0, le=1000)
    ritual_name: Optional[str] = Field(None, max_length=100)
    scheduled_for: datetime

    @validator("scheduled_for")
    def validate_scheduled_for(cls, v):
        """Ensure scheduled time is in the future"""
        if v <= datetime.now(timezone.utc):
            raise ValueError("Scheduled time must be in the future")
        # Don't allow scheduling more than 1 year in advance
        if v > datetime.now(timezone.utc) + timedelta(days=365):
            raise ValueError("Cannot schedule more than 1 year in advance")
        return v

    @validator("vault_price")
    def validate_vault_price(cls, v, values):
        """Vault posts must have a price"""
        if values.get("post_type") == PostType.VAULT and not v:
            raise ValueError("Vault posts must have a price")
        if values.get("post_type") != PostType.VAULT and v:
            raise ValueError("Only vault posts can have a price")
        return v


class ScheduledPostResponse(BaseModel):
    """Response model for scheduled post data"""

    id: str
    creator_id: str
    caption: Optional[str]
    media_urls: List[str]
    tags: List[str]
    post_type: PostType
    vault_price: Optional[float]
    ritual_name: Optional[str]
    scheduled_for: datetime
    status: PostStatus
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    failure_reason: Optional[str]
    retry_count: int

    # Calculated fields
    time_until_publish: Optional[int] = None  # Minutes until publication
    is_overdue: bool = False

    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        if self.scheduled_for and self.status == PostStatus.SCHEDULED:
            now = datetime.now(timezone.utc)
            if self.scheduled_for > now:
                self.time_until_publish = int((self.scheduled_for - now).total_seconds() / 60)
            else:
                self.is_overdue = True


class ScheduledPostsListResponse(BaseModel):
    """Response model for paginated scheduled posts"""

    posts: List[ScheduledPostResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/schedule", response_model=ScheduledPostResponse)
async def schedule_post(
    request: SchedulePostRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Schedule a new post for future publication

    Supports Home, Explore, and Vault posts with ritual countdown integration.
    Background worker will publish at scheduled time.

    Copilot Enhancement Opportunities:
    - AI optimal timing suggestions based on audience engagement
    - Content quality scoring and improvement suggestions
    - Automated hashtag recommendations based on content analysis
    """
    # Verify creator role
    if current_user.role not in ["creator", "admin", "superadmin", "godmode"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Creator role required to schedule posts"
        )

    # Create scheduled post
    scheduled_post = ScheduledPost(
        creator_id=current_user.id,
        caption=request.caption,
        media_urls=request.media_urls,
        tags=request.tags,
        post_type=request.post_type,
        vault_price=request.vault_price,
        ritual_name=request.ritual_name,
        scheduled_for=request.scheduled_for,
        status=PostStatus.SCHEDULED,
    )

    session.add(scheduled_post)
    session.commit()
    session.refresh(scheduled_post)

    # Add background task to process at scheduled time
    background_tasks.add_task(_queue_post_for_publishing, str(scheduled_post.id))

    return ScheduledPostResponse.from_orm(scheduled_post)


@router.get("/schedule", response_model=ScheduledPostsListResponse)
async def list_scheduled_posts(
    status_filter: Optional[PostStatus] = None,
    post_type: Optional[PostType] = None,
    page: int = Field(1, ge=1),
    per_page: int = Field(20, ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List scheduled posts with filtering and pagination

    Creators see their own posts, GodMode sees all posts.
    Supports filtering by status and post type.
    """
    # Build query based on user role
    query = session.query(ScheduledPost)

    # Role-based filtering
    if current_user.role not in ["godmode", "superadmin"]:
        query = query.filter(ScheduledPost.creator_id == current_user.id)

    # Apply filters
    if status_filter:
        query = query.filter(ScheduledPost.status == status_filter)
    if post_type:
        query = query.filter(ScheduledPost.post_type == post_type)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    posts = query.order_by(ScheduledPost.scheduled_for.asc()).offset(offset).limit(per_page).all()

    return ScheduledPostsListResponse(
        posts=[ScheduledPostResponse.from_orm(post) for post in posts],
        total=total,
        page=page,
        per_page=per_page,
        has_next=offset + per_page < total,
        has_prev=page > 1,
    )


@router.get("/schedule/{post_id}", response_model=ScheduledPostResponse)
async def get_scheduled_post(
    post_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific scheduled post"""
    post = session.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found"
        )

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and post.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return ScheduledPostResponse.from_orm(post)


@router.delete("/schedule/{post_id}")
async def cancel_scheduled_post(
    post_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a scheduled post before it publishes

    Only allows cancelling posts in SCHEDULED status.
    Creators can cancel their own posts, GodMode can cancel any.
    """
    post = session.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found"
        )

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and post.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Can only cancel scheduled posts
    if post.status != PostStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel post with status: {post.status}",
        )

    # Update status to cancelled
    post.status = PostStatus.CANCELLED
    post.updated_at = datetime.now(timezone.utc)

    session.commit()

    return {"message": "Scheduled post cancelled successfully"}


@router.put("/schedule/{post_id}/reschedule")
async def reschedule_post(
    post_id: str,
    new_time: datetime,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Reschedule a post to a new time

    Only works for posts in SCHEDULED status.
    New time must be in the future.
    """
    # Validate new time
    if new_time <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New scheduled time must be in the future",
        )

    post = session.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Scheduled post not found"
        )

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and post.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Can only reschedule scheduled posts
    if post.status != PostStatus.SCHEDULED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reschedule post with status: {post.status}",
        )

    # Update scheduled time
    post.scheduled_for = new_time
    post.updated_at = datetime.now(timezone.utc)

    session.commit()

    return {"message": "Post rescheduled successfully", "new_time": new_time.isoformat()}


# ============================================================================
# Background Worker Functions
# ============================================================================


async def _queue_post_for_publishing(post_id: str):
    """
    Queue post for background worker processing

    This would integrate with your background job system (Celery, etc.)
    For now, this is a placeholder for the queueing logic.

    Copilot Enhancement Notes:
    - Implement retry logic with exponential backoff
    - Add notification system for failed publications
    - Support bulk publishing for creators with many scheduled posts
    """
    # TODO: Integrate with actual background job queue
    # Example: celery_app.send_task('publish_scheduled_post', args=[post_id], eta=scheduled_time)
    pass


@router.post("/schedule/{post_id}/publish", include_in_schema=False)
async def publish_scheduled_post_now(
    post_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Internal endpoint for background worker to publish posts

    This should only be called by the background worker system.
    In production, this would have internal authentication.
    """
    # This would be called by your background worker
    # Implementation would depend on your actual publishing system

    post = session.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()
    if not post:
        return {"error": "Post not found"}

    if post.status != PostStatus.SCHEDULED:
        return {"error": f"Post status is {post.status}, cannot publish"}

    try:
        # TODO: Implement actual publishing logic here
        # This would create the actual post in your content system

        post.status = PostStatus.PUBLISHED
        post.published_at = datetime.now(timezone.utc)
        post.updated_at = datetime.now(timezone.utc)

        session.commit()

        return {"message": "Post published successfully"}

    except Exception as e:
        # Handle publishing failure
        post.status = PostStatus.FAILED
        post.failure_reason = str(e)
        post.retry_count += 1
        post.updated_at = datetime.now(timezone.utc)

        session.commit()

        return {"error": f"Publishing failed: {str(e)}"}


# ============================================================================
# GodMode Analytics Endpoints
# ============================================================================


@router.get("/schedule/analytics/overview")
async def get_scheduling_analytics(
    session: Session = Depends(get_session), current_user: User = Depends(get_current_user)
):
    """
    GodMode analytics for scheduled post performance

    Provides insights into scheduling patterns, success rates, and optimization opportunities.
    """
    if current_user.role not in ["godmode", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="GodMode access required")

    # Get various metrics
    total_scheduled = (
        session.query(ScheduledPost).filter(ScheduledPost.status == PostStatus.SCHEDULED).count()
    )
    total_published = (
        session.query(ScheduledPost).filter(ScheduledPost.status == PostStatus.PUBLISHED).count()
    )
    total_failed = (
        session.query(ScheduledPost).filter(ScheduledPost.status == PostStatus.FAILED).count()
    )

    # Calculate success rate
    success_rate = (
        (total_published / (total_published + total_failed)) * 100
        if (total_published + total_failed) > 0
        else 100
    )

    return {
        "total_scheduled": total_scheduled,
        "total_published": total_published,
        "total_failed": total_failed,
        "success_rate": round(success_rate, 2),
        "active_creators": session.query(ScheduledPost.creator_id).distinct().count(),
        "vault_posts_scheduled": session.query(ScheduledPost)
        .filter(
            and_(
                ScheduledPost.post_type == PostType.VAULT,
                ScheduledPost.status == PostStatus.SCHEDULED,
            )
        )
        .count(),
    }
