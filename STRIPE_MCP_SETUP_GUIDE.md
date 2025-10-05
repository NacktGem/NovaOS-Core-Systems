# 🎯 Stripe MCP Configuration for NovaOS Black Rose Collective

## ✅ Current Setup Status

Your Stripe account "**Black Rose Collective sandbox**" is properly configured with:

### Created Products:

1. **Vault Bundle Access** (`prod_TAuPaxMh8I3a3C`) - $25.00
   - Premium creator content bundle access
   - Price ID: `price_1SEYbEDlEmATiigC2i1lXdO4`

2. **Individual Content Access** (`prod_TAuPoR4tSCF1nl`) - $10.00
   - Single content piece access
   - Price ID: `price_1SEYbIDlEmATiigC4LmLWYEB`

3. **Creator Subscription** (`prod_TAuPpZ7Ya8vGmm`) - $9.99/month
   - Monthly recurring subscription
   - Price ID: `price_1SEYbMDlEmATiigC6hCM1XL0`

### Test Payment Link Created:

**Vault Bundle Test**: https://buy.stripe.com/test_fZucN53eP9cD9yG5N933W00

## 🚨 Required Stripe Dashboard Configuration

### 1. **Webhook Endpoint Setup**

Navigate to: **Developers → Webhooks**

**Create New Endpoint**:

- **URL**: `https://yourdomain.com/payments/stripe/webhook`
- **Events to Listen For**:
  ```
  payment_intent.succeeded
  payment_intent.payment_failed
  account.updated
  application_fee.created
  ```

**Copy the Webhook Signing Secret** and update your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

### 2. **Connect Platform Settings**

Navigate to: **Connect → Settings**

**Platform Information**:

- **Platform Name**: `NovaOS Black Rose Collective`
- **Platform Website**: `https://blackrose.novaos.com`
- **Support Email**: `support@novaos.com`
- **Platform Logo**: Upload your logo

**Express Dashboard Settings**:

- ✅ Enable Express accounts
- **Refresh URL**: `https://blackrose.novaos.com/creator/stripe/refresh`
- **Return URL**: `https://blackrose.novaos.com/creator/stripe/return`

### 3. **Application Fees Configuration**

Navigate to: **Connect → Settings → Application fees**

- ✅ **Enable application fees** (Critical for your 12% platform cut)
- Leave default fee blank (NovaOS sets this dynamically: 12% of base amount)

### 4. **Business Profile Setup**

Navigate to: **Settings → Business settings**

- **Business Type**: `Marketplace`
- **Industry**: `Digital Content Platform`
- **Website**: `https://novaos.com`
- **Product Description**: `Creator content marketplace platform`

## 💰 Your Fee Structure Implementation

### What Customers Pay:

```
$25 Vault Bundle:
• Base Price: $25.00
• Stripe Fees: $1.03 (2.9% + $0.30)
• Customer Total: $26.03
```

### Revenue Distribution:

```
From $25 Base Amount:
• Creator Gets: $22.00 (88%)
• Platform Gets: $3.00 (12%)
• Stripe Gets: $1.03 (processing, paid by customer)
```

## 🔧 Environment Variables Update

Update your `services/core-api/.env` file:

```env
NOVA_AGENT_TOKEN=changeme
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SEXRfDlEmATiigC2JPga7tVeTSWhHuLsDyOuRVHt22B0pO4y60empoAGr6v98Mp0G43OZiNMXTE7VzuTYXJP3k200pnFfBayt
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE

# Platform URLs for Connect onboarding
PLATFORM_BASE_URL=https://blackrose.novaos.com
STRIPE_CONNECT_REFRESH_URL=https://blackrose.novaos.com/creator/stripe/refresh
STRIPE_CONNECT_RETURN_URL=https://blackrose.novaos.com/creator/stripe/return

# Database URL
DATABASE_URL=postgresql://postgres:password@localhost:5432/nova
```

## 🧪 Testing Your Setup

### 1. Test the Payment Link

Visit: https://buy.stripe.com/test_fZucN53eP9cD9yG5N933W00

Use test card: `4242 4242 4242 4242`

- This will test the basic payment flow
- Check that application fees are collected properly

### 2. Test Your API Endpoints

```bash
# Start your API server
cd services/core-api
python -m uvicorn app.main:app --host 0.0.0.0 --port 8760 --reload

# Test fee calculation
curl -X POST http://localhost:8760/payments/calculate-total \
  -H "Content-Type: application/json" \
  -d '{"base_amount": 25.00}'
```

### 3. Webhook Testing

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:8760/payments/stripe/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## 🚀 Next Steps

### For Local Development:

1. ✅ Products created
2. ✅ Basic pricing configured
3. ⏳ **Set up webhook endpoint** (copy signing secret)
4. ⏳ **Configure Connect settings** in dashboard
5. ⏳ **Test payment flow** with test cards

### For Production:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get live API keys** (`sk_live_` and `pk_live_`)
3. **Update production webhook URL**
4. **Configure live Connect settings**
5. **Test with real payments**

## 🔍 Monitoring Your Setup

**Dashboard Sections to Monitor**:

- **Payments** → All transactions and fees
- **Connect** → Connected creator accounts
- **Application Fees** → Your platform revenue
- **Webhooks** → Event delivery status
- **Logs** → API request debugging

## ⚠️ Critical Success Factors

1. **Application Fees Must Be Enabled** - This is how you collect your 12%
2. **Webhook Signing Secret** - Must be configured for payment confirmations
3. **Connect Onboarding URLs** - Must match your actual domain
4. **Test Mode vs Live Mode** - Don't mix test and live keys

---

**Status**: ✅ **Stripe Products Created**
**Next**: Configure webhook endpoint and Connect settings in Stripe Dashboard
