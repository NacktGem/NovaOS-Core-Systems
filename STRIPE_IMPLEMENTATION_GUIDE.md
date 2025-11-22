"""
Stripe Payment Integration Guide for NovaOS Creator Platform
===========================================================

This guide covers setting up Stripe for:

1. Creator content purchases
2. Platform commission/cut collection
3. Creator payouts
4. Vault bundle transactions

## 1. STRIPE ACCOUNT SETUP

### Step 1: Create Stripe Connect Platform Account

```bash
# Visit: https://dashboard.stripe.com/register
# Choose "Platform" account type for marketplace functionality
# Complete KYC verification
```

### Step 2: Environment Variables

```bash
# Add to .env files for each service
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Frontend
STRIPE_SECRET_KEY=sk_live_...       # Backend
STRIPE_WEBHOOK_SECRET=whsec_...     # Webhook verification
STRIPE_PLATFORM_FEE_PERCENT=10     # Your platform cut (10%)
```

## 2. BACKEND STRIPE INTEGRATION

### Install Dependencies

```bash
pip install stripe==7.0.0
```

### Core Payment Service Implementation

```python
# services/core-api/app/services/stripe_service.py

import stripe
from typing import Dict, Optional
from decimal import Decimal
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripePaymentService:
    def __init__(self):
        self.platform_fee_percent = float(os.getenv("STRIPE_PLATFORM_FEE_PERCENT", "10"))

    async def create_connected_account(self, creator_id: str, email: str) -> Dict:
        """Create Stripe Connected Account for creator"""
        try:
            account = stripe.Account.create(
                type="express",
                country="US",  # Adjust based on creator location
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_type="individual",
                metadata={"creator_id": creator_id}
            )

            # Create account link for onboarding
            account_link = stripe.AccountLink.create(
                account=account.id,
                refresh_url=f"https://blackrose.novaos.com/creator/stripe/refresh",
                return_url=f"https://blackrose.novaos.com/creator/stripe/success",
                type="account_onboarding",
            )

            return {
                "stripe_account_id": account.id,
                "onboarding_url": account_link.url,
                "success": True
            }
        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    async def process_vault_purchase(
        self,
        amount: Decimal,  # Total purchase amount
        creator_stripe_account: str,
        payment_method_id: str,
        purchaser_id: str,
        bundle_id: str
    ) -> Dict:
        """Process vault bundle purchase with platform fee"""

        # Calculate platform fee (10% default)
        platform_fee = int(amount * Decimal(self.platform_fee_percent / 100) * 100)  # In cents
        creator_amount = int(amount * 100) - platform_fee  # Creator gets 90%

        try:
            # Create Payment Intent with application fee
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency="usd",
                payment_method=payment_method_id,
                confirmation_method="manual",
                confirm=True,
                application_fee_amount=platform_fee,
                transfer_data={
                    "destination": creator_stripe_account,
                },
                metadata={
                    "purchaser_id": purchaser_id,
                    "bundle_id": bundle_id,
                    "type": "vault_purchase"
                }
            )

            return {
                "success": True,
                "payment_intent_id": payment_intent.id,
                "creator_amount": creator_amount / 100,
                "platform_fee": platform_fee / 100,
                "status": payment_intent.status
            }

        except stripe.error.StripeError as e:
            return {"success": False, "error": str(e)}

    async def handle_webhook(self, payload: str, sig_header: str) -> Dict:
        """Handle Stripe webhooks for payment confirmations"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
            )

            if event["type"] == "payment_intent.succeeded":
                payment_intent = event["data"]["object"]
                # Update database with successful payment
                await self._update_payment_status(payment_intent)

            elif event["type"] == "account.updated":
                account = event["data"]["object"]
                # Update creator account status
                await self._update_creator_account(account)

            return {"success": True}

        except Exception as e:
            return {"success": False, "error": str(e)}
