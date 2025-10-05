# NovaOS DNS Configuration Guide

Complete DNS setup for NovaOS ecosystem:

- **blackrosecollective.studio** (with novaos subdomain) at **159.223.15.214**
- **gypsy-cove.xyz** at **192.64.119.244**

## 🌐 Required DNS Records

Configure the following DNS records with your domain providers:

### blackrosecollective.studio

````
Type: A
Name: @
Value: 159.223.15.214
TTL: 300 (5 minutes)

Type: A
Name: www
Value: 159.223.15.214
TTL: 300 (5 minutes)

Type: A
Name: novaos
Value: 159.223.15.214
TTL: 300 (5 minutes)
```### gypsy-cove.xyz

````

Type: A
Name: @
Value: 192.64.119.244
TTL: 300 (5 minutes)

Type: A
Name: www
Value: 192.64.119.244
TTL: 300 (5 minutes)

```

### gypsy-cove.xyz

```

Type: A
Name: @
Value: 159.223.15.214
TTL: 300 (5 minutes)

Type: A
Name: www
Value: 159.223.15.214
TTL: 300 (5 minutes)

Type: CNAME (optional, for subdomains)
Name: academy
Value: gypsy-cove.xyz
TTL: 300 (5 minutes)

````

## 🔍 DNS Verification

After configuring DNS records, verify they are propagating correctly:

### Command Line Verification

```bash
# Check A records
dig +short blackrosecollective.studio
dig +short novaos.blackrosecollective.studio
dig +short gypsy-cove.xyz

# Check WWW records
dig +short www.blackrosecollective.studio
dig +short www.gypsy-cove.xyz

# Global DNS propagation check
nslookup blackrosecollective.studio 8.8.8.8
nslookup novaos.blackrosecollective.studio 8.8.8.8
nslookup gypsy-cove.xyz 8.8.8.8
````

### Online Verification Tools

- https://dnschecker.org
- https://whatsmydns.net
- https://www.dnswatch.info

## ⏱️ DNS Propagation Timeline

- **Local/ISP DNS**: 5-30 minutes
- **Global DNS**: 24-48 hours (maximum)
- **TTL Setting**: 300 seconds (5 minutes) for faster updates

## 🔧 Domain Provider Configuration

### Common DNS Providers

**Cloudflare:**

1. Login to Cloudflare dashboard
2. Select your domain
3. Go to DNS Records
4. Add A records as specified above
5. Set Proxy Status to "DNS Only" (gray cloud) initially

**Namecheap:**

1. Login to Namecheap account
2. Go to Domain List > Manage
3. Advanced DNS tab
4. Add A records as specified above

**GoDaddy:**

1. Login to GoDaddy account
2. My Products > DNS
3. Manage Zones
4. Add A records as specified above

**Route 53 (AWS):**

1. Open Route 53 console
2. Select Hosted Zone
3. Create Record Set
4. Add A records as specified above

## 🚨 Important Notes

1. **TTL Settings**: Use 300 seconds (5 minutes) during initial setup for faster propagation
2. **Wildcard Records**: Not recommended for security reasons
3. **IPv6 (AAAA)**: Add if your server has IPv6 address
4. **MX Records**: Only needed if using custom email
5. **TXT Records**: May be needed for domain verification

## 🧪 Testing After Configuration

Once DNS propagates (usually within 5-30 minutes):

```bash
# Test domain resolution
curl -I http://blackrosecollective.studio
curl -I http://novaos.blackrosecollective.studio
curl -I http://gypsy-cove.xyz

# Should redirect to HTTPS after deployment
curl -I https://blackrosecollective.studio
curl -I https://novaos.blackrosecollective.studio
curl -I https://gypsy-cove.xyz
```

## 🔄 Post-Deployment DNS Updates

After successful deployment with SSL:

1. **Increase TTL**: Change from 300 to 3600 (1 hour) for better performance
2. **Add CAA Records**: For SSL certificate security
3. **Add SPF/DMARC**: If using email services

### Example CAA Records (after SSL setup):

```
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
TTL: 3600

Type: CAA
Name: @
Value: 0 issuewild ";"
TTL: 3600
```

## ✅ DNS Configuration Checklist

- [ ] A record for blackrosecollective.studio → 159.223.15.214
- [ ] A record for www.blackrosecollective.studio → 159.223.15.214
- [ ] A record for novaos.blackrosecollective.studio → 159.223.15.214
- [ ] A record for gypsy-cove.xyz → 159.223.15.214
- [ ] A record for www.gypsy-cove.xyz → 159.223.15.214
- [ ] DNS propagation verified with dig/nslookup
- [ ] Online DNS checkers confirm global propagation
- [ ] HTTP requests return responses (after server deployment)

## 🎯 Next Steps

1. ✅ Configure DNS records as specified above
2. ⏳ Wait for DNS propagation (5-30 minutes)
3. 🚀 Run the deployment script on your server
4. 🔐 SSL certificates will be automatically generated
5. 🌐 Your NovaOS ecosystem will be live!

**DNS configuration complete - ready for production deployment!**
