# NovaOS Stripe Testing Script (PowerShell)
# Run this after setting up your Stripe dashboard configuration

Write-Host "🚀 NovaOS Stripe Integration Test Suite" -ForegroundColor Green
Write-Host "======================================="

# Check if Stripe CLI is installed
$stripeCmd = Get-Command stripe -ErrorAction SilentlyContinue
if (-not $stripeCmd) {
    Write-Host "❌ Stripe CLI not found. Please install:" -ForegroundColor Red
    Write-Host "   https://stripe.com/docs/stripe-cli"
    exit 1
}

Write-Host "✅ Stripe CLI found" -ForegroundColor Green

# Login to Stripe (if not already logged in)
Write-Host ""
Write-Host "🔐 Logging into Stripe..." -ForegroundColor Cyan
stripe login

# Test webhook forwarding instructions
Write-Host ""
Write-Host "📡 Webhook Forwarding Setup" -ForegroundColor Yellow
Write-Host "Open a new PowerShell window and run this command:"
Write-Host "stripe listen --forward-to localhost:8760/payments/stripe/webhook" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host ""

# Test payment intent creation with application fee
Write-Host "💳 Testing payment creation with application fee..." -ForegroundColor Cyan
stripe payment_intents create `
    --amount=2603 `
    --currency=usd `
    --application-fee-amount=300 `
    --metadata[platform]="novaos_blackrose" `
    --metadata[purchase_type]="vault_bundle" `
    --metadata[bundle_id]="test_bundle_123"

Write-Host ""
Write-Host "📊 Testing webhook events..." -ForegroundColor Cyan

# Test webhook events
Write-Host "Testing payment_intent.succeeded event..."
stripe events create payment_intent.succeeded

Write-Host "Testing payment_intent.payment_failed event..."
stripe events create payment_intent.payment_failed

Write-Host "Testing application_fee.created event..."
stripe events create application_fee.created

Write-Host ""
Write-Host "🏗️ Testing Connect account creation..." -ForegroundColor Cyan

# Create a test Express account
stripe accounts create `
    --type=express `
    --country=US `
    --capabilities[card_payments][requested]=true `
    --capabilities[transfers][requested]=true

Write-Host ""
Write-Host "📈 Fee calculation examples:" -ForegroundColor Yellow

# Test different payment amounts
$amounts = @(500, 1000, 2500, 5000, 10000)
foreach ($amount in $amounts) {
    $stripeFee = [math]::Round($amount * 0.029 + 30, 2)
    $customerTotal = $amount + $stripeFee
    $platformFee = [math]::Round($amount * 0.12, 2)
    $creatorAmount = $amount - $platformFee

    $amountDollars = $amount / 100
    $customerTotalDollars = $customerTotal / 100
    $creatorAmountDollars = $creatorAmount / 100
    $platformFeeDollars = $platformFee / 100

    Write-Host "Amount: `$$($amountDollars.ToString('F2'))"
    Write-Host "  Customer pays: `$$($customerTotalDollars.ToString('F2'))" -ForegroundColor Green
    Write-Host "  Creator gets: `$$($creatorAmountDollars.ToString('F2'))" -ForegroundColor Blue
    Write-Host "  Platform gets: `$$($platformFeeDollars.ToString('F2'))" -ForegroundColor Magenta
    Write-Host ""
}

Write-Host "✅ Stripe testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure webhook endpoint in Stripe Dashboard"
Write-Host "2. Copy webhook signing secret to .env file"
Write-Host "3. Set up Connect platform settings"
Write-Host "4. Test the payment link: https://buy.stripe.com/test_fZucN53eP9cD9yG5N933W00"
Write-Host "5. Start your NovaOS API server:"
Write-Host "   cd services/core-api"
Write-Host "   python -m uvicorn app.main:app --host 0.0.0.0 --port 8760 --reload"
Write-Host "6. Run the NovaOS test script: python test_stripe_integration.py"
