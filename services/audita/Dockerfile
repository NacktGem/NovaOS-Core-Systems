FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY core /app/core
COPY env /app/env
COPY agents /app/agents
COPY services/agent-core /app/agent_core
COPY services/audita /app/services/audita

RUN pip install --no-cache-dir \
    fastapi==0.116.1 \
    "uvicorn[standard]==0.35.0" \
    pydantic==2.11.7 \
    httpx==0.28.1 \
    redis==5.0.1 \
    orjson==3.10.3 \
    "psycopg[binary]==3.2.1"

RUN chmod -R a+rX /app/env || true

WORKDIR /app/services/audita

COPY services/core-api/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
