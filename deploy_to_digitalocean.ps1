# NovaOS Digital Ocean Deployment Script (PowerShell)
# Deploys NovaOS Core Systems to Digital Ocean droplet at 159.223.15.214

param(
    [string]$DropletIP = "159.223.15.214",
    [string]$DropletUser = "root",
    [string]$DeployPath = "/opt/novaos"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 NovaOS Digital Ocean Deployment" -ForegroundColor Green
Write-Host "=================================="
Write-Host "Target: $DropletUser@$DropletIP"
Write-Host "Deploy Path: $DeployPath"
Write-Host ""

# Check if required tools are available
$requiredTools = @("ssh", "scp")
foreach ($tool in $requiredTools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Required tool '$tool' not found. Please install:" -ForegroundColor Red
        Write-Host "   - Git for Windows (includes SSH)"
        Write-Host "   - OpenSSH Client (Windows Feature)"
        exit 1
    }
}

Write-Host "1️⃣ Testing SSH connection..." -ForegroundColor Cyan
try {
    $sshTest = ssh -o ConnectTimeout=10 "$DropletUser@$DropletIP" "echo 'SSH connection successful'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
}
catch {
    Write-Host "❌ SSH connection failed. Make sure:" -ForegroundColor Red
    Write-Host "   - Your SSH key is added to the droplet"
    Write-Host "   - The droplet is running"
    Write-Host "   - The IP address is correct"
    Write-Host "   Generate SSH key: ssh-keygen -t rsa -b 4096"
    Write-Host "   Copy to droplet: ssh-copy-id $DropletUser@$DropletIP"
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Preparing local files for deployment..." -ForegroundColor Cyan

# Create temporary deployment directory
$TempDir = "./deployment_temp"
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy essential files (excluding unnecessary ones)
Write-Host "Copying files to temporary directory..."
$excludePatterns = @(
    ".git", "node_modules", ".next", "build", "dist",
    "*.log", "*.tmp", "production_credentials_TEMP.txt"
)

# Use robocopy for efficient copying
robocopy . $TempDir /E /XD .git node_modules .next build dist /XF *.log *.tmp production_credentials_TEMP.txt /NP /NFL /NDL | Out-Null

# Check if production environment file exists
if (-not (Test-Path "$TempDir\.env.production")) {
    Write-Host "❌ .env.production not found. Run generate_production_secrets.ps1 first!" -ForegroundColor Red
    exit 1
}

# Check if secrets are still placeholders
$envContent = Get-Content "$TempDir\.env.production" -Raw
if ($envContent -match "REPLACE_WITH_SECURE") {
    Write-Host "⚠️  WARNING: .env.production still contains REPLACE_WITH_SECURE placeholders" -ForegroundColor Yellow
    Write-Host "   Run generate_production_secrets.ps1 and update .env.production first!"
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

Write-Host "✅ Files prepared for deployment" -ForegroundColor Green

Write-Host ""
Write-Host "3️⃣ Transferring files to droplet..." -ForegroundColor Cyan

# Create deployment directory on droplet
ssh "$DropletUser@$DropletIP" "mkdir -p $DeployPath"

# Transfer files using scp
Write-Host "Using scp for file transfer..."

# Create a compressed archive for faster transfer
$archivePath = "$env:TEMP\novaos-deployment.tar.gz"
tar -czf $archivePath -C $TempDir .

# Transfer the archive
scp $archivePath "$DropletUser@$DropletIP`:$DeployPath/novaos-deployment.tar.gz"

# Extract on the remote server
ssh "$DropletUser@$DropletIP" "cd $DeployPath && tar -xzf novaos-deployment.tar.gz && rm novaos-deployment.tar.gz"

# Clean up local archive
Remove-Item $archivePath -Force

Write-Host "✅ Files transferred successfully" -ForegroundColor Green

Write-Host ""
Write-Host "4️⃣ Setting up server environment..." -ForegroundColor Cyan

# Run server setup commands
$setupScript = @'
set -e

# Update system packages
apt update && apt upgrade -y

# Install required packages
apt install -y docker.io docker-compose ufw fail2ban nginx certbot python3-certbot-nginx

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Configure fail2ban
systemctl start fail2ban
systemctl enable fail2ban

echo "✅ Server environment configured"
'@

ssh "$DropletUser@$DropletIP" $setupScript

Write-Host ""
Write-Host "5️⃣ Building and starting NovaOS services..." -ForegroundColor Cyan

$deployScript = @"
set -e

cd $DeployPath

# Generate JWT keys if they don't exist
if [ ! -f keys/jwt_private.pem ]; then
    mkdir -p keys
    openssl genrsa -out keys/jwt_private.pem 2048
    openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem
    chmod 600 keys/jwt_private.pem
    chmod 644 keys/jwt_public.pem
    echo "✅ JWT keys generated"
fi

# Build and start services
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Wait for services to start
sleep 30

# Check service status
docker-compose -f docker-compose.production.yml ps

echo "✅ NovaOS services started"
"@

ssh "$DropletUser@$DropletIP" $deployScript

Write-Host ""
Write-Host "6️⃣ Running database migrations..." -ForegroundColor Cyan

$migrationScript = @"
set -e

cd $DeployPath

# Run database migrations
docker-compose -f docker-compose.production.yml exec -T core-api python -m alembic upgrade head

echo "✅ Database migrations completed"
"@

ssh "$DropletUser@$DropletIP" $migrationScript

# Clean up temporary files
Remove-Item -Recurse -Force $TempDir

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================="
Write-Host ""
Write-Host "🌐 Your NovaOS deployment is now live at:" -ForegroundColor Cyan
Write-Host "   • Black Rose Collective: https://blackrosecollective.studio"
Write-Host "   • NovaOS Console: https://novaos.tech"
Write-Host "   • GypsyCove Academy: https://gypsy-cove.xyz"
Write-Host "   • Core API: https://api.blackrosecollective.studio"
Write-Host ""
Write-Host "📋 Post-deployment checklist:" -ForegroundColor Yellow
Write-Host "1. ✅ Test all three applications"
Write-Host "2. ✅ Verify SSL certificates are working"
Write-Host "3. ✅ Test payment processing with Stripe"
Write-Host "4. ✅ Check all services are running"
Write-Host "5. ✅ Monitor logs"
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY REMINDERS:" -ForegroundColor Red
Write-Host "• Change all default passwords in .env.production"
Write-Host "• Update Stripe to live API keys"
Write-Host "• Configure SSL certificates for your domains"
Write-Host "• Configure proper email SMTP settings"
Write-Host "• Test backup procedures"
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "• Check status: ssh $DropletUser@$DropletIP 'cd $DeployPath && docker-compose -f docker-compose.production.yml ps'"
Write-Host "• View logs: ssh $DropletUser@$DropletIP 'cd $DeployPath && docker-compose -f docker-compose.production.yml logs -f'"
Write-Host "• Restart services: ssh $DropletUser@$DropletIP 'cd $DeployPath && docker-compose -f docker-compose.production.yml restart'"

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Magenta
Write-Host "1. Configure SSL certificates for your domains"
Write-Host "2. Update DNS records to point to $DropletIP"
Write-Host "3. Test all applications thoroughly"
Write-Host "4. Update Stripe to production mode"
