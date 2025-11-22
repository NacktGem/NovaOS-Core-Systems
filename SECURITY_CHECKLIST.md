# NovaOS Production Security Checklist
Complete security configuration for deployment at 159.223.15.214

## ✅ PRE-DEPLOYMENT SECURITY

### 1. Environment Variables Security
- [ ] Replace all REPLACE_WITH_SECURE_* placeholders in .env.production
- [ ] Use 32+ character random passwords for database and Redis
- [ ] Generate unique JWT secrets and auth pepper
- [ ] Verify no sensitive data in Git repository

### 2. SSL/TLS Configuration
- [ ] Valid SSL certificates for all three domains
- [ ] TLS 1.2+ only, strong cipher suites configured
- [ ] HSTS headers enabled with preload
- [ ] SSL stapling configured

### 3. Network Security
- [ ] Firewall configured (UFW): only ports 22, 80, 443 open
- [ ] SSH key-based authentication only
- [ ] Fail2ban installed and configured
- [ ] Database and Redis only accessible internally

### 4. Application Security
- [ ] CORS configured with specific domain origins
- [ ] CSP headers configured for each application
- [ ] Rate limiting enabled for all endpoints
- [ ] CSRF protection enabled
- [ ] XSS protection headers enabled

## ✅ POST-DEPLOYMENT SECURITY

### 5. Monitoring & Logging
- [ ] Log rotation configured
- [ ] Failed login attempts monitoring
- [ ] Service health monitoring active
- [ ] Disk space monitoring active

### 6. Access Control
- [ ] GODMODE admin accounts secured
- [ ] Regular user access reviews
- [ ] API token rotation schedule
- [ ] Database access restricted

### 7. Backup & Recovery
- [ ] Automated database backups
- [ ] SSL certificate backup
- [ ] Configuration files backup
- [ ] Recovery procedures tested

### 8. Updates & Maintenance
- [ ] Automatic security updates enabled
- [ ] Docker image vulnerability scanning
- [ ] Dependency updates scheduled
- [ ] SSL certificate auto-renewal verified

## 🔐 SECURITY COMMANDS

### Generate secure passwords:
```bash
# Database password
openssl rand -base64 32

# Redis password
openssl rand -base64 24

# Auth pepper
openssl rand -hex 32

# Agent tokens
openssl rand -base64 48
```

### Security monitoring:
```bash
# Check for failed logins
sudo grep "Failed password" /var/log/auth.log | tail -10

# Check SSL certificate expiry
echo | openssl s_client -servername blackrosecollective.studio -connect blackrosecollective.studio:443 2>/dev/null | openssl x509 -noout -dates

# Check open ports
sudo ss -tulpn | grep LISTEN

# Check running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Security updates:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Restart services if needed
docker-compose -f docker-compose.production.yml restart
```

## 🚨 INCIDENT RESPONSE

### If compromise suspected:
1. Immediately rotate all passwords and tokens
2. Check logs for unauthorized access
3. Update all Docker images
4. Review user accounts and permissions
5. Consider temporary service shutdown if severe

### Emergency contacts:
- System Administrator: [ADD CONTACT]
- Security Team: [ADD CONTACT]
- Hosting Provider: Digital Ocean Support

## 📋 COMPLIANCE NOTES

### Data Protection:
- User data encrypted at rest (PostgreSQL)
- User data encrypted in transit (HTTPS/TLS)
- Session data stored securely (Redis with auth)
- Regular data backup procedures

### Access Logging:
- All authentication attempts logged
- API access logged with rate limiting
- Administrative actions audited
- Log retention: 30 days minimum

### Security Headers:
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: restrictive policies per app
- X-Frame-Options: DENY/SAMEORIGIN as appropriate
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

✅ Complete this checklist before going live with NovaOS production deployment.
