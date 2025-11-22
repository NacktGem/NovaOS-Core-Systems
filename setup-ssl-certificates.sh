#!/bin/bash
# NovaOS SSL Certificate Setup Script
# Sets up Let's Encrypt certificates for all three domains

set -e

echo "🔐 Setting up SSL certificates for NovaOS domains..."

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Stop Nginx temporarily
sudo systemctl stop nginx

# Generate certificates for all domains
echo "📜 Generating wildcard SSL certificate for blackrosecollective.studio..."
sudo certbot certonly --standalone \
    -d blackrosecollective.studio \
    -d www.blackrosecollective.studio \
    -d novaos.blackrosecollective.studio \
    --email admin@blackrosecollective.studio \
    --agree-tos \
    --non-interactive

# Note: gypsy-cove.xyz is on separate server (192.64.119.244)
echo "ℹ️  Note: gypsy-cove.xyz is managed separately on 192.64.119.244"

# Copy Nginx configuration
sudo cp nginx-novaos-production.conf /etc/nginx/sites-available/novaos
sudo ln -sf /etc/nginx/sites-available/novaos /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✅ SSL certificates installed successfully!"
echo "   • blackrosecollective.studio: HTTPS ready"
echo "   • novaos.blackrosecollective.studio: HTTPS ready"
echo "   • gypsy-cove.xyz: HTTPS ready"
echo ""
echo "🔄 Auto-renewal configured via systemd timer"
