#!/bin/bash
# NovaOS Production Deployment Script
# Deploys complete ecosystem to 159.223.15.214

set -e

echo "🚀 NovaOS Production Deployment Starting..."
echo "   Server: 159.223.15.214"
echo "   Domains: blackrosecollective.studio, novaos.blackrosecollective.studio"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on production server
if [[ "${1:-}" != "--force" ]] && [[ "$(curl -s ifconfig.me || echo 'unknown')" != "159.223.15.214" ]]; then
    print_warning "This script should be run on the production server (159.223.15.214)"
    print_warning "Use --force to override this check"
    exit 1
fi

# Check for required files
required_files=(".env.production" "docker-compose.production.yml" "nginx-novaos-production.conf" "keys/jwt_private.pem" "keys/jwt_public.pem")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_status "All required files present"

# Update system packages
print_status "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker and Docker Compose if not present
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    print_warning "Docker installed. You may need to log out and back in."
fi

if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt-get install -y nginx
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create necessary directories
print_status "Creating directories..."
sudo mkdir -p /var/log/novaos
sudo mkdir -p /opt/novaos/backups
sudo chown -R $USER:$USER /var/log/novaos /opt/novaos

# Stop any existing services
print_status "Stopping existing services..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Build and start services
print_status "Building and starting NovaOS services..."
docker-compose -f docker-compose.production.yml build --parallel
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
services=("nova-core-api-prod" "nova-echo-prod" "nova-web-shell-prod" "nova-novaos-prod" "nova-gypsy-cove-prod")
for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        print_status "$service is running"
    else
        print_error "$service failed to start"
        docker logs $service --tail 20
        exit 1
    fi
done

# Setup SSL certificates
print_status "Setting up SSL certificates..."
chmod +x setup-ssl-certificates.sh
./setup-ssl-certificates.sh

# Final health check
print_status "Performing final health checks..."

# Test internal services
curl -f http://localhost:9760/internal/healthz || {
    print_error "Core API health check failed"
    exit 1
}

curl -f http://localhost:9765/internal/healthz || {
    print_error "Echo WebSocket health check failed"
    exit 1
}

# Test applications
for port in 3000 3001 3002; do
    if curl -f http://localhost:$port/health 2>/dev/null; then
        print_status "App on port $port is healthy"
    else
        print_warning "App on port $port may not have health endpoint (this is okay)"
    fi
done

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/novaos > /dev/null <<EOF
/var/log/novaos/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        docker kill -s USR1 nova-core-api-prod nova-echo-prod 2>/dev/null || true
    endscript
}
EOF

# Setup monitoring
print_status "Setting up monitoring..."
cat > /opt/novaos/monitor.sh << 'EOF'
#!/bin/bash
# Simple monitoring script for NovaOS

check_service() {
    if docker ps --filter "name=$1" --filter "status=running" | grep -q $1; then
        echo "✅ $1 is running"
    else
        echo "❌ $1 is not running"
        docker restart $1
    fi
}

echo "NovaOS Service Check - $(date)"
check_service nova-postgres-prod
check_service nova-redis-prod
check_service nova-core-api-prod
check_service nova-echo-prod
check_service nova-web-shell-prod
check_service nova-novaos-prod
check_service nova-gypsy-cove-prod

# Check disk space
df -h | grep -E "/$|/var|/opt"
EOF

chmod +x /opt/novaos/monitor.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/novaos/monitor.sh >> /var/log/novaos/monitor.log 2>&1") | crontab -

print_status "✅ NovaOS Production Deployment Complete!"
echo ""
echo "🌐 Your domains are now live:"
echo "   • https://blackrosecollective.studio (Black Rose Collective)"
echo "   • https://novaos.blackrosecollective.studio (NovaOS Console)"
echo "   • https://gypsy-cove.xyz (GypsyCove Academy)"
echo ""
echo "🔧 Management commands:"
echo "   • View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   • Restart services: docker-compose -f docker-compose.production.yml restart"
echo "   • Update: git pull && docker-compose -f docker-compose.production.yml up -d --build"
echo "   • Monitor: /opt/novaos/monitor.sh"
echo ""
echo "🎉 NovaOS is ready for production use!"
