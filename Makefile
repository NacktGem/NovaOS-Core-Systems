SHELL := /bin/bash

.PHONY: dev stop logs db-shell ps up down

dev:
\tdocker compose up -d db redis
\t./scripts/dev.sh

stop:
\tdocker compose down

logs:
\tdocker compose logs -f

db-shell:
\tdocker compose exec -e PGPASSWORD=$${POSTGRES_PASSWORD:-nova} db \
\t\tpsql -U $${POSTGRES_USER:-nova} -d $${POSTGRES_DB:-nova}

ps:
\tdocker compose ps

up:
\tdocker compose up -d

down:
\tdocker compose down -v
