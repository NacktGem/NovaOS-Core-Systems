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

# Copy the service pyproject so runtime code that searches for project
# markers (pyproject.toml, .git, etc.) can find the project root at /app.
COPY services/core-api/pyproject.toml /app/pyproject.toml

RUN pip install --no-cache-dir /app/core-api

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8760"]
