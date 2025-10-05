# NovaOS Console

Founder-only cockpit for NovaOS. Provides GodMode dashboard, agent telemetry, consent ledger, and platform flag controls. Built with Next.js app router and Sovereign Standard styling.

## Commands
- `pnpm dev` — start the console locally on `http://localhost:3001`.
- `pnpm build && pnpm start` — production build & serve.
- `pnpm lint` — run ESLint with project config.
- `pnpm test` — execute Vitest suite.

## Environment
The console reads the following variables at build/runtime:
- `CORE_API_BASE` — base URL for core-api requests.
- `ECHO_WS` and `NEXT_PUBLIC_ECHO_WS_URL` — agent websocket relay.
- `SITE_URL` — public origin for the console.
- `NOVAOS_BASE_URL` — canonical console URL (used for redirects and cross-linking).
- `BRC_DOMAIN` — shared domain suffix for platform-aware components.
- `AGENT_SHARED_TOKEN` — bearer token for orchestrator-bound API calls (server only).

## Features
- GodMode dashboard with agent grid, analytics feed, and consent ledger.
- Platform flag management backed by core-api orchestrator endpoints.
- Health probe aggregator that checks all NovaOS services.
- Role-gated routes; non-founder sessions see an access denial banner.

## Deployment
Production builds are containerised via `apps/novaos/Dockerfile` and deployed through DigitalOcean App Platform (`do-appspec-novaos.yaml`). Environment secrets must include `AGENT_SHARED_TOKEN`, `INTERNAL_TOKEN`, and `UNLOCK_PASSWORD` for related services.
