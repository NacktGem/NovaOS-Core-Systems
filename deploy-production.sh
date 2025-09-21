#!/bin/bash
# NovaOS Production Deployment Script
# For DigitalOcean droplet at 159.223.15.214

set -e

echo "🚀 Starting NovaOS Multi-Platform Production Deployment"
echo "========================================================"

# Variables
DOMAIN_PRIMARY="blackrosecollective.studio"
DOMAIN_GYPSYCOVE="gypsy-cove.xyz"
SERVER_IP="159.223.15.214"
PROJECT_DIR="/opt/novaos"
NGINX_CONF_DIR="/etc/nginx/sites-available"
SSL_DIR="/etc/ssl/certs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git nodejs npm python3 python3-pip python3-venv nginx certbot python3-certbot-nginx redis-server postgresql postgresql-contrib
}

# Install Node.js 18+ if needed
install_nodejs() {
    log "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g pm2 pnpm
}

# Setup project directory
setup_project() {
    log "Setting up project directory at $PROJECT_DIR..."

    if [ -d "$PROJECT_DIR" ]; then
        warning "Project directory already exists. Backing up..."
        mv "$PROJECT_DIR" "${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi

    mkdir -p "$PROJECT_DIR"

    # Clone or copy your repository
    log "Please upload your NovaOS-Core-Systems files to $PROJECT_DIR"
    log "Or clone from your repository:"
    log "  git clone <your-repo-url> $PROJECT_DIR"
}

# Setup Python environment
setup_python_env() {
    log "Setting up Python virtual environment..."
    cd "$PROJECT_DIR"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements-dev.txt || warning "No requirements-dev.txt found"
    pip install uvicorn fastapi psycopg[binary] openai anthropic redis
}

# Setup Node.js dependencies
setup_node_deps() {
    log "Installing Node.js dependencies..."
    cd "$PROJECT_DIR"
    pnpm install --frozen-lockfile
}

# Build Next.js applications
build_apps() {
    log "Building Next.js applications..."
    cd "$PROJECT_DIR"

    # Build NovaOS Console
    log "Building NovaOS Console..."
    cd apps/novaos
    npm run build
    cd ../..

    # Build Black Rose Collective
    log "Building Black Rose Collective..."
    cd apps/web-shell
    npm run build
    cd ../..

    # Build GypsyCove Academy
    log "Building GypsyCove Academy..."
    cd apps/gypsy-cove
    npm run build
    cd ../..
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates with Let's Encrypt..."

    # Stop nginx temporarily
    systemctl stop nginx

    # Get certificates for blackrosecollective.studio and subdomains
    certbot certonly --standalone -d $DOMAIN_PRIMARY -d www.$DOMAIN_PRIMARY -d novaos.$DOMAIN_PRIMARY -d api.$DOMAIN_PRIMARY --email admin@$DOMAIN_PRIMARY --agree-tos --non-interactive

    # Get certificate for gypsy-cove.xyz
    certbot certonly --standalone -d $DOMAIN_GYPSYCOVE -d www.$DOMAIN_GYPSYCOVE --email admin@$DOMAIN_GYPSYCOVE --agree-tos --non-interactive

    log "SSL certificates obtained successfully"
}

# Configure Nginx
setup_nginx() {
    log "Configuring Nginx..."

    # Copy security headers
    cp nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf

    # Update Nginx config with correct SSL paths
    sed -i "s|/etc/ssl/certs/blackrosecollective.studio.crt|/etc/letsencrypt/live/$DOMAIN_PRIMARY/fullchain.pem|g" nginx-novaos-production.conf
    sed -i "s|/etc/ssl/private/blackrosecollective.studio.key|/etc/letsencrypt/live/$DOMAIN_PRIMARY/privkey.pem|g" nginx-novaos-production.conf
    sed -i "s|/etc/ssl/certs/gypsy-cove.xyz.crt|/etc/letsencrypt/live/$DOMAIN_GYPSYCOVE/fullchain.pem|g" nginx-novaos-production.conf
    sed -i "s|/etc/ssl/private/gypsy-cove.xyz.key|/etc/letsencrypt/live/$DOMAIN_GYPSYCOVE/privkey.pem|g" nginx-novaos-production.conf

    # Copy Nginx configuration
    cp nginx-novaos-production.conf $NGINX_CONF_DIR/novaos
    ln -sf $NGINX_CONF_DIR/novaos /etc/nginx/sites-enabled/

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx configuration
    nginx -t

    log "Nginx configured successfully"
}

# Setup PM2 ecosystem
setup_pm2() {
    log "Setting up PM2 process manager..."

    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'core-api',
      script: '.venv/bin/python',
      args: '-m uvicorn services.core-api.app.main:app --host 0.0.0.0 --port 8760',
      cwd: '$PROJECT_DIR',
      env: {
        PYTHONPATH: '$PROJECT_DIR',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'novaos-console',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR/apps/novaos',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'blackrose-app',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR/apps/web-shell',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'gypsycove-app',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR/apps/gypsy-cove',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'lyra-agent',
      script: '.venv/bin/python',
      args: '-m uvicorn services.lyra.app.main:app --host 0.0.0.0 --port 8001',
      cwd: '$PROJECT_DIR',
      env: {
        PYTHONPATH: '$PROJECT_DIR'
      }
    },
    {
      name: 'velora-agent',
      script: '.venv/bin/python',
      args: '-m uvicorn services.velora.app.main:app --host 0.0.0.0 --port 8002',
      cwd: '$PROJECT_DIR',
      env: {
        PYTHONPATH: '$PROJECT_DIR'
      }
    }
  ]
};
EOF

    pm2 start ecosystem.config.js
    pm2 startup
    pm2 save
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw --force enable
}

# Setup database
setup_database() {
    log "Setting up PostgreSQL database..."
    systemctl start postgresql
    systemctl enable postgresql

    # Create database and user
    sudo -u postgres createdb nova_core 2>/dev/null || log "Database nova_core already exists"
    sudo -u postgres psql -c "CREATE USER nova WITH ENCRYPTED PASSWORD 'nova_secure_pass';" 2>/dev/null || log "User nova already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nova_core TO nova;" 2>/dev/null || log "Privileges already granted"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."

    check_permissions
    update_system
    install_nodejs
    setup_project

    log "⚠️  MANUAL STEP REQUIRED ⚠️"
    log "Please upload your NovaOS-Core-Systems files to $PROJECT_DIR"
    log "Then run this script again with --continue flag"

    if [[ "$1" == "--continue" ]]; then
        cd "$PROJECT_DIR"
        setup_python_env
        setup_node_deps
        build_apps
        setup_database
        setup_ssl
        setup_nginx
        setup_pm2
        setup_firewall

        systemctl start nginx
        systemctl enable nginx

        log "🎉 Deployment completed successfully!"
        log ""
        log "Your platforms should now be available at:"
        log "  📊 Black Rose Collective: https://www.$DOMAIN_PRIMARY"
        log "  🎛️  NovaOS Console: https://novaos.$DOMAIN_PRIMARY"
        log "  🎓 GypsyCove Academy: https://$DOMAIN_GYPSYCOVE"
        log "  🔧 Core API: https://api.$DOMAIN_PRIMARY"
        log ""
        log "To check status: pm2 status"
        log "To view logs: pm2 logs"
        log "To restart services: pm2 restart all"
    fi
}

# Run deployment
deploy "$@"
