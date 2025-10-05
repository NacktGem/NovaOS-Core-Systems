"""
Stripe Payment Service for NovaOS Black Rose Collective
=====================================================

Handles creator payments with 12% platform cut as per directives/core.json
Test key: sk_test_51SEXRfDlEmATiigC2JPga7tVeTSWhHuLsDyOuRVHt22B0pO4y60empoAGr6v98Mp0G43OZiNMXTE7VzuTYXJP3k200pnFfBayt
"""

import stripe
import os
import json
from typing import Dict, Optional, List
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.base import get_session
import logging

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_51SEXRfDlEmATiigC2JPga7tVeTSWhHuLsDyOuRVHt22B0pO4y60empoAGr6v98Mp0G43OZiNMXTE7VzuTYXJP3k200pnFfBayt")

logger = logging.getLogger(__name__)

class NovaOSStripeService:
    """NovaOS Stripe payment service with 12% platform cut"""

    def __init__(self):
        # Load platform cut from directives/core.json
        self.platform_fee_percent = self._load_platform_fee_percent()
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    def _load_platform_fee_percent(self) -> float:
        """Load platform fee from directives/core.json"""
        try:
            with open("directives/core.json", "r") as f:
                config = json.load(f)
                return float(config.get("payments", {}).get("platform_cut_percent", 12))
        except Exception as e:
            logger.warning(f"Could not load platform fee from directives: {e}")
            return 12.0  # Default to 12% as per directives

    async def create_creator_connect_account(self, creator_id: str, email: str, country: str = "US") -> Dict:
        """Create Stripe Connect Express account for creator"""
        try:
            account = stripe.Account.create(
                type="express",
                country=country,
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_type="individual",
                metadata={
                    "creator_id": creator_id,
                    "platform": "novaos_blackrose"
                }
            )

            # Create account link for onboarding
            account_link = stripe.AccountLink.create(
                account=account.id,
                refresh_url="https://blackrosecollective.studio/creator/stripe/refresh",
                return_url="https://blackrosecollective.studio/creator/stripe/success",
                type="account_onboarding",
            )

            return {
                "success": True,
                "stripe_account_id": account.id,
                "onboarding_url": account_link.url,
                "account_status": "pending_verification"
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe account creation failed: {e}")
            return {"success": False, "error": str(e)}

    async def process_vault_bundle_purchase(
        self,
        base_amount: Decimal,  # Base bundle price
        creator_stripe_account: str,
        payment_method_id: str,
        purchaser_id: str,
        bundle_id: str,
        metadata: Dict = None
    ) -> Dict:
        """Process vault bundle purchase with NovaOS 12% platform fee + Stripe fees passed to customer"""

        try:
            # Calculate fees
            stripe_fee_percent = Decimal('0.029')  # 2.9%
            stripe_fixed_fee = Decimal('0.30')    # $0.30

            # Calculate total amount customer pays (base + Stripe fees)
            stripe_percentage_fee = base_amount * stripe_fee_percent
            total_stripe_fees = stripe_percentage_fee + stripe_fixed_fee
            customer_total = base_amount + total_stripe_fees

            # Calculate NovaOS platform fee (12% of base amount)
            platform_fee_amount = base_amount * (Decimal(self.platform_fee_percent) / 100)
            creator_amount = base_amount - platform_fee_amount

            # Convert to cents for Stripe
            customer_total_cents = int(customer_total * 100)
            platform_fee_cents = int(platform_fee_amount * 100)

            # Prepare metadata
            payment_metadata = {
                "purchaser_id": purchaser_id,
                "bundle_id": bundle_id,
                "platform": "novaos_blackrose",
                "purchase_type": "vault_bundle",
                "platform_fee_percent": str(self.platform_fee_percent),
                "base_amount": str(base_amount),
                "stripe_fees": str(total_stripe_fees),
                "customer_total": str(customer_total)
            }
            if metadata:
                payment_metadata.update(metadata)

            # Create Payment Intent with application fee
            payment_intent = stripe.PaymentIntent.create(
                amount=customer_total_cents,  # Customer pays base + Stripe fees
                currency="usd",
                payment_method=payment_method_id,
                confirmation_method="manual",
                confirm=True,
                application_fee_amount=platform_fee_cents,  # NovaOS gets 12% of base
                transfer_data={
                    "destination": creator_stripe_account,
                },
                metadata=payment_metadata
            )

            return {
                "success": True,
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "base_amount": float(base_amount),
                "stripe_fees": float(total_stripe_fees),
                "customer_total": float(customer_total),
                "creator_amount": float(creator_amount),
                "platform_fee": float(platform_fee_amount),
                "platform_fee_percent": self.platform_fee_percent,
                "client_secret": payment_intent.client_secret,
                "fee_breakdown": {
                    "base_price": float(base_amount),
                    "stripe_percentage_fee": float(stripe_percentage_fee),
                    "stripe_fixed_fee": float(stripe_fixed_fee),
                    "total_stripe_fees": float(total_stripe_fees),
                    "platform_cut": float(platform_fee_amount),
                    "creator_earnings": float(creator_amount)
                }
            }

        except stripe.error.StripeError as e:
            logger.error(f"Payment processing failed: {e}")
            return {"success": False, "error": str(e)}

    async def process_individual_content_purchase(
        self,
        base_amount: Decimal,  # Base content price
        creator_stripe_account: str,
        payment_method_id: str,
        purchaser_id: str,
        content_id: str
    ) -> Dict:
        """Process individual vault content purchase with Stripe fees passed to customer"""

        try:
            # Calculate fees
            stripe_fee_percent = Decimal('0.029')  # 2.9%
            stripe_fixed_fee = Decimal('0.30')    # $0.30

            # Calculate total amount customer pays (base + Stripe fees)
            stripe_percentage_fee = base_amount * stripe_fee_percent
            total_stripe_fees = stripe_percentage_fee + stripe_fixed_fee
            customer_total = base_amount + total_stripe_fees

            # Calculate NovaOS platform fee (12% of base amount)
            platform_fee_amount = base_amount * (Decimal(self.platform_fee_percent) / 100)
            creator_amount = base_amount - platform_fee_amount

            # Convert to cents for Stripe
            customer_total_cents = int(customer_total * 100)
            platform_fee_cents = int(platform_fee_amount * 100)

            payment_intent = stripe.PaymentIntent.create(
                amount=customer_total_cents,  # Customer pays base + Stripe fees
                currency="usd",
                payment_method=payment_method_id,
                confirmation_method="manual",
                confirm=True,
                application_fee_amount=platform_fee_cents,  # NovaOS gets 12% of base
                transfer_data={
                    "destination": creator_stripe_account,
                },
                metadata={
                    "purchaser_id": purchaser_id,
                    "content_id": content_id,
                    "platform": "novaos_blackrose",
                    "purchase_type": "individual_content",
                    "platform_fee_percent": str(self.platform_fee_percent),
                    "base_amount": str(base_amount),
                    "stripe_fees": str(total_stripe_fees),
                    "customer_total": str(customer_total)
                }
            )

            return {
                "success": True,
                "payment_intent_id": payment_intent.id,
                "status": payment_intent.status,
                "base_amount": float(base_amount),
                "stripe_fees": float(total_stripe_fees),
                "customer_total": float(customer_total),
                "creator_amount": float(creator_amount),
                "platform_fee": float(platform_fee_amount),
                "client_secret": payment_intent.client_secret,
                "fee_breakdown": {
                    "base_price": float(base_amount),
                    "stripe_percentage_fee": float(stripe_percentage_fee),
                    "stripe_fixed_fee": float(stripe_fixed_fee),
                    "total_stripe_fees": float(total_stripe_fees),
                    "platform_cut": float(platform_fee_amount),
                    "creator_earnings": float(creator_amount)
                }
            }

        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    async def handle_webhook(self, payload: str, sig_header: str) -> Dict:
        """Handle Stripe webhooks for payment confirmations"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )

            event_type = event["type"]

            if event_type == "payment_intent.succeeded":
                await self._handle_payment_success(event["data"]["object"])
            elif event_type == "payment_intent.payment_failed":
                await self._handle_payment_failure(event["data"]["object"])
            elif event_type == "account.updated":
                await self._handle_account_update(event["data"]["object"])
            elif event_type == "application_fee.created":
                await self._handle_platform_fee_received(event["data"]["object"])

            return {"success": True, "event_type": event_type}

        except stripe.error.SignatureVerificationError:
            return {"success": False, "error": "Invalid webhook signature"}
        except Exception as e:
            logger.error(f"Webhook handling failed: {e}")
            return {"success": False, "error": str(e)}

    async def _handle_payment_success(self, payment_intent):
        """Handle successful payment webhook"""
        try:
            # Update database with successful payment
            from app.db.models.payments import PaymentTransaction

            session = next(get_session())

            # Check if transaction already recorded
            existing = session.query(PaymentTransaction).filter(
                PaymentTransaction.stripe_payment_intent_id == payment_intent["id"]
            ).first()

            if not existing:
                transaction = PaymentTransaction(
                    stripe_payment_intent_id=payment_intent["id"],
                    purchaser_id=payment_intent["metadata"]["purchaser_id"],
                    amount=Decimal(payment_intent["amount"]) / 100,
                    platform_fee=Decimal(payment_intent.get("application_fee_amount", 0)) / 100,
                    status="completed",
                    bundle_id=payment_intent["metadata"].get("bundle_id"),
                    content_id=payment_intent["metadata"].get("content_id"),
                    processed_at=datetime.now(timezone.utc)
                )
                session.add(transaction)
                session.commit()

                # Grant content access
                await self._grant_content_access(
                    payment_intent["metadata"]["purchaser_id"],
                    payment_intent["metadata"].get("bundle_id"),
                    payment_intent["metadata"].get("content_id")
                )

        except Exception as e:
            logger.error(f"Payment success handling failed: {e}")

    async def _grant_content_access(self, user_id: str, bundle_id: str = None, content_id: str = None):
        """Grant user access to purchased content"""
        try:
            from app.db.models.vault import VaultPurchase, VaultBundle

            session = next(get_session())

            if bundle_id:
                # Grant access to all content in bundle
                bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()
                if bundle:
                    for content_id in bundle.content_ids:
                        # Check if access already granted
                        existing_access = session.query(VaultPurchase).filter(
                            VaultPurchase.user_id == user_id,
                            VaultPurchase.content_id == content_id
                        ).first()

                        if not existing_access:
                            access = VaultPurchase(
                                user_id=user_id,
                                content_id=content_id,
                                amount=0,  # Part of bundle
                                status="completed",
                                purchased_at=datetime.now(timezone.utc)
                            )
                            session.add(access)

            elif content_id:
                # Grant access to individual content
                existing_access = session.query(VaultPurchase).filter(
                    VaultPurchase.user_id == user_id,
                    VaultPurchase.content_id == content_id
                ).first()

                if not existing_access:
                    access = VaultPurchase(
                        user_id=user_id,
                        content_id=content_id,
                        amount=0,  # Already paid via Stripe
                        status="completed",
                        purchased_at=datetime.now(timezone.utc)
                    )
                    session.add(access)

            session.commit()

        except Exception as e:
            logger.error(f"Content access granting failed: {e}")

    async def get_creator_earnings(self, creator_id: str, days: int = 30) -> Dict:
        """Get creator earnings summary"""
        try:
            from app.db.models.payments import PaymentTransaction
            from datetime import timedelta

            session = next(get_session())

            since_date = datetime.now(timezone.utc) - timedelta(days=days)

            transactions = session.query(PaymentTransaction).filter(
                PaymentTransaction.creator_id == creator_id,
                PaymentTransaction.processed_at >= since_date,
                PaymentTransaction.status == "completed"
            ).all()

            total_revenue = sum(t.amount for t in transactions)
            total_fees = sum(t.platform_fee for t in transactions)
            creator_earnings = total_revenue - total_fees

            return {
                "creator_id": creator_id,
                "period_days": days,
                "total_transactions": len(transactions),
                "total_revenue": float(total_revenue),
                "platform_fees": float(total_fees),
                "creator_earnings": float(creator_earnings),
                "platform_fee_percent": self.platform_fee_percent
            }

        except Exception as e:
            return {"error": str(e)}

    def calculate_customer_total(self, base_amount: Decimal) -> Dict:
        """Calculate what customer will pay including Stripe fees"""
        stripe_fee_percent = Decimal('0.029')  # 2.9%
        stripe_fixed_fee = Decimal('0.30')    # $0.30

        stripe_percentage_fee = base_amount * stripe_fee_percent
        total_stripe_fees = stripe_percentage_fee + stripe_fixed_fee
        customer_total = base_amount + total_stripe_fees

        platform_fee = base_amount * (Decimal(self.platform_fee_percent) / 100)
        creator_earnings = base_amount - platform_fee

        return {
            "base_amount": float(base_amount),
            "stripe_percentage_fee": float(stripe_percentage_fee),
            "stripe_fixed_fee": float(stripe_fixed_fee),
            "total_stripe_fees": float(total_stripe_fees),
            "customer_total": float(customer_total),
            "platform_fee": float(platform_fee),
            "creator_earnings": float(creator_earnings),
            "fee_explanation": f"You pay: ${customer_total:.2f} (${base_amount:.2f} + ${total_stripe_fees:.2f} processing fee)"
        }

    async def refund_payment(self, payment_intent_id: str, reason: str = "requested_by_customer") -> Dict:
        """Process refund for a payment"""
        try:
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                reason=reason,
                refund_application_fee=True  # Also refund platform fee
            )

            return {
                "success": True,
                "refund_id": refund.id,
                "status": refund.status,
                "amount": refund.amount / 100
            }

        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

# Global service instance
stripe_service = NovaOSStripeService()
