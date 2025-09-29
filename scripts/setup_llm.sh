#!/bin/bash

# NovaOS LLM Integration Setup Script
# Installs and configures Ollama, downloads models, and tests integration

set -e

echo "🚀 NovaOS LLM Integration Setup"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on WSL
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
    echo -e "${YELLOW}⚠️  Running on WSL detected${NC}"
    WSL=true
else
    WSL=false
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Ollama
install_ollama() {
    echo -e "${YELLOW}📦 Installing Ollama...${NC}"

    if command_exists ollama; then
        echo -e "${GREEN}✅ Ollama already installed${NC}"
        return 0
    fi

    # Install Ollama
    curl -fsSL https://ollama.com/install.sh | sh

    # Start Ollama service
    if [ "$WSL" = true ]; then
        echo -e "${YELLOW}🔧 Starting Ollama (WSL mode)...${NC}"
        nohup ollama serve > /dev/null 2>&1 &
        sleep 3
    else
        echo -e "${YELLOW}🔧 Starting Ollama service...${NC}"
        sudo systemctl start ollama
        sudo systemctl enable ollama
    fi

    echo -e "${GREEN}✅ Ollama installed and started${NC}"
}

# Function to download models
download_models() {
    echo -e "${YELLOW}📥 Downloading AI models...${NC}"

    # Download lightweight models suitable for local development
    models=(
        "llama3.1:8b"
        "mistral:7b"
        "codellama:7b"
        "phi3:mini"
    )

    for model in "${models[@]}"; do
        echo -e "${YELLOW}⬇️  Downloading $model...${NC}"
        if ollama pull "$model"; then
            echo -e "${GREEN}✅ Downloaded $model${NC}"
        else
            echo -e "${RED}❌ Failed to download $model${NC}"
        fi
    done
}

# Function to create Python requirements
setup_python_deps() {
    echo -e "${YELLOW}🐍 Setting up Python dependencies...${NC}"

    # Create/update requirements for LLM integration
    cat > requirements-llm.txt << EOF
openai>=1.43.0
httpx>=0.28.1
asyncio
aiofiles
fastapi>=0.116.1
uvicorn[standard]>=0.35.0
redis>=5.0.1
pydantic>=2.11.7
python-multipart
EOF

    # Install if in virtual environment
    if [[ "$VIRTUAL_ENV" != "" ]] || [[ -d ".venv" ]]; then
        echo -e "${YELLOW}🔧 Installing Python packages...${NC}"
        pip install -r requirements-llm.txt
        echo -e "${GREEN}✅ Python packages installed${NC}"
    else
        echo -e "${YELLOW}⚠️  No virtual environment detected. Install manually:${NC}"
        echo "pip install -r requirements-llm.txt"
    fi
}

# Function to create environment configuration
setup_env_config() {
    echo -e "${YELLOW}⚙️  Setting up environment configuration...${NC}"

    # Create .env.llm template
    cat > .env.llm.template << EOF
# LLM Configuration for NovaOS Agents
# Copy to .env.llm and configure as needed

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2048

# Ollama Configuration (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=2048

# LM Studio Configuration (local)
LMSTUDIO_BASE_URL=http://localhost:1234
LMSTUDIO_MODEL=local-model
LMSTUDIO_TEMPERATURE=0.7
LMSTUDIO_MAX_TOKENS=2048

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-3-haiku-20240307
EOF

    # Create actual .env.llm if it doesn't exist
    if [ ! -f .env.llm ]; then
        cp .env.llm.template .env.llm
        echo -e "${GREEN}✅ Created .env.llm configuration file${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.llm already exists, template saved as .env.llm.template${NC}"
    fi
}

