#!/usr/bin/env python3
"""
NovaOS Infrastructure Deployment Script
Automates Digital Ocean and Cloudflare configuration for production deployment
"""

import os
import json
import requests
import time
import subprocess
from typing import Dict, List, Optional

class NovaOSDeployer:
    def __init__(self):
        self.do_token = "dop_v1_ecf810a9351d5601833cba637b452c36b5ef551fe4cb7bbd17c44f36201687b1"
        self.cf_token = "8c15c52beffd1bccfa19586c97ea9310c0fe4"
        self.droplet_ip = "159.223.15.214"
        self.domain = "novaos.love"
        self.subdomains = ["blackrose.novaos.love", "gypsycove.novaos.love", "api.novaos.love"]
        
        self.do_headers = {
            "Authorization": f"Bearer {self.do_token}",
            "Content-Type": "application/json"
        }
        
        self.cf_headers = {
            "Authorization": f"Bearer {self.cf_token}",
            "Content-Type": "application/json"
        }

    def check_do_droplet_status(self) -> Dict:
        """Check the status of the Digital Ocean droplet"""
        print("🔍 Checking Digital Ocean droplet status...")
        
        response = requests.get(
            "https://api.digitalocean.com/v2/droplets",
            headers=self.do_headers
        )
        
        if response.status_code == 200:
            droplets = response.json().get("droplets", [])
            for droplet in droplets:
                networks = droplet.get("networks", {})
                v4_networks = networks.get("v4", [])
                for network in v4_networks:
                    if network.get("ip_address") == self.droplet_ip:
                        print(f"✅ Found droplet: {droplet['name']} - Status: {droplet['status']}")
                        return droplet
        
        print("❌ Droplet not found or API error")
        return {}

    def get_cloudflare_zone_id(self) -> Optional[str]:
        """Get the Cloudflare zone ID for the domain"""
        print(f"🔍 Getting Cloudflare zone ID for {self.domain}...")
        
        response = requests.get(
            f"https://api.cloudflare.com/client/v4/zones?name={self.domain}",
            headers=self.cf_headers
        )
        
        if response.status_code == 200:
            zones = response.json().get("result", [])
            if zones:
                zone_id = zones[0]["id"]
                print(f"✅ Found zone ID: {zone_id}")
                return zone_id
        
        print("❌ Zone not found or API error")
        return None

    def create_dns_records(self, zone_id: str) -> bool:
        """Create DNS records for all domains and subdomains"""
        print("🌐 Creating DNS records...")
        
        records_to_create = [
            {"name": self.domain, "type": "A", "content": self.droplet_ip},
            {"name": "www", "type": "CNAME", "content": self.domain},
        ]
        
        # Add subdomain records
        for subdomain in self.subdomains:
            subdomain_name = subdomain.replace(f".{self.domain}", "")
            records_to_create.append({
                "name": subdomain_name,
                "type": "A", 
                "content": self.droplet_ip
            })
        
        success = True
        for record in records_to_create:
            response = requests.post(
                f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records",
                headers=self.cf_headers,
                json={
                    "type": record["type"],
                    "name": record["name"],
                    "content": record["content"],
                    "ttl": 1  # Auto TTL
                }
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Created DNS record: {record['name']} -> {record['content']}")
            else:
                result = response.json()
                if "already exists" in str(result):
                    print(f"ℹ️  DNS record already exists: {record['name']}")
                else:
                    print(f"❌ Failed to create DNS record: {record['name']} - {result}")
                    success = False
        
        return success

    def setup_firewall_rules(self) -> bool:
        """Configure Digital Ocean firewall rules"""
        print("🔥 Setting up firewall rules...")
        
        # Get existing firewalls
        response = requests.get(
            "https://api.digitalocean.com/v2/firewalls",
            headers=self.do_headers
        )
        
        if response.status_code != 200:
            print("❌ Failed to get existing firewalls")
            return False
        
        firewalls = response.json().get("firewalls", [])
        novaos_firewall = None
        
        for firewall in firewalls:
            if firewall["name"] == "novaos-production":
                novaos_firewall = firewall
                break
        
        if not novaos_firewall:
            # Create firewall
            firewall_data = {
                "name": "novaos-production",
                "inbound_rules": [
                    {
                        "protocol": "tcp",
                        "ports": "22",
                        "sources": {"addresses": ["0.0.0.0/0", "::/0"]}
                    },
                    {
                        "protocol": "tcp", 
                        "ports": "80",
                        "sources": {"addresses": ["0.0.0.0/0", "::/0"]}
                    },
                    {
                        "protocol": "tcp",
                        "ports": "443", 
                        "sources": {"addresses": ["0.0.0.0/0", "::/0"]}
                    },
                    {
                        "protocol": "tcp",
                        "ports": "3000-3002",
                        "sources": {"addresses": ["0.0.0.0/0", "::/0"]}
                    },
                    {
                        "protocol": "tcp",
                        "ports": "8760-8765",
                        "sources": {"addresses": ["0.0.0.0/0", "::/0"]}
                    }
                ],
                "outbound_rules": [
                    {
                        "protocol": "tcp",
                        "ports": "all",
                        "destinations": {"addresses": ["0.0.0.0/0", "::/0"]}
                    },
                    {
                        "protocol": "udp", 
                        "ports": "all",
                        "destinations": {"addresses": ["0.0.0.0/0", "::/0"]}
                    }
                ]
            }
            
            response = requests.post(
                "https://api.digitalocean.com/v2/firewalls",
                headers=self.do_headers,
                json=firewall_data
            )
            
            if response.status_code == 202:
                print("✅ Created firewall rules")
                return True
            else:
                print(f"❌ Failed to create firewall: {response.json()}")
                return False
        else:
            print("✅ Firewall already exists")
            return True

    def deploy_to_server(self) -> bool:
        """Deploy the latest code to the server"""
        print("🚀 Deploying to Digital Ocean server...")
        
        commands = [
            "cd /opt/novaos",
            "git fetch origin",
            "git checkout merged-main-20250913013649",
            "git pull origin merged-main-20250913013649",
            "docker-compose -f docker-compose.production.yml down",
            "docker system prune -f",
            "docker-compose -f docker-compose.production.yml up -d --build"
        ]
        
        for cmd in commands:
            print(f"Executing: {cmd}")
            result = subprocess.run([
                "ssh", "root@159.223.15.214", cmd
            ], capture_output=True, text=True)
            
            if result.returncode != 0 and "git checkout" not in cmd:
                print(f"❌ Command failed: {cmd}")
                print(f"Error: {result.stderr}")
                return False
            else:
                print(f"✅ Success: {cmd}")
        
        return True

    def verify_deployment(self) -> bool:
        """Verify that all services are running"""
        print("🔍 Verifying deployment...")
        
        endpoints = [
            f"http://{self.droplet_ip}:8760/api/health",
            f"http://{self.droplet_ip}:3000",
            f"http://{self.droplet_ip}:3001", 
            f"http://{self.droplet_ip}:3002"
        ]
        
        all_healthy = True
        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, timeout=10)
                if response.status_code in [200, 404]:  # 404 is OK for root paths
                    print(f"✅ {endpoint} - Status: {response.status_code}")
                else:
                    print(f"⚠️  {endpoint} - Status: {response.status_code}")
                    all_healthy = False
            except Exception as e:
                print(f"❌ {endpoint} - Error: {str(e)}")
                all_healthy = False
        
        return all_healthy

    def run_deployment(self) -> bool:
        """Run the complete deployment process"""
        print("🎯 Starting NovaOS Production Deployment")
        print("=" * 50)
        
        # Step 1: Check droplet status
        droplet = self.check_do_droplet_status()
        if not droplet:
            return False
        
        # Step 2: Set up firewall
        if not self.setup_firewall_rules():
            return False
        
        # Step 3: Configure DNS
        zone_id = self.get_cloudflare_zone_id()
        if zone_id:
            if not self.create_dns_records(zone_id):
                print("⚠️  DNS setup had issues, but continuing...")
        else:
            print("⚠️  Cloudflare DNS setup skipped")
        
        # Step 4: Deploy to server
        if not self.deploy_to_server():
            return False
        
        # Step 5: Verify deployment
        print("\n⏳ Waiting 30 seconds for services to start...")
        time.sleep(30)
        
        if self.verify_deployment():
            print("\n🎉 Deployment completed successfully!")
            print(f"🌐 NovaOS Console: http://{self.domain}:3002")
            print(f"🌐 Black Rose: http://blackrose.{self.domain}:3000")
            print(f"🌐 GypsyCove: http://gypsycove.{self.domain}:3001")
            print(f"🌐 API: http://api.{self.domain}:8760")
            return True
        else:
            print("\n⚠️  Deployment completed but some services may need attention")
            return False

if __name__ == "__main__":
    deployer = NovaOSDeployer()
    success = deployer.run_deployment()
    exit(0 if success else 1)