"""
Updated Payment Routes with Stripe Integration
=============================================

Routes for processing payments through Stripe with customer-paid fees
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Dict, List
from decimal import Decimal
from datetime import datetime, timezone
import stripe
import logging

from app.db.base import get_session
from app.db.models.users import User
from app.db.models.payments import CreatorStripeAccount, PaymentTransaction, PromoCode
from app.db.models.creator_productivity import VaultBundle
from app.security.jwt import get_current_user
from app.services.stripe_service import stripe_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


# Request/Response Models
class CreateStripeAccountRequest(BaseModel):
    """Request to create Stripe Connect account"""
    country: str = Field(default="US", max_length=2)


class StripeAccountResponse(BaseModel):
    """Response for Stripe account creation"""
    success: bool
    stripe_account_id: Optional[str] = None
    onboarding_url: Optional[str] = None
    account_status: Optional[str] = None
    error: Optional[str] = None


class PaymentCalculationRequest(BaseModel):
    """Request to calculate payment totals"""
    base_amount: Decimal = Field(..., gt=0, le=10000)


class PaymentCalculationResponse(BaseModel):
    """Response showing payment breakdown"""
    base_amount: float
    stripe_percentage_fee: float
    stripe_fixed_fee: float
    total_stripe_fees: float
    customer_total: float
    platform_fee: float
    creator_earnings: float
    fee_explanation: str


class ProcessPaymentRequest(BaseModel):
    """Request to process payment"""
    payment_method_id: str = Field(..., max_length=255)
    bundle_id: Optional[str] = None
    content_id: Optional[str] = None
    promo_code: Optional[str] = Field(None, max_length=20)


class PaymentResponse(BaseModel):
    """Response for payment processing"""
    success: bool
    payment_intent_id: Optional[str] = None
    status: Optional[str] = None
    base_amount: Optional[float] = None
    stripe_fees: Optional[float] = None
    customer_total: Optional[float] = None
    creator_amount: Optional[float] = None
    platform_fee: Optional[float] = None
    client_secret: Optional[str] = None
    fee_breakdown: Optional[Dict] = None
    error: Optional[str] = None


# Stripe Connect Account Management
@router.post("/stripe/connect-account", response_model=StripeAccountResponse)
async def create_stripe_connect_account(
    request: CreateStripeAccountRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create Stripe Connect account for creator"""

    if current_user.role not in ["creator", "admin", "superadmin", "godmode"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator role required"
        )

    # Check if creator already has Stripe account
    existing_account = session.query(CreatorStripeAccount).filter(
        CreatorStripeAccount.creator_id == current_user.id
    ).first()

    if existing_account:
        return StripeAccountResponse(
            success=True,
            stripe_account_id=existing_account.stripe_account_id,
            account_status="existing_account",
            error="Account already exists"
        )

    # Create new Stripe account
    result = await stripe_service.create_creator_connect_account(
        creator_id=str(current_user.id),
        email=current_user.email,
        country=request.country
    )

    if result["success"]:
        # Save to database
        stripe_account = CreatorStripeAccount(
            creator_id=current_user.id,
            stripe_account_id=result["stripe_account_id"],
            country=request.country
        )
        session.add(stripe_account)
        session.commit()

        return StripeAccountResponse(
            success=True,
            stripe_account_id=result["stripe_account_id"],
            onboarding_url=result["onboarding_url"],
            account_status=result["account_status"]
        )
    else:
        return StripeAccountResponse(
            success=False,
            error=result["error"]
        )


