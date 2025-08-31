FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# install system deps needed for healthchecks and DB clients
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY . .
RUN pip install --no-cache-dir .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8760"]
