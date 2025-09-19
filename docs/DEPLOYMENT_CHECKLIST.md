**NovaOS — Final Deployment Checklist**

Service Readiness

- [ ] Core API up (port 8760); `/internal/healthz` returns ok
- [ ] Echo WS up (port 8765); `/healthz` returns ok
- [ ] Apps: web-shell (3002), nova-console (3001), gypsy-cove (3000) respond
- [ ] Agents running (if using agents profile) and heartbeating to Core API

Database and Storage

- [ ] Postgres reachable; migrations applied (alembic for core-api)
- [ ] Redis reachable; rate limit keys and sessions functional
- [ ] Logs directory mounted and writable for services and agents

Docker/Compose Config

- [ ] `docker-compose.yml` environment variables populated for production
- [ ] Secrets mounted: `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`
- [ ] `AGENT_SHARED_TOKEN` and `NOVA_AGENT_TOKEN` set to strong values
- [ ] CORS origins restricted to production domains
- [ ] Healthchecks passing for core services

Env Expectations

- [ ] `.env.production` prepared with:
  - `CORE_API_URL`, `ECHO_BASE_URL`, `NOVA_CONSOLE_BASE_URL`, `SITE_URL`
  - `POSTGRES_*`, `DATABASE_URL`, `REDIS_URL`
  - `AGENT_SHARED_TOKEN`, `NOVA_AGENT_TOKEN`, `ECHO_INTERNAL_TOKEN`
  - JWT key paths mounted via Docker secrets

Web and Accessibility

- [ ] Apps render without console errors; CSP headers set
- [ ] Basic a11y: ARIA for modals (web-shell unlock), color contrast in Black Rose palette
- [ ] Keyboard navigation for critical flows

Models and LLMs

- [ ] Lyra: configure `OPENAI_API_KEY`/`LM_API_KEY` (optional) and model id
- [ ] Glitch: optional system tools installed if needed (binwalk, exiftool)

Monitoring and Metrics

- [ ] Prometheus `/metrics` gated behind internal network if enabled
- [ ] Health panel (nova-console godmode/health) shows green for all required services

