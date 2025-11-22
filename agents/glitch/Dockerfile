# Glitch agent container
FROM python:3.11-slim
WORKDIR /app

# Install system deps for agent requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy agent code and dependencies
COPY agents/ ./agents/
COPY core/ ./core/
COPY env/ ./env/
COPY requirements-dev.txt pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-dev.txt

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash agent
USER agent

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8006
CMD ["python", "-u", "agents/glitch/agent.py"]