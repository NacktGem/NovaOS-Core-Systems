# 🚀 Production Deployment Checklist

## Pre-Deployment Verification

### ✅ DNS Configuration

- [ ] `blackrosecollective.studio` A record → 159.223.15.214
- [ ] `www.blackrosecollective.studio` A record → 159.223.15.214
- [ ] `novaos.blackrosecollective.studio` A record → 159.223.15.214
- [ ] `api.blackrosecollective.studio` A record → 159.223.15.214
- [ ] `gypsy-cove.xyz` A record → 159.223.15.214
- [ ] `www.gypsy-cove.xyz` A record → 159.223.15.214

### ✅ Server Access

- [ ] SSH access to root@159.223.15.214 working
- [ ] Server has Ubuntu 20.04/22.04 installed
- [ ] Port 80 and 443 are open
- [ ] At least 2GB RAM available (4GB recommended)

### ✅ Files Ready for Upload

- [x] `nginx-novaos-production.conf` - Nginx configuration
- [x] `deploy-production.sh` - Deployment automation script
- [x] `.env.production` - Production environment variables
- [x] `nginx-security-headers.conf` - Security headers
- [x] Complete NovaOS project directory

## Deployment Execution

### Step 1: Upload Project

```bash
# From your local machine
scp -r /mnt/d/NovaOS-Core-Systems root@159.223.15.214:/opt/novaos
```

### Step 2: Execute Deployment

```bash
# SSH into server
ssh root@159.223.15.214

# Run deployment script
cd /opt/novaos
chmod +x deploy-production.sh
./deploy-production.sh --continue
```

### Step 3: Verify Services

```bash
# Check all services are running
pm2 status
systemctl status nginx
systemctl status postgresql
systemctl status redis

# Test SSL certificates
curl -I https://www.blackrosecollective.studio
curl -I https://novaos.blackrosecollective.studio
curl -I https://gypsy-cove.xyz
```

## Post-Deployment Testing

### ✅ Platform Accessibility

- [ ] **Black Rose Collective**: https://www.blackrosecollective.studio
- [ ] **NovaOS Console**: https://novaos.blackrosecollective.studio
- [ ] **GypsyCove Academy**: https://gypsy-cove.xyz
- [ ] **Core API**: https://api.blackrosecollective.studio/health

### ✅ SSL Certificate Validation

- [ ] All domains show valid SSL certificates
- [ ] HTTPS redirect working properly
- [ ] Security headers present in responses

### ✅ Service Health Checks

- [ ] PM2 shows all processes running
- [ ] No errors in application logs
- [ ] Database connections working
- [ ] Redis cache functioning

### ✅ Performance Validation

- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] No memory leaks in processes

## Monitoring Setup

### ✅ Basic Monitoring

- [ ] PM2 monitoring enabled (`pm2 monit`)
- [ ] Nginx access/error logs configured
- [ ] SSL certificate auto-renewal tested

### ✅ Optional Advanced Monitoring

- [ ] Server monitoring (Prometheus/Grafana)
- [ ] Application performance monitoring
- [ ] Log aggregation setup

## Security Hardening

### ✅ Immediate Security Tasks

- [ ] Change default passwords in `.env.production`
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSH key authentication enabled
- [ ] Regular security updates scheduled

### ✅ Application Security

- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Input validation working

## Maintenance Procedures

### Daily Checks

```bash
# Check service status
pm2 status

# Check system resources
htop
df -h
free -h
```

### Weekly Maintenance

```bash
# Update system packages
apt update && apt upgrade -y

# Check SSL certificate expiry
certbot certificates

# Review application logs
pm2 logs --lines 100
```

### Monthly Tasks

```bash
# Backup database
pg_dump nova_core > backup_$(date +%Y%m%d).sql

# Review security logs
grep -i "error\|fail\|denied" /var/log/auth.log

# Performance review
pm2 monit
```

## Troubleshooting Guide

### Common Issues

**Services not starting:**

```bash
# Check process status
pm2 logs
systemctl status nginx

# Restart services
pm2 restart all
systemctl restart nginx
```

**SSL certificate issues:**

```bash
# Test certificate renewal
certbot renew --dry-run

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/blackrosecollective.studio/cert.pem -text -noout
```

**Port conflicts:**

```bash
# Check what's using ports
ss -tuln | grep -E ":80|:443|:3000|:3001|:3002"

# Kill conflicting processes
sudo fuser -k 80/tcp
```

**Memory issues:**

```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart high-memory processes
pm2 restart [process-name]
```

## Rollback Procedure

If deployment fails:

1. **Stop services:**

```bash
pm2 stop all
systemctl stop nginx
```

2. **Restore previous configuration:**

```bash
# If you have backups
cp /opt/backup/nginx-config /etc/nginx/sites-available/novaos
systemctl start nginx
```

3. **Check logs for issues:**

```bash
pm2 logs
tail -f /var/log/nginx/error.log
```

## Success Criteria

Your deployment is successful when:

- [x] All three platforms load without errors
- [x] SSL certificates show as valid and trusted
- [x] API endpoints respond correctly
- [x] User authentication works across all platforms
- [x] Database connections are stable
- [x] No critical errors in application logs
- [x] Performance meets acceptable thresholds

## Next Steps After Successful Deployment

1. **Content Population**: Add initial content to each platform
2. **User Testing**: Invite beta users to test functionality
3. **Performance Optimization**: Monitor and optimize based on usage
4. **Backup Strategy**: Implement automated database backups
5. **Monitoring Enhancement**: Set up advanced monitoring tools
6. **SEO Optimization**: Configure meta tags and analytics
7. **Documentation Update**: Update user documentation with live URLs