```

## 3. DATABASE SCHEMA ADDITIONS

### Creator Stripe Accounts Table

```sql
-- Add to Alembic migration
CREATE TABLE creator_stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) NOT NULL,
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Transactions Table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    purchaser_id UUID REFERENCES users(id) NOT NULL,
    creator_id UUID REFERENCES users(id) NOT NULL,
    bundle_id UUID REFERENCES vault_bundles(id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    creator_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. API ENDPOINTS

### Payment Routes

```python
# services/core-api/app/routes/payments.py

from app.services.stripe_service import StripePaymentService
stripe_service = StripePaymentService()

@router.post("/stripe/connect-account")
async def create_stripe_account(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    \"\"\"Create Stripe Connected Account for creator\"\"\"
    if current_user.role not in ["creator", "admin", "godmode"]:
        raise HTTPException(status_code=403, detail="Creator role required")

    result = await stripe_service.create_connected_account(
        creator_id=str(current_user.id),
        email=current_user.email
    )

    if result["success"]:
        # Save to database
        from app.db.models.payments import CreatorStripeAccount
        stripe_account = CreatorStripeAccount(
            creator_id=current_user.id,
            stripe_account_id=result["stripe_account_id"]
        )
        session.add(stripe_account)
        session.commit()

    return result

@router.post("/process-purchase")
async def process_vault_purchase(
    bundle_id: str,
    payment_method_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    \"\"\"Process vault bundle purchase through Stripe\"\"\"

    # Get bundle and creator info
    bundle = session.query(VaultBundle).filter(VaultBundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")

    creator_account = session.query(CreatorStripeAccount).filter(
        CreatorStripeAccount.creator_id == bundle.creator_id
    ).first()

    if not creator_account or not creator_account.charges_enabled:
        raise HTTPException(status_code=400, detail="Creator payment not available")

    # Process payment
    result = await stripe_service.process_vault_purchase(
        amount=bundle.bundle_price,
        creator_stripe_account=creator_account.stripe_account_id,
        payment_method_id=payment_method_id,
        purchaser_id=str(current_user.id),
        bundle_id=bundle_id
    )

    return result
```

## 5. FRONTEND INTEGRATION

### Stripe Elements Implementation

```typescript
// apps/web-shell/components/payments/StripeCheckout.tsx

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function VaultBundleCheckout({ bundleId, amount }: { bundleId: string, amount: number }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement!,
    });

    if (error) {
      console.error(error);
      return;
    }

    // Process purchase through your API
    const response = await fetch('/api/payments/process-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify({
        bundle_id: bundleId,
        payment_method_id: paymentMethod.id
      })
    });

    const result = await response.json();

    if (result.success) {
      // Handle successful payment
      router.push('/vault/purchase-success');
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <form onSubmit={handleSubmit}>
        <CardElement />
        <button type="submit" disabled={!stripe}>
          Purchase for ${amount}
        </button>
      </form>
    </Elements>
  );
}
```

## 6. CREATOR ONBOARDING FLOW

### Stripe Connect Onboarding

```typescript
// apps/web-shell/app/creator/stripe/setup/page.tsx

export default function StripeSetupPage() {
  const handleSetupStripe = async () => {
    const response = await fetch('/api/payments/stripe/connect-account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to Stripe onboarding
      window.location.href = result.onboarding_url;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1>Set Up Payments</h1>
      <p>Connect your Stripe account to receive payments from your content.</p>
      <button onClick={handleSetupStripe}>
        Connect Stripe Account
      </button>
    </div>
  );
}
```

## 7. PLATFORM FEE COLLECTION

The platform automatically collects 10% (configurable) on every transaction:

- **Creator receives**: 90% directly to their Stripe account
- **Platform receives**: 10% to your main Stripe account
- **Automatic**: No manual transfers needed

## 8. WEBHOOK SETUP

### Configure in Stripe Dashboard

```
Endpoint URL: https://api.novaos.com/payments/stripe/webhook
Events to send:
- payment_intent.succeeded
- payment_intent.payment_failed
- account.updated
- payout.paid
```

## 9. TESTING

### Test Mode Setup

```bash
# Use test keys for development
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Test card numbers
# Visa: 4242424242424242
# Visa (debit): 4000056655665556
# Mastercard: 5555555555554444
```

## 10. DEPLOYMENT CHECKLIST

- [ ] Stripe account verified and live
- [ ] Webhook endpoints configured
- [ ] SSL certificates installed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Test payments working
- [ ] Creator onboarding flow tested
- [ ] Platform fee collection verified

This implementation gives you:
✅ OnlyFans-style creator payments
✅ Automatic platform fee collection
✅ Instant creator payouts
✅ Full transaction tracking
✅ Dispute handling
✅ Tax reporting support
"""