# Function to test LLM integration
test_llm_integration() {
    echo -e "${YELLOW}🧪 Testing LLM integration...${NC}"

    # Test Ollama health
    if curl -s http://localhost:11434/api/tags >/dev/null; then
        echo -e "${GREEN}✅ Ollama is responding${NC}"
    else
        echo -e "${RED}❌ Ollama is not responding${NC}"
        return 1
    fi

    # List available models
    echo -e "${YELLOW}📋 Available Ollama models:${NC}"
    curl -s http://localhost:11434/api/tags | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    for model in data.get('models', []):
        print(f\"  - {model['name']}\")
except:
    print('  Unable to parse models')
"

    # Test basic completion
    echo -e "${YELLOW}🤖 Testing basic completion...${NC}"
    response=$(curl -s -X POST http://localhost:11434/api/generate \
        -H "Content-Type: application/json" \
        -d '{
            "model": "llama3.1:8b",
            "prompt": "Say hello in exactly 3 words:",
            "stream": false
        }' | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('response', 'No response'))
except:
    print('Error parsing response')
")

    if [ -n "$response" ] && [ "$response" != "Error parsing response" ]; then
        echo -e "${GREEN}✅ LLM response: $response${NC}"
    else
        echo -e "${RED}❌ LLM test failed${NC}"
    fi
}

# Function to create agent test script
create_test_script() {
    echo -e "${YELLOW}📝 Creating agent test script...${NC}"

    cat > test_agents_llm.py << 'EOF'
#!/usr/bin/env python3
"""Test script for NovaOS Agent LLM integration"""

import asyncio
import sys
import os
sys.path.append('.')

async def test_lyra_agent():
    """Test Lyra agent with LLM integration"""
    try:
        from agents.lyra.agent import LyraAgent

        # Initialize Lyra with LLM
        lyra = LyraAgent()
        print(f"🎭 Lyra Agent initialized - LLM enabled: {lyra.llm_enabled}")

        # Test basic lesson generation
        payload = {
            "command": "generate_lesson",
            "args": {
                "topic": "Python Programming",
                "grade": "8th",
                "llm": True
            }
        }

        result = lyra.run(payload)

        if result["success"]:
            print("✅ Lesson generation successful")
            print(f"📝 Topic: {result['output']['topic']}")
            if result['output'].get('llm_generated'):
                print("🤖 LLM Enhanced: YES")
            else:
                print("📚 Using fallback: Static content")
        else:
            print(f"❌ Error: {result['error']}")

        # Test creative prompt
        payload = {
            "command": "create_prompt",
            "args": {
                "type": "writing",
                "llm": True
            }
        }

        result = lyra.run(payload)

        if result["success"]:
            print("✅ Creative prompt successful")
            print(f"✍️  Prompt: {result['output']['prompt']}")
            if result['output'].get('ai_generated'):
                print("🤖 AI Generated: YES")
        else:
            print(f"❌ Error: {result['error']}")

    except Exception as e:
        print(f"❌ Lyra test failed: {e}")

async def test_llm_direct():
    """Test direct LLM integration"""
    try:
        from agents.common.llm_integration import llm_manager

        # Check health
        health = await llm_manager.health_check()
        print(f"🏥 LLM Health: {health}")

        # Test generation
        if any(health.values()):
            response = await llm_manager.generate("Hello, I'm testing the LLM integration. Respond in exactly 5 words.")
            print(f"🤖 LLM Response: {response}")
        else:
            print("❌ No healthy LLM providers found")

    except Exception as e:
        print(f"❌ Direct LLM test failed: {e}")

async def main():
    print("🚀 Testing NovaOS Agent LLM Integration")
    print("=" * 50)

    await test_llm_direct()
    print()
    await test_lyra_agent()

if __name__ == "__main__":
    asyncio.run(main())
EOF

    chmod +x test_agents_llm.py
    echo -e "${GREEN}✅ Created test_agents_llm.py${NC}"
}

# Function to update docker-compose for LLM services
update_docker_compose() {
    echo -e "${YELLOW}🐳 Updating Docker Compose for LLM support...${NC}"

    # Check if we should add Ollama service
    if ! grep -q "ollama:" docker-compose.yml; then
        cat >> docker-compose.yml << 'EOF'

  # LLM Services
  ollama:
    image: ollama/ollama:latest
    container_name: novaos-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ollama_data:
EOF
        echo -e "${GREEN}✅ Added Ollama service to docker-compose.yml${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama service already in docker-compose.yml${NC}"
    fi
}

# Main installation process
main() {
    echo "Starting NovaOS LLM integration setup..."
    echo

    # Check system requirements
    if ! command_exists curl; then
        echo -e "${RED}❌ curl is required but not installed${NC}"
        exit 1
    fi

    if ! command_exists python3; then
        echo -e "${RED}❌ Python 3 is required but not installed${NC}"
        exit 1
    fi

    # Run installation steps
    install_ollama
    echo

    download_models
    echo

    setup_python_deps
    echo

    setup_env_config
    echo

    update_docker_compose
    echo

    create_test_script
    echo

    test_llm_integration
    echo

    echo -e "${GREEN}🎉 NovaOS LLM Integration Setup Complete!${NC}"
    echo
    echo "Next steps:"
    echo "1. Configure .env.llm with your API keys"
    echo "2. Run: python3 test_agents_llm.py"
    echo "3. Access LLM interface at: http://localhost:8760/api/llm/"
    echo "4. Try the GodMode dashboard LLM chat interface"
    echo
    echo "Available models:"
    ollama list 2>/dev/null || echo "  Run 'ollama list' to see downloaded models"
}

# Handle script arguments
case "${1:-install}" in
    "install")
        main
        ;;
    "test")
        test_llm_integration
        ;;
    "models")
        download_models
        ;;
    "health")
        curl -s http://localhost:11434/api/tags | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print('✅ Ollama is healthy')
    print('Available models:')
    for model in data.get('models', []):
        print(f\"  - {model['name']}\")
except:
    print('❌ Ollama is not responding')
    sys.exit(1)
"
        ;;
    *)
        echo "Usage: $0 [install|test|models|health]"
        echo "  install - Full setup (default)"
        echo "  test - Test LLM integration"
        echo "  models - Download models only"
        echo "  health - Check Ollama health"
        ;;
esac
