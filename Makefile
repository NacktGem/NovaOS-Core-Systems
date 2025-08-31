SHELL := /bin/bash

.PHONY: dev stop logs db-shell ps up down backup verify-backups migrate seed

dev:
	docker compose --profile app --profile infra up --build

stop:
	docker compose down

logs:
	docker compose logs -f

db-shell:
	docker compose exec -e PGPASSWORD=$${POSTGRES_PASSWORD:-nova} db \
	psql -U $${POSTGRES_USER:-nova} -d $${POSTGRES_DB:-nova}

ps:
	docker compose ps

up:
	docker compose --profile prod up -d --build

down:
	docker compose --profile prod down

backup:
	./scripts/backup.sh

verify-backups:
	test -n "$$(find backups -maxdepth 1 -name 'backup-*.tgz' -mtime -1)"

migrate:
	docker compose --profile prod exec core-api alembic upgrade head

seed:
	docker compose exec core-api python scripts/seed.py
