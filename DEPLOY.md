# Deploy

## Prerequisites
- Docker 24+
- Docker Compose plugin

## Environment
1. `cp .env.production.example .env`
2. update `NOVA_AGENT_TOKEN`

## Run
- `make up`
- `make logs` to inspect services
- `make down` to stop

## Endpoints
- Core API: http://localhost:8760
- Echo WS: ws://localhost:8765/ws
- Gypsy Cove UI: http://localhost:3000
- Nova Console: http://localhost:3001
- Web Shell: http://localhost:3002

## Health
Each service exposes `/healthz` and `/readyz`.
Ensure reverse proxies preserve `X-Forwarded-For` and related headers for accurate logs.

## Metrics
Enable metrics with `PROM_ENABLED=true`.
Example Prometheus scrape config:
```yaml
scrape_configs:
  - job_name: core-api
    static_configs:
      - targets: ['localhost:8760']
```

## Restore
Backups are stored in `backups/backup-*.tgz`.
To restore:
```bash
tar xzf backups/backup-<timestamp>.tgz
```
