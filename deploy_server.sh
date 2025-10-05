#!/bin/bash
# NovaOS Production Deployment Script for Digital Ocean Server
# Run this script on the server: bash deploy_server.sh

set -e

echo "🚀 Starting NovaOS Production Deployment on Digital Ocean"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ docker-compose.production.yml not found. Are you in the right directory?"
    exit 1
fi

echo "📍 Current directory: $(pwd)"
echo "📋 Git status:"
git status --short

echo ""
echo "🔄 Updating repository..."
git fetch origin
git checkout merged-main-20250913013649
git pull origin merged-main-20250913013649

echo ""
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

echo ""
echo "⏳ Waiting for containers to start..."
sleep 30

echo ""
echo "🔍 Checking container status..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🌐 Testing endpoints..."
curl -f http://localhost:8760/api/health || echo "❌ Core API not responding"
curl -f http://localhost:3000 || echo "❌ Web Shell not responding"
curl -f http://localhost:3001 || echo "❌ GypsyCove not responding"
curl -f http://localhost:3002 || echo "❌ NovaOS Console not responding"

echo ""
echo "📊 Container logs (last 10 lines each):"
echo "--- Core API ---"
docker-compose -f docker-compose.production.yml logs --tail=10 core-api

echo "--- Web Shell ---"
docker-compose -f docker-compose.production.yml logs --tail=10 web-shell

echo "--- GypsyCove ---"
docker-compose -f docker-compose.production.yml logs --tail=10 gypsy-cove

echo "--- NovaOS ---"
docker-compose -f docker-compose.production.yml logs --tail=10 novaos

echo ""
echo "🎉 Deployment completed!"
echo "📱 Access your applications:"
echo "   🌐 NovaOS Console: http://$(curl -s ifconfig.me):3002"
echo "   🌐 Black Rose: http://$(curl -s ifconfig.me):3000"
echo "   🌐 GypsyCove: http://$(curl -s ifconfig.me):3001"
echo "   🌐 API: http://$(curl -s ifconfig.me):8760"