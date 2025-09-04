# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PATH="/opt/venv/bin:$PATH" NOVA_MODE=production

# Install forensics tools and system utilities
RUN addgroup --system app && adduser --system --ingroup app app \
 && apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl \
    binutils hexdump xxd upx-ucl \
    strace lsof tcpdump netcat-openbsd \
    procps net-tools iproute2 \
    file coreutils util-linux \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip

WORKDIR /app

COPY requirements-dev.txt ./requirements-dev.txt
RUN pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --no-cache-dir -r requirements-dev.txt

COPY agents ./agents
COPY core ./core
COPY packages ./packages
COPY services ./services
COPY scripts ./scripts
COPY pyproject.toml ./pyproject.toml

# Make CLI executable and accessible
RUN chmod +x agents/glitch/glitch-cli
RUN ln -s /app/agents/glitch/glitch-cli /usr/local/bin/glitch

# Create directories for Glitch data
RUN mkdir -p /tmp/glitch/{reports,logs,honeypots,chat} \
 && chown -R app:app /app /tmp/glitch

USER app

# Set up health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD glitch status > /dev/null || exit 1

# Default command runs the agent, but CLI is also available
CMD ["python", "-u", "agents/glitch/agent.py"]