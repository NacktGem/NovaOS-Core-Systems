**NovaOS Core Systems — System Audit (v0.1)**

- Date: {generated}
- Scope: Full repository scan focusing on agents, apps, services, configs, health, and security posture.

**Top-Level Overview**

- Core services: `services/core-api` (FastAPI), `services/echo` (WebSocket + REST), auxiliary services outlined under `services/*` (lyra, velora, audita, riven, nova-orchestrator) with health/version routes implemented.
- Agents: Python agents under `agents/*` (audita, echo, glitch, lyra, riven, velora, nova). Shared base in `agents/base.py`; registry in `core/registry.py`.
- Apps (Next.js): `apps/web-shell`, `apps/nova-console`, `apps/gypsy-cove`.
- Compose: `docker-compose.yml` for Postgres, Redis, core-api, echo-ws, and apps. Agent containers provided under the “agents” profile.

**Agents — Files and Methods**

- Base: `agents/base.py:36` — `class BaseAgent` with abstract `run(payload)`.
- Audita: `agents/audita/agent.py:20` — `AuditaAgent(BaseAgent)` methods: `_log`, `_wrap`, `run`, plus new placeholders: `verify_consent_document`, `audit_tax_compliance`.
- Echo: `agents/echo/agent.py:13` — `EchoAgent(BaseAgent)` methods: `_wrap`, `run` (docstring added), `schedule_broadcast` (placeholder).
- Glitch: `agents/glitch/agent.py:28` — `GlitchAgent(BaseAgent)` (rich forensics suite: hashing, entropy, sandbox, network probe, deep scan, memory scan, rootkit, logs, integrity). Run already documented; suggestions below for baseline/quarantine utilities.
- Lyra: `agents/lyra/agent.py:19` — `LyraAgent(BaseAgent)` methods: `_append_json`, `_log`, `_wrap`, `_llm_generate`, `run` (docstring added); new placeholders: `compose_story`, `generate_curriculum`, `critique_work`.
- Riven: `agents/riven/agent.py:14` — `RivenAgent(BaseAgent)` methods: `_append_json`, `_haversine`, `run` (docstring added), `_wrap`; new placeholders: `emergency_contact`, `build_med_pack`.
- Velora: `agents/velora/agent.py:18` — `VeloraAgent(BaseAgent)` methods: `_log`, `_wrap`, `run` (docstring added); new placeholders: `generate_funnel_report`, `segment_audience`, `forecast_kpis`.
- Nova: `agents/nova/agent.py` — unreadable due to filesystem permissions; not audited in-code (present, 1143 bytes).

Suggestions per agent (domain-expansion)

- Glitch: add `baseline_snapshot(paths)`, `compare_baseline(baseline)`, `quarantine_path(path)` and `generate_forensic_report(findings)`; keep outputs structured and log to `/logs/glitch.log`.
- Lyra: richer creative pipelines (`storyboard`, `moodboard_from_images`, `curriculum_from_competencies`).
- Velora: insights (`funnel_dropoff_heatmap`, `cohort_retention(curves)`, `anomaly_detect(series)`), CSV/JSON exporters.
- Audita: `kyc_check(doc)`, `consent_pack(auto_fill)`, `policy_gate(event)`, `dmca_batch(urls)`.
- Echo: `schedule_broadcast(when, message, recipients)`, `templated_notifications(kind, vars)`.
- Riven: `safe_route(origin, dest)`, `resource_pack(context)`, `distress_signal(contact)`.

**Frontend — Pages and API Routes**

- Nova Console pages:
  - `apps/nova-console/app/page.tsx`, `layout.tsx`, `globals.css`.
  - App routes: `app/api/agents/[agent]/route.ts` (stub), new `app/api/health/route.ts` (proxy).
  - Pages: `app/me/page.tsx`, `app/rooms/page.tsx`, `app/palettes/page.tsx`, `app/login/page.tsx`, `app/consent/page.tsx`, `app/ops/page.tsx`.
  - New Health Panel (founder-only): `app/godmode/health/page.tsx` (polls every 10s; shows status + optional version).

- Web-Shell pages:
  - Core: `app/page.tsx`, `layout.tsx`, `globals.css`.
  - Console & GodMode: `app/console/page.tsx`, `app/godmode/page.tsx`, `app/godmode/agents/page.tsx`.
  - Auth/me: `app/login/page.tsx`, `app/me/page.tsx`.
  - Features: `app/palettes/page.tsx`, `app/consent-upload/page.tsx`, `app/upgrade/page.tsx`, `app/ws-test/page.tsx`, `app/inbox/page.tsx`, `app/admin/page.tsx`.
  - API routes: `app/api/unlock`, `app/api/agents/[agent]`, `app/api/agents/command`, `app/api/orchestrator/status`, `app/api/agents/online`.

