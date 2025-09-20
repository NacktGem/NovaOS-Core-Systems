"""
Creator Productivity API Routes - Draft Management
================================================

Advanced draft system for creators competing with OnlyFans/Fansly:
- Save drafts with media, captions, and tags
- Full CRUD operations on drafts
- Convert drafts to scheduled or published posts
- Auto-save and version management

Authentication: Creator+ role required for own drafts, GodMode sees all
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models.creator_productivity import PostDraft, PostType, ScheduledPost, PostStatus
from app.security.jwt import get_current_user
from app.db.models.users import User

router = APIRouter(prefix="/posts", tags=["creator_productivity"])

# ============================================================================
# Request/Response Models
# ============================================================================


class CreateDraftRequest(BaseModel):
    """Request model for creating new drafts"""

    title: Optional[str] = Field(None, max_length=200)
    caption: Optional[str] = Field(None, max_length=5000)
    media_urls: List[str] = Field(default_factory=list, max_items=10)
    tags: List[str] = Field(default_factory=list, max_items=20)
    post_type: PostType = PostType.HOME
    vault_price: Optional[float] = Field(None, gt=0, le=1000)
    ritual_name: Optional[str] = Field(None, max_length=100)


class UpdateDraftRequest(BaseModel):
    """Request model for updating existing drafts"""

    title: Optional[str] = Field(None, max_length=200)
    caption: Optional[str] = Field(None, max_length=5000)
    media_urls: Optional[List[str]] = Field(None, max_items=10)
    tags: Optional[List[str]] = Field(None, max_items=20)
    post_type: Optional[PostType] = None
    vault_price: Optional[float] = Field(None, gt=0, le=1000)
    ritual_name: Optional[str] = Field(None, max_length=100)


class DraftResponse(BaseModel):
    """Response model for draft data"""

    id: str
    creator_id: str
    title: Optional[str]
    caption: Optional[str]
    media_urls: List[str]
    tags: List[str]
    post_type: PostType
    vault_price: Optional[float]
    ritual_name: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_edited: datetime

    # Calculated fields
    word_count: int = 0
    media_count: int = 0
    is_ready_to_publish: bool = False

    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        self.word_count = len(self.caption.split()) if self.caption else 0
        self.media_count = len(self.media_urls)
        # Draft is ready if it has content (caption or media)
        self.is_ready_to_publish = bool(self.caption or self.media_urls)


class DraftsListResponse(BaseModel):
    """Response model for paginated drafts"""

    drafts: List[DraftResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class ConvertDraftRequest(BaseModel):
    """Request model for converting draft to scheduled/published post"""

    action: str = Field(..., regex="^(schedule|publish)$")
    scheduled_for: Optional[datetime] = None  # Required if action is 'schedule'


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/drafts", response_model=DraftResponse)
async def create_draft(
    request: CreateDraftRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new draft post

    Creators can save work in progress with auto-save functionality.
    Supports all post types with proper validation.

    Copilot Enhancement Opportunities:
    - AI writing assistance for captions based on media content
    - Smart tag suggestions from successful posts
    - Content quality scoring with improvement tips
    """
    # Verify creator role
    if current_user.role not in ["creator", "admin", "superadmin", "godmode"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Creator role required to create drafts"
        )

    # Create draft
    draft = PostDraft(
        creator_id=current_user.id,
        title=request.title,
        caption=request.caption,
        media_urls=request.media_urls,
        tags=request.tags,
        post_type=request.post_type,
        vault_price=request.vault_price,
        ritual_name=request.ritual_name,
    )

    session.add(draft)
    session.commit()
    session.refresh(draft)

    return DraftResponse.from_orm(draft)


