# 🚀 NovaOS Digital Ocean Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **STEP 1: Generate Secure Credentials**

Run the security generator to create production passwords:

**Windows (PowerShell):**

```powershell
.\generate_production_secrets.ps1
```

**Linux/Mac:**

```bash
chmod +x generate_production_secrets.sh
./generate_production_secrets.sh
```

Copy the generated credentials and update `.env.production` file.

### ✅ **STEP 2: Configure Domains**

Make sure your domains point to your Digital Ocean droplet IP: `159.223.15.214`

**Required DNS Records:**

```
A     blackrosecollective.studio     159.223.15.214
A     www.blackrosecollective.studio 159.223.15.214
A     api.blackrosecollective.studio 159.223.15.214
A     echo.blackrosecollective.studio 159.223.15.214
A     novaos.tech                    159.223.15.214
A     www.novaos.tech               159.223.15.214
A     gypsy-cove.xyz                159.223.15.214
A     www.gypsy-cove.xyz            159.223.15.214
```

### ✅ **STEP 3: Stripe Production Setup**

1. Switch Stripe to **Live Mode** in dashboard
2. Get live API keys (`sk_live_` and `pk_live_`)
3. Update `.env.production` with live keys
4. Configure webhook endpoint: `https://api.blackrosecollective.studio/payments/stripe/webhook`
5. Copy webhook signing secret to `.env.production`

### ✅ **STEP 4: SSH Access**

Ensure you have SSH access to your droplet:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
ssh-copy-id root@159.223.15.214
```

## 🚀 **DEPLOYMENT COMMANDS**

### **Windows (PowerShell):**

```powershell
# 1. Generate credentials
.\generate_production_secrets.ps1

# 2. Update .env.production with generated values

# 3. Deploy to Digital Ocean
.\deploy_to_digitalocean.ps1
```

### **Linux/Mac (Bash):**

```bash
# 1. Generate credentials
chmod +x generate_production_secrets.sh
./generate_production_secrets.sh

# 2. Update .env.production with generated values

# 3. Deploy to Digital Ocean
chmod +x deploy_to_digitalocean.sh
./deploy_to_digitalocean.sh
```

## 🔒 **Post-Deployment Security**

### **1. Verify SSL Certificates**

```bash
# Test SSL for all domains
curl -I https://blackrosecollective.studio
curl -I https://novaos.tech
curl -I https://gypsy-cove.xyz
curl -I https://api.blackrosecollective.studio
```

### **2. Test Services**

```bash
# Check service status
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml ps'

# View logs
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml logs -f'
```

### **3. Security Verification**

```bash
# Check firewall status
ssh root@159.223.15.214 'ufw status'

# Check open ports
ssh root@159.223.15.214 'ss -tulpn | grep LISTEN'

# Check fail2ban status
ssh root@159.223.15.214 'fail2ban-client status'
```

## 🌐 **Application URLs**

After successful deployment, your applications will be available at:

- **🌹 Black Rose Collective**: https://blackrosecollective.studio
- **🏛️ NovaOS Console**: https://novaos.tech
- **🏫 GypsyCove Academy**: https://gypsy-cove.xyz
- **🔌 Core API**: https://api.blackrosecollective.studio

## 🧪 **Testing Checklist**

### **Application Testing**

- [ ] Black Rose Collective loads and functions
- [ ] NovaOS Console loads and functions
- [ ] GypsyCove Academy loads and functions
- [ ] Core API responds to health checks
- [ ] User registration/login works
- [ ] Payment processing works (test mode first)

### **Security Testing**

- [ ] HTTPS enforced on all domains
- [ ] HSTS headers present
- [ ] CSRF protection working
- [ ] Rate limiting active
- [ ] No sensitive data in logs

### **Performance Testing**

- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] Redis caching working
- [ ] Docker containers stable

## 🆘 **Troubleshooting**

### **Services Won't Start**

```bash
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml logs'
```

### **SSL Certificate Issues**

```bash
ssh root@159.223.15.214 'certbot certificates'
ssh root@159.223.15.214 'nginx -t && nginx -s reload'
```

### **Database Connection Issues**

```bash
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml exec db psql -U nova -d nova_core'
```

### **Restart Everything**

```bash
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml down && docker-compose -f docker-compose.production.yml up -d'
```

## 📞 **Support Commands**

### **Monitor Resource Usage**

```bash
ssh root@159.223.15.214 'htop'
ssh root@159.223.15.214 'df -h'
ssh root@159.223.15.214 'free -m'
```

### **Check Service Health**

```bash
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml exec core-api curl http://localhost:8000/health'
```

### **Database Backup**

```bash
ssh root@159.223.15.214 'cd /opt/novaos && docker-compose -f docker-compose.production.yml exec db pg_dump -U nova nova_core > backup_$(date +%Y%m%d).sql'
```

---

## ⚡ **Quick Start**

If you've already configured everything and just want to deploy:

```powershell
# Windows PowerShell - One command deployment
.\deploy_to_digitalocean.ps1
```

```bash
# Linux/Mac - One command deployment
./deploy_to_digitalocean.sh
```

Your NovaOS Core Systems will be live in ~10-15 minutes! 🎉
