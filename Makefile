SHELL := /bin/bash

.PHONY: dev stop logs db-shell ps up down

dev:
	docker compose up -d db redis
	./scripts/dev.sh

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