@router.get("/drafts", response_model=DraftsListResponse)
async def list_drafts(
    page: int = Field(1, ge=1),
    per_page: int = Field(20, ge=1, le=100),
    post_type: Optional[PostType] = None,
    search: Optional[str] = Field(None, max_length=100),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List drafts with filtering, search, and pagination

    Creators see their own drafts, GodMode sees all drafts.
    Supports search by title/caption and filtering by post type.
    """
    # Build query based on user role
    query = session.query(PostDraft)

    # Role-based filtering
    if current_user.role not in ["godmode", "superadmin"]:
        query = query.filter(PostDraft.creator_id == current_user.id)

    # Apply filters
    if post_type:
        query = query.filter(PostDraft.post_type == post_type)

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(PostDraft.title.ilike(search_term), PostDraft.caption.ilike(search_term))
        )

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    drafts = query.order_by(PostDraft.last_edited.desc()).offset(offset).limit(per_page).all()

    return DraftsListResponse(
        drafts=[DraftResponse.from_orm(draft) for draft in drafts],
        total=total,
        page=page,
        per_page=per_page,
        has_next=offset + per_page < total,
        has_prev=page > 1,
    )


@router.get("/drafts/{draft_id}", response_model=DraftResponse)
async def get_draft(
    draft_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific draft"""
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return DraftResponse.from_orm(draft)


@router.put("/drafts/{draft_id}", response_model=DraftResponse)
async def update_draft(
    draft_id: str,
    request: UpdateDraftRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing draft

    Supports partial updates with auto-save functionality.
    Updates last_edited timestamp for proper sorting.
    """
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update fields if provided
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(draft, field, value)

    # Update timestamps
    draft.updated_at = datetime.now(timezone.utc)
    draft.last_edited = datetime.now(timezone.utc)

    session.commit()
    session.refresh(draft)

    return DraftResponse.from_orm(draft)


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a draft permanently

    Creators can delete their own drafts, GodMode can delete any.
    """
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    session.delete(draft)
    session.commit()

    return {"message": "Draft deleted successfully"}


@router.post("/drafts/{draft_id}/convert")
async def convert_draft(
    draft_id: str,
    request: ConvertDraftRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Convert draft to scheduled or published post

    Validates draft content and converts to appropriate post type.
    Deletes draft after successful conversion.
    """
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Validate draft has content
    if not draft.caption and not draft.media_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft must have caption or media to convert",
        )

    # Validate vault pricing
    if draft.post_type == PostType.VAULT and not draft.vault_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Vault posts must have a price"
        )

    if request.action == "schedule":
        # Convert to scheduled post
        if not request.scheduled_for:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="scheduled_for required when action is 'schedule'",
            )

        if request.scheduled_for <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled time must be in the future",
            )

        # Create scheduled post from draft
        scheduled_post = draft.to_scheduled_post(request.scheduled_for)
        session.add(scheduled_post)

        # Delete draft
        session.delete(draft)
        session.commit()
        session.refresh(scheduled_post)

        return {
            "message": "Draft converted to scheduled post",
            "scheduled_post_id": str(scheduled_post.id),
            "scheduled_for": request.scheduled_for.isoformat(),
        }

    elif request.action == "publish":
        # Convert to immediate publication
        # This would integrate with your actual publishing system

        # For now, create as published scheduled post
        scheduled_post = draft.to_scheduled_post(datetime.now(timezone.utc))
        scheduled_post.status = PostStatus.PUBLISHED
        scheduled_post.published_at = datetime.now(timezone.utc)

        session.add(scheduled_post)

        # Delete draft
        session.delete(draft)
        session.commit()
        session.refresh(scheduled_post)

        return {"message": "Draft published successfully", "post_id": str(scheduled_post.id)}


@router.post("/drafts/{draft_id}/duplicate")
async def duplicate_draft(
    draft_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a copy of an existing draft

    Useful for creating variations or templates from successful drafts.
    """
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found")

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Create duplicate
    duplicate = PostDraft(
        creator_id=current_user.id,
        title=f"Copy of {draft.title}" if draft.title else None,
        caption=draft.caption,
        media_urls=draft.media_urls.copy() if draft.media_urls else [],
        tags=draft.tags.copy() if draft.tags else [],
        post_type=draft.post_type,
        vault_price=draft.vault_price,
        ritual_name=draft.ritual_name,
    )

    session.add(duplicate)
    session.commit()
    session.refresh(duplicate)

    return {"message": "Draft duplicated successfully", "duplicate_id": str(duplicate.id)}


# ============================================================================
# Auto-Save Endpoint
# ============================================================================


@router.patch("/drafts/{draft_id}/autosave")
async def autosave_draft(
    draft_id: str,
    request: UpdateDraftRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Auto-save draft changes (called by frontend every 30 seconds)

    Lightweight endpoint for frequent saves without full validation.
    Only updates provided fields and timestamps.
    """
    draft = session.query(PostDraft).filter(PostDraft.id == draft_id).first()

    if not draft:
        # If draft doesn't exist, return success to prevent frontend errors
        return {"message": "Draft not found", "autosaved": False}

    # Permission check
    if current_user.role not in ["godmode", "superadmin"] and draft.creator_id != current_user.id:
        return {"message": "Access denied", "autosaved": False}

    # Update only provided fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(draft, field, value)

    # Update only last_edited (not updated_at for auto-saves)
    draft.last_edited = datetime.now(timezone.utc)

    session.commit()

    return {"message": "Draft auto-saved", "autosaved": True}
