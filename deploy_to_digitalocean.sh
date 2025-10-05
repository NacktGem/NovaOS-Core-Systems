#!/bin/bash

# NovaOS Digital Ocean Deployment Script
# Deploys NovaOS Core Systems to Digital Ocean droplet at 159.223.15.214

set -e  # Exit on any error

DROPLET_IP="159.223.15.214"
DROPLET_USER="root"
PROJECT_NAME="NovaOS-Core-Systems"
DEPLOY_PATH="/opt/novaos"

echo "🚀 NovaOS Digital Ocean Deployment"
echo "=================================="
echo "Target: $DROPLET_USER@$DROPLET_IP"
echo "Deploy Path: $DEPLOY_PATH"
echo ""

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "❌ SSH key not found. Generate one first:"
    echo "   ssh-keygen -t rsa -b 4096 -C 'your_email@example.com'"
    echo "   ssh-copy-id $DROPLET_USER@$DROPLET_IP"
    exit 1
fi

echo "1️⃣ Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 $DROPLET_USER@$DROPLET_IP "echo 'SSH connection successful'"; then
    echo "❌ SSH connection failed. Make sure:"
    echo "   - Your SSH key is added to the droplet"
    echo "   - The droplet is running"
    echo "   - The IP address is correct"
    exit 1
fi

echo "✅ SSH connection successful"

echo ""
echo "2️⃣ Preparing local files for deployment..."

# Create a temporary deployment directory
TEMP_DIR="./deployment_temp"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy essential files
cp -r . $TEMP_DIR/
cd $TEMP_DIR

# Remove unnecessary files for deployment
rm -rf .git .gitignore node_modules .next build dist
rm -f *.log *.tmp production_credentials_TEMP.txt
rm -rf apps/*/node_modules apps/*/.next

# Ensure production environment file exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found. Run generate_production_secrets.ps1 first!"
    exit 1
fi

# Check if secrets are still placeholders
if grep -q "REPLACE_WITH_SECURE" .env.production; then
    echo "⚠️  WARNING: .env.production still contains REPLACE_WITH_SECURE placeholders"
    echo "   Run generate_production_secrets.ps1 and update .env.production first!"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

cd ..

echo "✅ Files prepared for deployment"

echo ""
echo "3️⃣ Transferring files to droplet..."

# Create deployment directory on droplet
ssh $DROPLET_USER@$DROPLET_IP "mkdir -p $DEPLOY_PATH"

# Transfer files
rsync -avz --progress \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='*.tmp' \
    $TEMP_DIR/ $DROPLET_USER@$DROPLET_IP:$DEPLOY_PATH/

echo "✅ Files transferred successfully"

echo ""
echo "4️⃣ Setting up server environment..."

ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
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
EOF

echo ""
echo "5️⃣ Installing SSL certificates..."

ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
set -e

# Install SSL certificates for all domains
certbot --nginx -d blackrosecollective.studio -d www.blackrosecollective.studio -d api.blackrosecollective.studio -d echo.blackrosecollective.studio
certbot --nginx -d novaos.tech -d www.novaos.tech
certbot --nginx -d gypsy-cove.xyz -d www.gypsy-cove.xyz

# Set up auto-renewal
crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -

echo "✅ SSL certificates installed"
EOF

echo ""
echo "6️⃣ Building and starting NovaOS services..."

ssh $DROPLET_USER@$DROPLET_IP << EOF
set -e

cd $DEPLOY_PATH

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
EOF

echo ""
echo "7️⃣ Running database migrations..."

ssh $DROPLET_USER@$DROPLET_IP << EOF
set -e

cd $DEPLOY_PATH

# Run database migrations
docker-compose -f docker-compose.production.yml exec -T core-api python -m alembic upgrade head

echo "✅ Database migrations completed"
EOF

echo ""
echo "8️⃣ Setting up monitoring and logging..."

ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
set -e

# Set up log rotation
cat > /etc/logrotate.d/novaos << 'LOGROTATE'
/opt/novaos/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 root root
}
LOGROTATE

# Create monitoring script
cat > /usr/local/bin/novaos-monitor.sh << 'MONITOR'
#!/bin/bash
cd /opt/novaos
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo "$(date): NovaOS services down, restarting..." >> /var/log/novaos-monitor.log
    docker-compose -f docker-compose.production.yml up -d
fi
MONITOR

chmod +x /usr/local/bin/novaos-monitor.sh

# Add to crontab for monitoring every 5 minutes
crontab -l 2>/dev/null | { cat; echo "*/5 * * * * /usr/local/bin/novaos-monitor.sh"; } | crontab -

echo "✅ Monitoring and logging configured"
EOF

# Clean up temporary files
rm -rf $TEMP_DIR

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "🌐 Your NovaOS deployment is now live at:"
echo "   • Black Rose Collective: https://blackrosecollective.studio"
echo "   • NovaOS Console: https://novaos.tech"
echo "   • GypsyCove Academy: https://gypsy-cove.xyz"
echo "   • Core API: https://api.blackrosecollective.studio"
echo ""
echo "📋 Post-deployment checklist:"
echo "1. ✅ Test all three applications"
echo "2. ✅ Verify SSL certificates are working"
echo "3. ✅ Test payment processing with Stripe"
echo "4. ✅ Check all services are running: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml ps'"
echo "5. ✅ Monitor logs: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml logs -f'"
echo ""
echo "⚠️  IMPORTANT SECURITY REMINDERS:"
echo "• Change all default passwords in .env.production"
echo "• Update Stripe to live API keys"
echo "• Configure proper email SMTP settings"
echo "• Test backup procedures"
echo ""
echo "🔧 Useful commands:"
echo "• Check status: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml ps'"
echo "• View logs: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml logs -f'"
echo "• Restart services: ssh $DROPLET_USER@$DROPLET_IP 'cd $DEPLOY_PATH && docker-compose -f docker-compose.production.yml restart'"
