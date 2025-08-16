.PHONY: dev stop logs db-shell

include .env
export $(shell sed -ne 's/^\([^#=]*\)=.*/\1/p' .env)

dev:
	docker compose up -d db redis
	pnpm --filter "apps/*" -r dev &
	./scripts/dev.sh

stop:
	docker compose down
	pkill -f "uvicorn" || true
	pkill -f "pnpm.*dev" || true

logs:
	docker compose logs -f

db-shell:
	docker compose exec db psql -U $(POSTGRES_USER) $(POSTGRES_DB)
