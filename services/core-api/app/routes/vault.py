# routes/vault.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from ..db.base import get_session
from ..models.vault import VaultContent, VaultPurchase, UserBalance
from ..db.models.users import User
from agents.common.security import authorize_headers

logger = logging.getLogger(__name__)
router = APIRouter()


class PurchaseRequest(BaseModel):
    content_id: str
    payment_method: Optional[str] = "balance"


@router.get("/vault/{user_id}")
async def get_vault_data(user_id: str, claims: dict = Depends(authorize_headers)):
    """Get vault data for user"""
    try:
        # Verify user can access this data
        requesting_user_id = claims.get("user_id")
        if requesting_user_id != user_id and claims.get("role") not in [
            "godmode",
            "superadmin",
            "admin",
        ]:
            raise HTTPException(status_code=403, detail="Access denied")

        for db in get_session():
            # Get user balance
            user_balance = db.query(UserBalance).filter(UserBalance.user_id == user_id).first()
            if not user_balance:
                # Create default balance for user
                user_balance = UserBalance(user_id=user_id)
                db.add(user_balance)
                db.commit()

            # Get user's purchases
            purchases = (
                db.query(VaultPurchase)
                .filter(VaultPurchase.user_id == user_id, VaultPurchase.status == "completed")
                .all()
            )

            purchased_content_ids = [p.content_id for p in purchases]

            # Get unlocked content
            unlocked_content = []
            if purchased_content_ids:
                unlocked_items = (
                    db.query(VaultContent)
                    .filter(
                        VaultContent.id.in_(purchased_content_ids), VaultContent.is_active == True
                    )
                    .all()
                )

                for item in unlocked_items:
                    content_dict = item.to_dict()
                    content_dict["unlocked"] = True
                    # Find purchase date
                    purchase = next((p for p in purchases if p.content_id == item.id), None)
                    if purchase:
                        content_dict["unlockedAt"] = purchase.purchased_at.isoformat()
                    unlocked_content.append(content_dict)

            # Get available locked content (not purchased)
            locked_items = (
                db.query(VaultContent)
                .filter(
                    VaultContent.is_active == True,
                    ~VaultContent.id.in_(purchased_content_ids) if purchased_content_ids else True,
                )
                .limit(20)
                .all()
            )

            locked_content = []
            for item in locked_items:
                content_dict = item.to_dict()
                content_dict["unlocked"] = False
                locked_content.append(content_dict)

            # Get recent transactions
            recent_transactions = []
            for purchase in purchases[-10:]:  # Last 10 transactions
                content = (
                    db.query(VaultContent).filter(VaultContent.id == purchase.content_id).first()
                )
                if content:
                    transaction_dict = purchase.to_dict()
                    transaction_dict["itemTitle"] = content.title
                    transaction_dict["creatorName"] = content.creator_name
                    recent_transactions.append(transaction_dict)

            vault_data = {
                "userId": user_id,
                "balance": user_balance.to_dict()["balance"],
                "totalSpent": user_balance.to_dict()["totalSpent"],
                "verified": user_balance.to_dict()["verified"],
                "unlockedItems": unlocked_content,
                "lockedItems": locked_content,
                "recentTransactions": recent_transactions,
            }

            return vault_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get vault data error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving vault data")


@router.post("/vault/purchase")
async def purchase_content(request: PurchaseRequest, claims: dict = Depends(authorize_headers)):
    """Purchase vault content"""
    try:
        user_id = claims.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        for db in get_session():
            # Get content
            content = (
                db.query(VaultContent)
                .filter(VaultContent.id == request.content_id, VaultContent.is_active == True)
                .first()
            )

            if not content:
                raise HTTPException(status_code=404, detail="Content not found")

            # Check if already purchased
            existing_purchase = (
                db.query(VaultPurchase)
                .filter(
                    VaultPurchase.user_id == user_id,
                    VaultPurchase.content_id == request.content_id,
                    VaultPurchase.status == "completed",
                )
                .first()
            )

            if existing_purchase:
                raise HTTPException(status_code=400, detail="Content already purchased")

            # Get user balance
            user_balance = db.query(UserBalance).filter(UserBalance.user_id == user_id).first()
            if not user_balance:
                user_balance = UserBalance(user_id=user_id)
                db.add(user_balance)

            # Check sufficient balance
            if user_balance.balance < content.price:
                raise HTTPException(status_code=400, detail="Insufficient balance")

            # Create purchase record
            purchase = VaultPurchase(
                user_id=user_id, content_id=content.id, amount=content.price, status="completed"
            )

            # Update user balance
            user_balance.balance -= content.price
            user_balance.total_spent += content.price
            user_balance.updated_at = datetime.utcnow()

            db.add(purchase)
            db.commit()

            logger.info(f"Content purchased: {content.id} by user {user_id}")

            return {
                "success": True,
                "message": "Content unlocked successfully",
                "purchase": purchase.to_dict(),
                "content": content.to_dict(),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Purchase content error: {e}")
        raise HTTPException(status_code=500, detail="Error processing purchase")


@router.post("/vault/content")
async def create_vault_content(content_data: dict, claims: dict = Depends(authorize_headers)):
    """Create new vault content (creators only)"""
    try:
        user_id = claims.get("user_id")
        role = claims.get("role", "")

        if role not in ["creator", "admin", "superadmin", "godmode"]:
            raise HTTPException(status_code=403, detail="Creator access required")

        for db in get_session():
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            content = VaultContent(
                creator_id=user_id,
                creator_name=user.username,
                studio=content_data.get("studio"),
                title=content_data["title"],
                description=content_data.get("description"),
                content_type=content_data["content_type"],
                price=content_data["price"],
                nsfw_level=content_data.get("nsfw_level", 0),
                thumbnail_url=content_data.get("thumbnail_url"),
                content_urls=content_data.get("content_urls", []),
                item_count=content_data.get("item_count", 1),
                tags=content_data.get("tags", []),
            )

            db.add(content)
            db.commit()

            logger.info(f"Vault content created: {content.id} by {user.username}")

            return {
                "success": True,
                "message": "Content created successfully",
                "content": content.to_dict(),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create vault content error: {e}")
        raise HTTPException(status_code=500, detail="Error creating content")


@router.put("/balance/{user_id}")
async def update_user_balance(
    user_id: str, balance_data: dict, claims: dict = Depends(authorize_headers)
):
    """Update user balance (admin only)"""
    try:
        role = claims.get("role", "")
        if role not in ["admin", "superadmin", "godmode"]:
            raise HTTPException(status_code=403, detail="Admin access required")

        for db in get_session():
            user_balance = db.query(UserBalance).filter(UserBalance.user_id == user_id).first()
            if not user_balance:
                user_balance = UserBalance(user_id=user_id)
                db.add(user_balance)

            if "balance" in balance_data:
                user_balance.balance = balance_data["balance"]
            if "verified" in balance_data:
                user_balance.verified = balance_data["verified"]

            user_balance.updated_at = datetime.utcnow()
            db.commit()

            return {
                "success": True,
                "message": "Balance updated successfully",
                "balance": user_balance.to_dict(),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update balance error: {e}")
        raise HTTPException(status_code=500, detail="Error updating balance")
