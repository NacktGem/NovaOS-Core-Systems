# NovaOS Security Credentials Generator (PowerShell)
# Run this script to generate secure passwords and tokens for production deployment

Write-Host "🔐 Generating NovaOS Production Security Credentials" -ForegroundColor Green
Write-Host "=================================================="

# Function to generate secure random strings
function Generate-SecurePassword {
    param([int]$Length)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes) -replace '[=+/]', '' | Select-Object -First $Length
}

function Generate-HexToken {
    param([int]$Length)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [BitConverter]::ToString($bytes) -replace '-', '' | Select-Object -First ($Length * 2)
}

Write-Host ""
Write-Host "📋 Generated Credentials (SAVE THESE SECURELY):" -ForegroundColor Yellow
Write-Host "================================================"

# Database credentials
$POSTGRES_PASSWORD = Generate-SecurePassword -Length 32
Write-Host "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"

# Redis credentials
$REDIS_PASSWORD = Generate-SecurePassword -Length 24
Write-Host "REDIS_PASSWORD=$REDIS_PASSWORD"

# Auth and JWT secrets
$AUTH_PEPPER = Generate-HexToken -Length 32
Write-Host "AUTH_PEPPER=$AUTH_PEPPER"

# Agent tokens (64 characters)
$AGENT_SHARED_TOKEN = Generate-SecurePassword -Length 64
Write-Host "AGENT_SHARED_TOKEN=$AGENT_SHARED_TOKEN"

$INTERNAL_TOKEN = Generate-SecurePassword -Length 64
Write-Host "INTERNAL_TOKEN=$INTERNAL_TOKEN"

$NOVA_AGENT_TOKEN = Generate-SecurePassword -Length 48
Write-Host "NOVA_AGENT_TOKEN=$NOVA_AGENT_TOKEN"

# Unlock password
$UNLOCK_PASSWORD = Generate-SecurePassword -Length 32
Write-Host "UNLOCK_PASSWORD=$UNLOCK_PASSWORD"

# Stripe webhook secret placeholder
Write-Host "STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE"

Write-Host ""
Write-Host "🔑 Additional Security Setup:" -ForegroundColor Cyan
Write-Host "============================"

# Generate JWT RSA keys
Write-Host "Generating RSA key pair for JWT..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "keys" | Out-Null

# Check if OpenSSL is available, otherwise provide manual instructions
try {
    & openssl genrsa -out keys/jwt_private.pem 2048 2>$null
    & openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem 2>$null
    Write-Host "✅ RSA key pair generated in ./keys/" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  OpenSSL not found. Generate RSA keys manually:" -ForegroundColor Yellow
    Write-Host "   Install OpenSSL or use online tool to generate RSA-2048 key pair"
    Write-Host "   Save private key as: keys/jwt_private.pem"
    Write-Host "   Save public key as: keys/jwt_public.pem"
}

Write-Host ""
Write-Host "📝 Copy these credentials to your .env.production file" -ForegroundColor Green
Write-Host "⚠️  Keep these credentials secure - never commit to Git!" -ForegroundColor Red
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the generated values to .env.production"
Write-Host "2. Update Stripe webhook secret from dashboard"
Write-Host "3. Run the deployment script"

# Save credentials to a temporary file for easy copying
$credentialsFile = "production_credentials_TEMP.txt"
@"
# NovaOS Production Credentials - Generated $(Get-Date)
# Copy these to .env.production and then DELETE this file

POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
AUTH_PEPPER=$AUTH_PEPPER
AGENT_SHARED_TOKEN=$AGENT_SHARED_TOKEN
INTERNAL_TOKEN=$INTERNAL_TOKEN
NOVA_AGENT_TOKEN=$NOVA_AGENT_TOKEN
UNLOCK_PASSWORD=$UNLOCK_PASSWORD
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET_HERE
"@ | Out-File -FilePath $credentialsFile -Encoding UTF8

Write-Host ""
Write-Host "💾 Credentials saved to: $credentialsFile" -ForegroundColor Magenta
Write-Host "   Copy contents to .env.production then DELETE this file!" -ForegroundColor Red
