# syntax=docker/dockerfile:1.7
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1 PATH="/opt/venv/bin:$PATH" NOVA_MODE=production
RUN addgroup --system app && adduser --system --ingroup app app \
 && apt-get update && apt-get install -y --no-install-recommends build-essential ca-certificates curl \
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
RUN chown -R app:app /app
USER app
CMD ["python", "-u", "agents/glitch/agent.py"]