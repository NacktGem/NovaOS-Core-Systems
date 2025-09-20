"""
Stripe Payment Integration for Black Rose Collective

This module handles:
- Subscription creation and management
- One-time payments for content unlocks
- Webhook handling for payment events
- Creator payout processing

Required environment variables:
- STRIPE_SECRET_KEY: Your Stripe secret key
- STRIPE_WEBHOOK_SECRET: Webhook endpoint secret for verification
- STRIPE_PUBLISHABLE_KEY: Frontend publishable key
"""

import os
import stripe
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from app.security.jwt import get_current_user
from app.db.models import User

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/stripe", tags=["stripe"])


class CreateSubscriptionRequest(BaseModel):
    """Request to create a new subscription"""

    creator_id: str
    tier: str  # "basic", "premium", "vip"
    price_id: str  # Stripe price ID


class CreatePaymentIntentRequest(BaseModel):
    """Request to create payment intent for content unlock"""

    content_id: str
    content_type: str  # "photo", "video", "live_stream"
    amount_cents: int
    creator_id: str


class StripeCustomerResponse(BaseModel):
    """Response containing Stripe customer information"""

    customer_id: str
    client_secret: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    """Response for payment intent creation"""

    payment_intent_id: str
    client_secret: str
    amount_cents: int


@router.post("/create-customer", response_model=StripeCustomerResponse)
async def create_stripe_customer(current_user: User = Depends(get_current_user)):
    """Create or retrieve Stripe customer for user"""
    try:
        # Check if user already has Stripe customer ID
        if hasattr(current_user, "stripe_customer_id") and current_user.stripe_customer_id:
            customer = stripe.Customer.retrieve(current_user.stripe_customer_id)
        else:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=getattr(current_user, "display_name", None) or current_user.email,
                metadata={"user_id": str(current_user.id), "platform": "black_rose_collective"},
            )

            # TODO: Update user record with stripe_customer_id
            # current_user.stripe_customer_id = customer.id
            # db.commit()

        return StripeCustomerResponse(customer_id=customer.id)

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating customer: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {e}")
    except Exception as e:
        logger.error(f"Error creating Stripe customer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create-subscription", response_model=Dict[str, Any])
async def create_subscription(
    request: CreateSubscriptionRequest, current_user: User = Depends(get_current_user)
):
    """Create subscription for creator"""
    try:
        # Get or create customer
        customer_response = await create_stripe_customer(current_user)

        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer_response.customer_id,
            items=[
                {
                    "price": request.price_id,
                }
            ],
            payment_behavior="default_incomplete",
            payment_settings={"save_default_payment_method": "on_subscription"},
            expand=["latest_invoice.payment_intent"],
            metadata={
                "creator_id": request.creator_id,
                "tier": request.tier,
                "subscriber_id": str(current_user.id),
                "platform": "black_rose_collective",
            },
        )

        return {
            "subscription_id": subscription.id,
            "client_secret": subscription.latest_invoice.payment_intent.client_secret,
            "status": subscription.status,
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating subscription: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {e}")
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: CreatePaymentIntentRequest, current_user: User = Depends(get_current_user)
):
    """Create payment intent for one-time content purchase"""
    try:
        # Calculate platform cut (12%)
        platform_cut = int(request.amount_cents * 0.12)
        creator_cut = request.amount_cents - platform_cut

        # Get or create customer
        customer_response = await create_stripe_customer(current_user)

        # Create payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount_cents,
            currency="usd",
            customer=customer_response.customer_id,
            metadata={
                "content_id": request.content_id,
                "content_type": request.content_type,
                "creator_id": request.creator_id,
                "buyer_id": str(current_user.id),
                "platform_cut_cents": str(platform_cut),
                "creator_cut_cents": str(creator_cut),
                "platform": "black_rose_collective",
            },
            application_fee_amount=platform_cut,  # Platform's cut
            transfer_data={
                "destination": f"acct_{request.creator_id}"  # Creator's Stripe Connect account
            },
        )

        return PaymentIntentResponse(
            payment_intent_id=payment_intent.id,
            client_secret=payment_intent.client_secret,
            amount_cents=request.amount_cents,
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating payment intent: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {e}")
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        logger.error(f"Invalid payload in webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature in webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        await handle_payment_success(payment_intent)

    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        await handle_subscription_payment(invoice)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await handle_subscription_cancelled(subscription)

    else:
        logger.info(f"Unhandled webhook event type: {event['type']}")

    return {"status": "success"}


async def handle_payment_success(payment_intent):
    """Handle successful one-time payment"""
    try:
        metadata = payment_intent.get("metadata", {})

        # TODO: Update database with successful purchase
        # - Create Purchase record
        # - Update user access to content
        # - Send confirmation email
        # - Update creator earnings

        logger.info(
            f"Payment succeeded: {payment_intent['id']} for content {metadata.get('content_id')}"
        )

    except Exception as e:
        logger.error(f"Error handling payment success: {e}")


async def handle_subscription_payment(invoice):
    """Handle successful subscription payment"""
    try:
        subscription_id = invoice.get("subscription")

        # TODO: Update database with subscription payment
        # - Update subscription status
        # - Grant access to creator content
        # - Update creator recurring revenue

        logger.info(f"Subscription payment succeeded: {subscription_id}")

    except Exception as e:
        logger.error(f"Error handling subscription payment: {e}")


async def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation"""
    try:
        # TODO: Update database with cancellation
        # - Update subscription status
        # - Revoke access after grace period
        # - Update creator metrics

        logger.info(f"Subscription cancelled: {subscription['id']}")

    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {e}")


@router.get("/config")
async def get_stripe_config():
    """Get Stripe configuration for frontend"""
    return {
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY"),
        "currency": "usd",
        "country": "US",
    }
