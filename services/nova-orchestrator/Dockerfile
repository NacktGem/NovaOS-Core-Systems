FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo sources needed at runtime
COPY services/nova-orchestrator /app/nova-orchestrator
COPY agents /app/agents
COPY core /app/core
COPY env /app/env

# Install runtime deps only
RUN pip install --no-cache-dir fastapi==0.116.1 "uvicorn[standard]==0.35.0" httpx==0.28.1 pydantic==2.11.7

WORKDIR /app/nova-orchestrator
COPY services/core-api/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
