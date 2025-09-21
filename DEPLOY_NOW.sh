#!/bin/bash
# NovaOS One-Command Deployment
# Run this on your DigitalOcean server: bash <(curl -sL https://raw.githubusercontent.com/your-repo/deploy.sh)

# Or manually:
# 1. Upload project: scp -r /mnt/d/NovaOS-Core-Systems root@159.223.15.214:/opt/novaos
# 2. SSH: ssh root@159.223.15.214
# 3. Run: cd /opt/novaos && chmod +x deploy-production.sh && ./deploy-production.sh

echo "🚀 NovaOS Quick Deploy Guide"
echo "=============================="
echo ""
echo "Step 1: Upload your project to the server"
echo "scp -r /mnt/d/NovaOS-Core-Systems root@159.223.15.214:/opt/novaos"
echo ""
echo "Step 2: SSH into your server"
echo "ssh root@159.223.15.214"
echo ""
echo "Step 3: Run the deployment script"
echo "cd /opt/novaos"
echo "chmod +x deploy-production.sh"
echo "./deploy-production.sh"
echo ""
echo "Your platforms will be available at:"
echo "• Black Rose: https://www.blackrosecollective.studio"
echo "• NovaOS: https://novaos.blackrosecollective.studio"
echo "• GypsyCove: https://gypsy-cove.xyz"
echo "• API: https://api.blackrosecollective.studio"
