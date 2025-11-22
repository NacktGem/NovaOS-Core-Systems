# NovaOS Quick Deploy Script (PowerShell)
# Optimized for fast deployment to Digital Ocean

param(
    [string]$DropletIP = "159.223.15.214",
    [string]$DropletUser = "root"
)

$ErrorActionPreference = "Stop"

Write-Host "⚡ NovaOS FAST Deploy to $DropletIP" -ForegroundColor Yellow
Write-Host "========================================"

# 1. Quick SSH test
Write-Host "🔍 Testing connection..." -ForegroundColor Cyan
ssh -o ConnectTimeout=5 "${DropletUser}@${DropletIP}" "echo 'Connected'" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH failed. Check your connection." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Connected" -ForegroundColor Green

# 2. Transfer ONLY essential files (not the whole repo)
Write-Host "📦 Transferring essential files..." -ForegroundColor Cyan

$essentialFiles = @(
    "docker-compose.production.yml",
    ".env.production",
    "nginx-novaos-production.conf",
    "DEPLOY.md"
)

# Create temp directory on server
ssh "${DropletUser}@${DropletIP}" "mkdir -p /opt/novaos"

# Transfer essential files only
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "  → $file"
        scp $file "${DropletUser}@${DropletIP}:/opt/novaos/"
    }
}

# 3. Quick server check and setup
Write-Host "🔧 Quick server setup..." -ForegroundColor Cyan

$quickSetup = @'
# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker ready"
'@

ssh "${DropletUser}@${DropletIP}" $quickSetup

# 4. Start services (will pull images automatically)
Write-Host "🚀 Starting NovaOS services..." -ForegroundColor Cyan

$startServices = @'
cd /opt/novaos

# Start services (Docker will pull images as needed)
docker-compose -f docker-compose.production.yml pull --quiet
docker-compose -f docker-compose.production.yml up -d

# Check if services are starting
sleep 10
docker-compose -f docker-compose.production.yml ps

echo "✅ Services starting up"
'@

ssh "${DropletUser}@${DropletIP}" $startServices

Write-Host ""
Write-Host "🎉 Quick deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Yellow
ssh "${DropletUser}@${DropletIP}" "cd /opt/novaos && docker-compose -f docker-compose.production.yml ps --format table"

Write-Host ""
Write-Host "🌐 Your applications will be available at:" -ForegroundColor Cyan
Write-Host "   • Black Rose: http://$DropletIP:3000"
Write-Host "   • NovaOS: http://$DropletIP:3002"
Write-Host "   • Gypsy Cove: http://$DropletIP:3001"
Write-Host "   • Core API: http://$DropletIP:8760"

Write-Host ""
Write-Host "⚠️ Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure SSL certificates"
Write-Host "   2. Set up domain names"
Write-Host "   3. Configure Stripe live mode"

Write-Host ""
Write-Host "🔍 To check logs:"
Write-Host "   ssh ${DropletUser}@${DropletIP}"
Write-Host "   cd /opt/novaos"
Write-Host "   docker-compose -f docker-compose.production.yml logs -f"