@router.get("/stripe/account-status")
async def get_stripe_account_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get creator's Stripe account status"""

    stripe_account = session.query(CreatorStripeAccount).filter(
        CreatorStripeAccount.creator_id == current_user.id
    ).first()

    if not stripe_account:
        return {"has_account": False}

    try:
        # Get latest status from Stripe
        account = stripe.Account.retrieve(stripe_account.stripe_account_id)

        # Update local status
        stripe_account.charges_enabled = account.charges_enabled
        stripe_account.payouts_enabled = account.payouts_enabled
        stripe_account.details_submitted = account.details_submitted
        session.commit()

        return {
            "has_account": True,
            "stripe_account_id": stripe_account.stripe_account_id,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "details_submitted": account.details_submitted,
            "requirements_pending": account.requirements.get("pending", [])
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe account retrieval failed: {e}")
        return {"has_account": True, "error": str(e)}


# Payment Calculation
@router.post("/calculate-total", response_model=PaymentCalculationResponse)
async def calculate_payment_total(request: PaymentCalculationRequest):
    """Calculate what customer will pay including all fees"""

    calculation = stripe_service.calculate_customer_total(request.base_amount)
    return PaymentCalculationResponse(**calculation)


# Payment Processing
@router.post("/process-vault-bundle", response_model=PaymentResponse)
async def process_vault_bundle_payment(
    request: ProcessPaymentRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Process vault bundle purchase with Stripe"""

    if not request.bundle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bundle ID required"
        )

    # Get bundle details
    bundle = session.query(VaultBundle).filter(
        VaultBundle.id == request.bundle_id,
        VaultBundle.is_active == True
    ).first()

    if not bundle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bundle not found or inactive"
        )

    # Check if bundle is available
    if bundle.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bundle has expired"
        )

    if bundle.is_sold_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bundle is sold out"
        )

    # Check if user already purchased
    existing_transaction = session.query(PaymentTransaction).filter(
        PaymentTransaction.purchaser_id == current_user.id,
        PaymentTransaction.bundle_id == request.bundle_id,
        PaymentTransaction.status == "completed"
    ).first()

    if existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bundle already purchased"
        )

    # Get creator's Stripe account
    creator_account = session.query(CreatorStripeAccount).filter(
        CreatorStripeAccount.creator_id == bundle.creator_id,
        CreatorStripeAccount.charges_enabled == True
    ).first()

    if not creator_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Creator payment not available"
        )

    # Apply promo code if provided
    final_amount = Decimal(str(bundle.bundle_price))
    promo_discount = Decimal('0')

    if request.promo_code:
        promo_result = await _apply_promo_code(
            request.promo_code, final_amount, current_user.id, session
        )
        if promo_result["valid"]:
            promo_discount = promo_result["discount"]
            final_amount -= promo_discount

    # Process payment through Stripe
    result = await stripe_service.process_vault_bundle_purchase(
        base_amount=final_amount,
        creator_stripe_account=creator_account.stripe_account_id,
        payment_method_id=request.payment_method_id,
        purchaser_id=str(current_user.id),
        bundle_id=request.bundle_id,
        metadata={
            "promo_code": request.promo_code,
            "promo_discount": str(promo_discount)
        }
    )

    if result["success"]:
        # Record transaction in database
        transaction = PaymentTransaction(
            stripe_payment_intent_id=result["payment_intent_id"],
            purchaser_id=current_user.id,
            creator_id=bundle.creator_id,
            creator_stripe_account_id=creator_account.id,
            bundle_id=request.bundle_id,
            purchase_type="vault_bundle",
            base_amount=result["base_amount"],
            stripe_fees=result["stripe_fees"],
            customer_total=result["customer_total"],
            platform_fee=result["platform_fee"],
            creator_amount=result["creator_amount"],
            status="pending"
        )
        session.add(transaction)
        session.commit()

        return PaymentResponse(**result)
    else:
        return PaymentResponse(success=False, error=result["error"])


@router.post("/process-individual-content", response_model=PaymentResponse)
async def process_individual_content_payment(
    request: ProcessPaymentRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Process individual content purchase"""

    if not request.content_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content ID required"
        )

    # Get content details from vault
    from app.models.vault import VaultContent
    content = session.query(VaultContent).filter(
        VaultContent.id == request.content_id,
        VaultContent.is_active == True
    ).first()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    # Check if user already has access
    from app.models.vault import VaultPurchase
    existing_access = session.query(VaultPurchase).filter(
        VaultPurchase.user_id == str(current_user.id),
        VaultPurchase.content_id == request.content_id,
        VaultPurchase.status == "completed"
    ).first()

    if existing_access:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content already purchased"
        )

    # Get creator's Stripe account
    creator_account = session.query(CreatorStripeAccount).filter(
        CreatorStripeAccount.creator_id == content.creator_id,
        CreatorStripeAccount.charges_enabled == True
    ).first()

    if not creator_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Creator payment not available"
        )

    # Process payment
    result = await stripe_service.process_individual_content_purchase(
        base_amount=Decimal(str(content.price)),
        creator_stripe_account=creator_account.stripe_account_id,
        payment_method_id=request.payment_method_id,
        purchaser_id=str(current_user.id),
        content_id=request.content_id
    )

    if result["success"]:
        # Record transaction
        transaction = PaymentTransaction(
            stripe_payment_intent_id=result["payment_intent_id"],
            purchaser_id=current_user.id,
            creator_id=content.creator_id,
            creator_stripe_account_id=creator_account.id,
            content_id=request.content_id,
            purchase_type="individual_content",
            base_amount=result["base_amount"],
            stripe_fees=result["stripe_fees"],
            customer_total=result["customer_total"],
            platform_fee=result["platform_fee"],
            creator_amount=result["creator_amount"],
            status="pending"
        )
        session.add(transaction)
        session.commit()

        return PaymentResponse(**result)
    else:
        return PaymentResponse(success=False, error=result["error"])


# Webhook Handler
@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )

    result = await stripe_service.handle_webhook(payload.decode(), sig_header)

    if result["success"]:
        return {"received": True}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )


# Utility Functions
async def _apply_promo_code(
    code: str, amount: Decimal, user_id: str, session: Session
) -> Dict:
    """Apply and validate promo code"""

    promo = session.query(PromoCode).filter(
        PromoCode.code == code.upper(),
        PromoCode.is_active == True
    ).first()

    if not promo:
        return {"valid": False, "error": "Invalid promo code"}

    # Check validity period
    now = datetime.now(timezone.utc)
    if promo.valid_until and now > promo.valid_until:
        return {"valid": False, "error": "Promo code expired"}

    if now < promo.valid_from:
        return {"valid": False, "error": "Promo code not yet valid"}

    # Check usage limits
    if promo.max_uses and promo.current_uses >= promo.max_uses:
        return {"valid": False, "error": "Promo code usage limit reached"}

    # Check minimum purchase amount
    if promo.min_purchase_amount and amount < promo.min_purchase_amount:
        return {"valid": False, "error": f"Minimum purchase ${promo.min_purchase_amount} required"}

    # Calculate discount
    if promo.discount_type == "percentage":
        discount = amount * (promo.discount_value / 100)
    else:  # fixed_amount
        discount = min(promo.discount_value, amount)  # Can't discount more than purchase

    return {
        "valid": True,
        "discount": discount,
        "promo_id": promo.id
    }


# Creator earnings endpoint
@router.get("/creator/earnings")
async def get_creator_earnings(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get creator earnings summary"""

    if current_user.role not in ["creator", "admin", "superadmin", "godmode"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creator role required"
        )

    result = await stripe_service.get_creator_earnings(str(current_user.id), days)
    return result
