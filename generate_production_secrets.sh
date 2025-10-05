#!/bin/bash

# NovaOS Security Credentials Generator
# Run this script to generate secure passwords and tokens for production deployment

echo "🔐 Generating NovaOS Production Security Credentials"
echo "=================================================="

# Function to generate secure random strings
generate_password() {
    openssl rand -base64 $1 | tr -d "=+/" | cut -c1-$1
}

generate_hex() {
    openssl rand -hex $1 | cut -c1-$(($1*2))
}

echo ""
echo "📋 Generated Credentials (SAVE THESE SECURELY):"
echo "================================================"

# Database credentials
POSTGRES_PASSWORD=$(generate_password 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# Redis credentials
REDIS_PASSWORD=$(generate_password 24)
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

# Auth and JWT secrets
AUTH_PEPPER=$(generate_hex 32)
echo "AUTH_PEPPER=$AUTH_PEPPER"

# Agent tokens (64 characters)
AGENT_SHARED_TOKEN=$(generate_password 64)
echo "AGENT_SHARED_TOKEN=$AGENT_SHARED_TOKEN"

INTERNAL_TOKEN=$(generate_password 64)
echo "INTERNAL_TOKEN=$INTERNAL_TOKEN"

NOVA_AGENT_TOKEN=$(generate_password 48)
echo "NOVA_AGENT_TOKEN=$NOVA_AGENT_TOKEN"

# Unlock password
UNLOCK_PASSWORD=$(generate_password 32)
echo "UNLOCK_PASSWORD=$UNLOCK_PASSWORD"

# Stripe webhook secret placeholder
echo "STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE"

echo ""
echo "🔑 Additional Security Setup:"
echo "============================"

# Generate JWT RSA keys
echo "Generating RSA key pair for JWT..."
mkdir -p keys
openssl genrsa -out keys/jwt_private.pem 2048
openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem

echo "✅ RSA key pair generated in ./keys/"

echo ""
echo "📝 Copy these credentials to your .env.production file"
echo "⚠️  Keep these credentials secure - never commit to Git!"
echo ""
echo "🚀 Next steps:"
echo "1. Copy the generated values to .env.production"
echo "2. Update Stripe webhook secret from dashboard"
echo "3. Run the deployment script"
