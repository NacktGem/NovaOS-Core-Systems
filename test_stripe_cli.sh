#!/bin/bash

# NovaOS Stripe Testing Script
# Run this after setting up your Stripe dashboard configuration

echo "🚀 NovaOS Stripe Integration Test Suite"
echo "======================================="

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install:"
    echo "   https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo "✅ Stripe CLI found"

# Login to Stripe (if not already logged in)
echo ""
echo "🔐 Logging into Stripe..."
stripe login

# Test webhook forwarding
echo ""
echo "📡 Setting up webhook forwarding..."
echo "This will forward Stripe webhooks to your local NovaOS API"
echo "Keep this running in a separate terminal window"
echo ""
echo "Run this command:"
echo "stripe listen --forward-to localhost:8760/payments/stripe/webhook"
echo ""

# Test payment intent creation with application fee
echo "💳 Testing payment creation with application fee..."
stripe payment_intents create \
  --amount=2603 \
  --currency=usd \
  --application-fee-amount=300 \
  --metadata[platform]="novaos_blackrose" \
  --metadata[purchase_type]="vault_bundle" \
  --metadata[bundle_id]="test_bundle_123"

echo ""
echo "📊 Testing webhook events..."

# Test successful payment webhook
echo "Testing payment_intent.succeeded event..."
stripe events create payment_intent.succeeded

# Test failed payment webhook
echo "Testing payment_intent.payment_failed event..."
stripe events create payment_intent.payment_failed

# Test application fee created
echo "Testing application_fee.created event..."
stripe events create application_fee.created

echo ""
echo "🏗️ Testing Connect account creation..."

# Create a test Express account
stripe accounts create \
  --type=express \
  --country=US \
  --capabilities[card_payments][requested]=true \
  --capabilities[transfers][requested]=true

echo ""
echo "📈 Testing fee calculations..."

# Test different payment amounts
for amount in 500 1000 2500 5000 10000; do
    stripe_fee=$(echo "$amount * 0.029 + 30" | bc -l)
    customer_total=$(echo "$amount + $stripe_fee" | bc -l)
    platform_fee=$(echo "$amount * 0.12" | bc -l)
    creator_amount=$(echo "$amount - $platform_fee" | bc -l)

    echo "Amount: $$(($amount/100)).$(($amount%100))"
    echo "  Customer pays: $$(printf "%.2f" $(echo "$customer_total/100" | bc -l))"
    echo "  Creator gets: $$(printf "%.2f" $(echo "$creator_amount/100" | bc -l))"
    echo "  Platform gets: $$(printf "%.2f" $(echo "$platform_fee/100" | bc -l))"
    echo ""
done

echo "✅ Stripe testing complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure webhook endpoint in Stripe Dashboard"
echo "2. Copy webhook signing secret to .env file"
echo "3. Set up Connect platform settings"
echo "4. Test the payment link: https://buy.stripe.com/test_fZucN53eP9cD9yG5N933W00"
echo "5. Start your NovaOS API server"
echo "6. Run the NovaOS test script: python test_stripe_integration.py"
