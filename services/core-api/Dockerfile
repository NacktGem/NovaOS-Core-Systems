FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# install system deps needed for healthchecks and DB clients
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  gcc \
  libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy only the core-api package sources for building/installation
COPY services/core-api /app/core-api

# Copy top-level runtime packages that core-api imports
COPY agents /app/agents
COPY packages /app/packages
COPY services /app/services
COPY core /app/core
# Copy env directory (identity/config) so env/identity.py and config.json are available at runtime
COPY env /app/env

# Copy the service pyproject so runtime code that searches for project
# markers (pyproject.toml, .git, etc.) can find the project root at /app.
COPY services/core-api/pyproject.toml /app/pyproject.toml

# Install runtime Python dependencies (do NOT install the local package)
# We install the packages needed to run the app (uvicorn, fastapi, db drivers, redis, etc.).
RUN pip install --no-cache-dir \
  fastapi==0.116.1 \
  "uvicorn[standard]==0.35.0" \
  pydantic==2.11.7 \
  "pydantic[email]==2.11.7" \
  "psycopg[binary]==3.2.1" \
  sqlalchemy==2.0.34 \
  redis==5.0.1 \
  prometheus-client==0.15.0 \
  httpx==0.28.1 \
  loguru==0.7.2 \
  orjson==3.10.3 \
  pydantic-settings==2.10.1 \
  "python-jose[cryptography]==3.3.0" \
  argon2-cffi==23.1.0 \
  itsdangerous==2.2.0 \
  typing-extensions>=4.5.0 \
  stripe==12.0.0

RUN chmod -R a+rX /app/env || true

# For production-like runtime we will run directly from the source tree
# instead of pip-installing the package. This avoids mismatches between
# installed site-packages and repo sources.
WORKDIR /app/core-api

# Print PYTHONPATH to help debug import resolution in the container logs.
# This is a low-risk addition and can be removed once we confirm env imports.
COPY services/core-api/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
