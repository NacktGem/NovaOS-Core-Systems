# NovaOS Development on macOS 🍎

This guide covers setting up NovaOS Core Systems for development on macOS.

## Prerequisites

1. **Install Docker Desktop for Mac**

   ```bash
   # Using Homebrew (recommended)
   brew install --cask docker

   # Or download from: https://www.docker.com/products/docker-desktop
   ```

2. **Install Node.js and pnpm**

   ```bash
   # Using Homebrew
   brew install node pnpm

   # Or using Node Version Manager (nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   npm install -g pnpm
   ```

3. **Install Python 3.11+**

   ```bash
   # Using Homebrew
   brew install python@3.11

   # Or using pyenv (recommended for multiple Python versions)
   brew install pyenv
   pyenv install 3.11.6
   pyenv global 3.11.6
   ```

## Quick Start

1. **Clone and Setup**

   ```bash
   git clone https://github.com/NacktGem/NovaOS-Core-Systems.git
   cd NovaOS-Core-Systems

   # Install dependencies
   pnpm install
   pip install -r requirements-dev.txt
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your preferred settings
   vim .env
   ```

3. **Start Development**

   ```bash
   # Option 1: Using Make (recommended)
   make dev

   # Option 2: Using the Mac-specific script
   ./scripts/dev.sh

   # Option 3: Direct Docker Compose
   docker compose --profile app --profile infra up --build
   ```

## Mac-Specific Notes

### File Permissions

Docker Desktop for Mac handles file permissions differently than Linux. If you encounter permission issues:

```bash
# Make scripts executable
chmod +x scripts/*.sh tools/*.sh

# Fix any permission issues
./scripts/fix_permissions.sh
```

### Performance Optimization

For better Docker performance on Mac:

1. **Enable VirtioFS** in Docker Desktop > Preferences > Experimental Features
2. **Allocate adequate resources** in Docker Desktop > Preferences > Resources:
   - Memory: 8GB+ (recommended)
   - CPUs: 4+ cores
   - Swap: 2GB

### VS Code Integration

Install recommended extensions:

```bash
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
```

## Development Workflow

### Running Services

```bash
# Start all infrastructure and apps
make dev

# Start only infrastructure (DB, Redis)
docker compose --profile infra up -d

# Start individual services
pnpm --filter @novaos/core-api dev
pnpm --filter @novaos/gypsy-cove dev
```

### Testing

```bash
# Run all tests
pnpm test:all

# Run end-to-end tests
pnpm e2e

# Run Python tests
pytest
```

### Agent Development

```bash
# Run specific agent
./scripts/run-agent.sh glitch

# Test agent locally
python agents/glitch/agent.py
```

## Troubleshooting

### Docker Issues

```bash
# Reset Docker if having issues
docker system prune -a
docker volume prune

# Check Docker resources
docker system df
```

### Port Conflicts

Default ports used:

- 8760: Core API
- 8765: Echo WebSocket
- 3000: Gypsy Cove
- 3001: Nova Console
- 3002: Web Shell
- 5432: PostgreSQL
- 6379: Redis

### Python Virtual Environment (Optional)

If you prefer using virtual environments:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
```

## Differences from Windows Development

- Use `./scripts/dev.sh` instead of `scripts/dev.ps1`
- File paths use forward slashes
- Some shell commands may have slightly different output formats
- Docker Desktop settings location differs

All core functionality remains identical between platforms.
