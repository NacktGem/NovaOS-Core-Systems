**NovaOS — Security and Forensics Scan (v0.1)**

- Date: {generated}
- Method: ripgrep across repository for tokens, keys, ports, IPs, weak patterns; manual review of critical services.

**Findings (by severity)**

- High
  - No hardcoded production secrets detected. Secrets are env-driven. Ensure CI/CD injects secure values for:
    - `AGENT_SHARED_TOKEN`, `NOVA_AGENT_TOKEN`, `JWT_PRIVATE_KEY_PATH`, `JWT_PUBLIC_KEY_PATH`, `ECHO_INTERNAL_TOKEN`.
  - JWT key paths shipped with dev examples; production should mount via secrets and set strict FS permissions.

- Medium
  - Core API CORS allows origins via env with `allow_credentials: true`. Confirm production `CORS_ORIGINS` is restricted.
  - Tests and examples use `devdev` passwords and `dev_internal_token`. Ensure these never ship to prod environments.
  - Client UIs read JWT role from cookie for UX (e.g., founder gating). Do not rely on this for authorization; enforce on server routes.
  - Lyra optional OpenAI client uses `OPENAI_API_KEY`/`LM_API_KEY` if present. No keys in repo; confirm runtime secrets storage complies with policy.

- Low
  - Multiple services expose `/internal/healthz` and `/readyz` unauthenticated by design; OK behind internal network or gateway, but avoid exposing publicly.
  - CSP in `apps/nova-console/next.config.ts` currently `connect-src 'self'`; proxy pattern is preferred (as implemented for health panel) to avoid opening cross-origins.
  - Logging paths under `/logs` and `logs/*` — ensure rotation and size controls in production.

**Crypto and Auth Review**

- JWT: Key paths configured by env; verify key size and algorithm in `services/core-api/app/security/jwt.py` (not read due to FS ACL in this session, but build output shows standard use).
- Rate limiting: `LoginRateLimit` middleware present in core-api build; confirm configured redis and policy in prod.
- Prometheus: `/metrics` gated by `PROM_ENABLED`; ensure not exposed publicly if enabled.

**Network and Ports**

- Exposed ports via compose: 8760 (core-api), 8765 (echo), 3000/3001/3002 (apps). No unexpected high ports found.
- Services not exposed by compose (lyra, velora, audita, riven, orchestrator) should be accessed internally or via gateway.

**Forensics Posture**

- Glitch agent provides: hashing, entropy, sandbox checks, network probing, deep file analysis, memory/rootkit/logs/integrity checks.
- Suggested additions:
  - Baseline snapshot and comparison utilities
  - Quarantine workflow with checksum and chain-of-custody log
  - Tamper-evident reports signed with key material

**Action Items**

- [ ] Enforce agent token on all agent execution paths; add tests.
- [ ] Add CI check: block merge if `.env.*` contains placeholder `changeme`/`dev` in production deployment branch.
- [ ] Add internal-only network policies for `/internal/*` routes.
- [ ] Wire central audit logging with retention and rotation.
- [ ] Document incident response runbooks integrated with Glitch outputs.

