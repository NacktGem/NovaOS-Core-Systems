#!/usr/bin/env pwsh
# Complete NovaOS Deployment Script

$SERVER = "159.223.15.214"
$TARGET_DIR = "/opt/novaos"

Write-Host "🚀 Starting Complete NovaOS Deployment" -ForegroundColor Green

# Essential files first
Write-Host "📁 Transferring configuration files..." -ForegroundColor Yellow
scp docker-compose.production.yml root@${SERVER}:${TARGET_DIR}/docker-compose.yml
scp .env.production root@${SERVER}:${TARGET_DIR}/.env
scp nginx-novaos-production.conf root@${SERVER}:${TARGET_DIR}/nginx.conf

# Core directories
Write-Host "📦 Transferring core application code..." -ForegroundColor Yellow
scp -r apps root@${SERVER}:${TARGET_DIR}/
scp -r services root@${SERVER}:${TARGET_DIR}/
scp -r agents root@${SERVER}:${TARGET_DIR}/
scp -r packages root@${SERVER}:${TARGET_DIR}/
scp -r core root@${SERVER}:${TARGET_DIR}/

# Additional files
Write-Host "📄 Transferring additional files..." -ForegroundColor Yellow
scp package.json pnpm-lock.yaml pnpm-workspace.yaml root@${SERVER}:${TARGET_DIR}/
scp pyproject.toml requirements-dev.txt root@${SERVER}:${TARGET_DIR}/
scp Makefile DEPLOY.md STATUS.md root@${SERVER}:${TARGET_DIR}/

# Create necessary directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
ssh root@${SERVER} "cd ${TARGET_DIR} && mkdir -p logs uploads storage ai_models keys"

# Start services
Write-Host "🚀 Starting NovaOS services..." -ForegroundColor Yellow
ssh root@${SERVER} "cd ${TARGET_DIR} && docker-compose up -d"

Write-Host "✅ Complete deployment finished!" -ForegroundColor Green
Write-Host "🌐 Check your services at http://${SERVER}" -ForegroundColor Cyan
