# 🌐 NovaOS Multi-Platform Production Deployment Guide

## Prerequisites

- DigitalOcean droplet at **159.223.15.214** with Ubuntu 20.04/22.04
- Root or sudo access to the server
- DNS records properly configured (as shown in your screenshots)

## Quick Deployment Steps

### 1. Upload Files to Server

```bash
# On your local machine, upload the project to your server
scp -r /mnt/d/NovaOS-Core-Systems root@159.223.15.214:/opt/novaos
```

### 2. SSH into Your Server

```bash
ssh root@159.223.15.214
```

### 3. Run Deployment Script

```bash
cd /opt/novaos
chmod +x deploy-production.sh
./deploy-production.sh --continue
```

## Manual Alternative Setup

If you prefer manual setup:

### 1. Install Dependencies

```bash
apt update && apt upgrade -y
apt install -y curl wget git nodejs npm python3 python3-pip python3-venv nginx certbot python3-certbot-nginx redis-server postgresql postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2 pnpm
```

### 2. Setup SSL Certificates

```bash
# Stop nginx temporarily
systemctl stop nginx

# Get SSL certificates
certbot certonly --standalone -d blackrosecollective.studio -d www.blackrosecollective.studio -d novaos.blackrosecollective.studio -d api.blackrosecollective.studio --email admin@blackrosecollective.studio --agree-tos --non-interactive

certbot certonly --standalone -d gypsy-cove.xyz -d www.gypsy-cove.xyz --email admin@gypsy-cove.xyz --agree-tos --non-interactive
```

### 3. Configure Nginx

```bash
cd /opt/novaos
cp nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Update SSL paths in nginx config
sed -i "s|/etc/ssl/certs/blackrosecollective.studio.crt|/etc/letsencrypt/live/blackrosecollective.studio/fullchain.pem|g" nginx-novaos-production.conf
sed -i "s|/etc/ssl/private/blackrosecollective.studio.key|/etc/letsencrypt/live/blackrosecollective.studio/privkey.pem|g" nginx-novaos-production.conf
sed -i "s|/etc/ssl/certs/gypsy-cove.xyz.crt|/etc/letsencrypt/live/gypsy-cove.xyz/fullchain.pem|g" nginx-novaos-production.conf
sed -i "s|/etc/ssl/private/gypsy-cove.xyz.key|/etc/letsencrypt/live/gypsy-cove.xyz/privkey.pem|g" nginx-novaos-production.conf

cp nginx-novaos-production.conf /etc/nginx/sites-available/novaos
ln -sf /etc/nginx/sites-available/novaos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl start nginx
systemctl enable nginx
```

### 4. Setup Database

```bash
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres createdb nova_core
sudo -u postgres psql -c "CREATE USER nova WITH ENCRYPTED PASSWORD 'nova_secure_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nova_core TO nova;"
```

### 5. Install Project Dependencies

```bash
cd /opt/novaos
python3 -m venv .venv
source .venv/bin/activate
pip install uvicorn fastapi psycopg[binary] openai anthropic redis

pnpm install --frozen-lockfile
```

### 6. Build Applications

```bash
cd apps/novaos && npm run build && cd ../..
cd apps/web-shell && npm run build && cd ../..
cd apps/gypsy-cove && npm run build && cd ../..
```

### 7. Start Services with PM2

```bash
# Create PM2 ecosystem file (or use the one provided)
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 8. Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Domain Configuration

Your platforms will be available at:

- **Black Rose Collective**: https://www.blackrosecollective.studio
- **NovaOS Console**: https://novaos.blackrosecollective.studio
- **GypsyCove Academy**: https://gypsy-cove.xyz
- **Core API**: https://api.blackrosecollective.studio

## Monitoring & Maintenance

### Check Service Status

```bash
pm2 status
systemctl status nginx
systemctl status postgresql
systemctl status redis
```

### View Logs

```bash
pm2 logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### SSL Certificate Renewal

```bash
# Auto-renewal is configured, but you can test with:
certbot renew --dry-run
```

### Restart Services

```bash
pm2 restart all
systemctl restart nginx
```

## Security Considerations

1. **Change default passwords** in `.env.production`
2. **Configure backup strategy** for PostgreSQL
3. **Set up monitoring** (Prometheus/Grafana recommended)
4. **Configure log rotation**
5. **Regular security updates**

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 3002, 8760+ are available
2. **SSL certificate issues**: Check domain DNS propagation
3. **Permission errors**: Ensure proper file ownership
4. **Memory issues**: Monitor with `htop`, consider upgrading droplet

### Useful Commands

```bash
# Check what's running on specific ports
ss -tuln | grep -E ":80|:443|:3000|:3001|:3002"

# Check SSL certificate status
certbot certificates

# Nginx configuration test
nginx -t

# PM2 process monitoring
pm2 monit
```
