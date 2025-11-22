#!/bin/bash
# Simple deployment script to be uploaded and run on the server

echo "🔄 Updating NovaOS repository on Digital Ocean server..."
cd /opt/novaos

echo "📥 Pulling latest changes..."
git pull origin merged-main-20250913013649

echo "🧹 Cleaning up Docker..."
docker-compose -f docker-compose.production.yml down
docker system prune -f

echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.production.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 30

echo "📊 Checking container status..."
docker-compose -f docker-compose.production.yml ps

echo "🌐 Testing endpoints..."
echo "Core API:" && curl -sI http://localhost:8760/api/health | head -1
echo "Web Shell:" && curl -sI http://localhost:3000 | head -1
echo "GypsyCove:" && curl -sI http://localhost:3001 | head -1
echo "NovaOS:" && curl -sI http://localhost:3002 | head -1

echo "🎉 Deployment script completed!"