- Gypsy-Cove pages:
  - Core: `app/page.tsx`, `layout.tsx`, `globals.css`.
  - Dashboard/agents: `app/dashboard/page.tsx`, `app/api/agents/[agent]/route.ts`.
  - Auth/me: `app/login/page.tsx`, `app/me/page.tsx`.
  - Features: `app/palettes/page.tsx`, `app/ws-test/page.tsx`, `app/family-chat/page.tsx`.

**Services — Health and Version Endpoints**

- Core API (FastAPI): `services/core-api/build/lib/app/main.py` mounts `internal.health_router` exposing `/healthz`, `/readyz`; metrics at `/metrics` when enabled.
- Echo: `services/echo/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/healthz`, `/readyz`, `/version`, `/status`.
- Lyra: `services/lyra/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/version`, `/status`.
- Velora: `services/velora/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/version`, `/status`.
- Riven: `services/riven/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/version`, `/status`.
- Audita: `services/audita/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/healthz`, `/readyz`, `/version`, `/status`.
- Nova Orchestrator: `services/nova-orchestrator/app/main.py` exposes `/internal/healthz`, `/internal/readyz`, `/version`, `/status`.

Notes on compose

- Exposed ports in `docker-compose.yml`:
  - `core-api:8760`, `echo-ws:8765`, `web-shell:3002`, `nova-console:3001`, `gypsy-cove:3000`.
  - Agents run headless (profile `agents`) with per-agent healthchecks via `scripts/healthcheck.py`.

**Configs Discovered**

- .env templates: `.env.example`, `.env.blackrose.example`, `.env.core.example`, `.env.echo.example`, `.env.gypsycove.example`, `.env.production.example`.
- Docker: `docker-compose.yml`, multiple service Dockerfiles under `services/*/Dockerfile` and app Dockerfiles under `apps/*/Dockerfile`.
- Node: workspace `package.json`, `pnpm-workspace.yaml`, app `package.json` files, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`.
- Python: `pyproject.toml` at root and in `services/core-api`, `services/echo`; `requirements-dev.txt`.
- Lint/format: `.editorconfig`, `.prettierrc`, ESLint configs, `vitest.config.ts`.

**Features Implemented vs TODO**

- Implemented
  - Agent execution via `core/registry.py` with token (`NOVA_AGENT_TOKEN`).
  - Agents: Echo (relay), Glitch (forensics), Lyra (creative/OCR), Velora (analytics), Audita (compliance), Riven (parental/survival).
  - Web-Shell GodMode console; agents online view; orchestrator status; palette unlock flows.
  - Core API: auth, palettes, payments, rooms/messages, consent, DMCA, analytics, internal routes, agents proxy, logs.
  - Health/version across services; metrics for core-api when PROM enabled.

- TODO
  - Enforce agent token consistently across all agent-executing endpoints (gap noted in docs).
  - Expand nova-console’s API proxies beyond stub to reach core/echo safely.
  - Add consolidated service discovery so UIs don’t hardcode ports (env-driven map).
  - Harden CSP in `apps/nova-console/next.config.ts` connect-src to include service origins when proxying from client.
  - Add missing tests for new placeholder methods and health panel UI.

**Missing Routes / Health Checks**

- nova-console lacked a health UI; now added at `app/godmode/health/page.tsx` with server-side proxy `app/api/health/route.ts`.
- Some services only expose `/internal/healthz` (not `/healthz`); the panel normalizes via proxy.
- Compose currently exposes core-api and echo; other service apps (lyra, velora, audita, riven, orchestrator) aren’t published in compose ports — consider exposing or routing via an API gateway if needed.

**Security Flags (see separate SECURITY_FORENSICS_REPORT.md)**

- Use of example/dev secrets in tests and examples; ensure production `.env` overrides.
- Open CORS in core-api: `allow_origins` is env-driven; verify for prod.
- Client-side pages read JWT from cookie without verifying signature; OK for UX gating, not security.
- OpenAI key usage in Lyra is env-based; no keys hardcoded.

**Per-App TODO Checklist**

- Nova Console
  - [ ] Replace stub `app/api/agents/[agent]` with secure proxy to core-api.
  - [ ] Wire founder auth guard to GodMode pages server-side.
  - [ ] Add service map via env for health panel.

- Web-Shell
  - [ ] Confirm `/api/agents/online` route permissions and rate limits.
  - [ ] Surface `/version` in GodMode cards next to each agent.
  - [ ] Add accessibility checks and ARIA for modals.

- Gypsy-Cove
  - [ ] Harden auth & agent runner route with server-side token.
  - [ ] Add family-safe palettes and parental controls.

- Core API
  - [ ] Enforce `AGENT_SHARED_TOKEN` for agent endpoints everywhere.
  - [ ] Add `/version` response with git commit consistently in release pipeline.
  - [ ] Add `/healthz` top-level alias to complement `/internal/healthz`.

