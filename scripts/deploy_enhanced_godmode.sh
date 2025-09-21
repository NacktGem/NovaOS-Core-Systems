#!/bin/bash

# Enhanced GodMode Dashboard Deployment Script
# Sets up the enhanced NovaOS GodMode dashboard with LLM integration

set -e

echo "🚀 Deploying Enhanced GodMode Dashboard..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: This script must be run from the NovaOS-Core-Systems root directory"
    exit 1
fi

# Set environment variables for enhanced mode
export ENHANCED_GODMODE=true
export NODE_ENV=${NODE_ENV:-development}

echo "📦 Installing dependencies..."

# Install any missing dependencies (if needed in the future)
# pnpm install --filter novaos lucide-react

echo "🔄 Building NovaOS app with enhanced features..."
cd apps/novaos
pnpm build
cd ../..

echo "🧠 Checking LLM integration status..."

# Check if LLM services are configured
if [ -f "ai_models/llm_config.json" ]; then
    echo "✅ LLM configuration found"
else
    echo "⚠️  LLM configuration not found - some features may be limited"
fi

# Check if Ollama is running (optional)
if command -v ollama &> /dev/null && ollama list &> /dev/null; then
    echo "✅ Ollama is available"
else
    echo "ℹ️  Ollama not detected - will use other LLM providers if configured"
fi

echo "🐳 Restarting services with enhanced configuration..."

# Restart the NovaOS service to pick up changes
docker-compose up -d novaos

# Wait for service to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Test the NovaOS app
if curl -f -s http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ NovaOS service is healthy"
else
    echo "⚠️  NovaOS service health check failed - may still be starting"
fi

# Test the LLM proxy endpoints
if curl -f -s http://localhost:3002/api/llm/health > /dev/null 2>&1; then
    echo "✅ LLM integration endpoints are working"
else
    echo "ℹ️  LLM endpoints not responding - check core-api service"
fi

echo ""
echo "🎉 Enhanced GodMode Dashboard deployment completed!"
echo ""
echo "📍 Access your enhanced dashboard at:"
echo "   🌐 http://localhost:3002/godmode"
echo ""
echo "✨ New features available:"
echo "   • Real-time agent monitoring with health status"
echo "   • Direct agent command execution interface"
echo "   • Integrated LLM chat with streaming responses"
echo "   • Multi-provider LLM support (OpenAI, Ollama, LM Studio)"
echo "   • Enhanced agent grid with live capabilities display"
echo "   • Advanced agent management console"
echo ""
echo "🔧 Configuration:"
echo "   • Enhanced mode: $ENHANCED_GODMODE"
echo "   • Environment: $NODE_ENV"
echo "   • LLM Integration: $([ -f "ai_models/llm_config.json" ] && echo "Configured" || echo "Limited")"
echo ""
echo "💡 Pro tip: Enable the 'enhanced_godmode' feature flag in the dashboard"
echo "   for persistent enhanced mode across all sessions."
echo ""

# Optional: Open browser (if on desktop environment)
if command -v xdg-open &> /dev/null; then
    echo "🌐 Opening enhanced dashboard in browser..."
    xdg-open http://localhost:3002/godmode
elif command -v open &> /dev/null; then
    echo "🌐 Opening enhanced dashboard in browser..."
    open http://localhost:3002/godmode
fi

echo "✅ Deployment completed successfully!"
