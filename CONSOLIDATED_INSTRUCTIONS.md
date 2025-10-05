# NovaOS Consolidated Instructions and Actionable Items

## Placeholder and TODO Items

### `security_hardening.py`

- Replace placeholders in `.env.template` with actual values:
  - `AUTH_PEPPER`: Generate a secure 32-character token.
  - `AGENT_SHARED_TOKEN`: Generate a secure 64-character token.
  - `POSTGRES_PASSWORD`: Generate a secure 20-character password.

- Use the `generate_secure_token` and `generate_secure_password` methods in the script to automate this process.

### `vault_bundles.py`

- Implement the following features:
  - Promo code validation.
  - Payment processing logic.
  - Granting access to all content in a bundle after purchase.

### `stripe_integration.py`

- Update the user record with `stripe_customer_id` after creating a Stripe customer.

### `scheduled_posts.py`

- Implement the following:
  - Queueing logic for scheduled posts.
  - Publishing logic for scheduled posts.

### `github-agent/app/index.js`

- Dispatch webhook events to agents (e.g., Nova, Lyra) or automation.

## Audit-Related Items

### `STATUS.md`

- Complete Phase 6 tasks:
  - Package `nova-orchestrator` as a first-class service.
  - Ship streaming relay and memory buffer for Nova agent console.
  - Harden cross-service RBAC/JWT claims and add automated integration tests.
  - Implement agent Dockerfiles and deployment wiring for Lyra, Velora, and Riven.

### `AGENT_ANALYSIS_REPORT.md`

- Address missing Docker support for the following services:
  - `nova-orchestrator`
  - `riven`
  - `glitch`
  - `velora`
  - `audita`

- Implement missing services for `nova-orchestrator` and `riven`.

### `SECURITY_AUDIT_REPORT.md`

- Resolve critical vulnerabilities:
  - Unauthenticated admin access in GypsyCove platform.
  - Administrative interface exposure.

- Continue addressing high-priority issues, such as configuration security and JWT token vulnerabilities.

### `NovaOS_Agent_System_Audit.ipynb`

- Follow the phased implementation strategy for agents and platform features.
  - Phase 1: Core agent infrastructure.
  - Phase 2: Essential agents (Nova, Velora, Echo, Lyra).

## Launch Readiness Checklist

1. **Dependencies**:
   - Ensure all dependencies are installed (`pnpm install` completed successfully).

2. **Docker Services**:
   - Validate Docker Compose configuration (`docker compose config` completed successfully).
   - Ensure all services are running (`docker compose up -d`).

3. **Security**:
   - Address critical vulnerabilities identified in the security audit.
   - Implement secure environment configurations.

4. **Testing**:
   - Run all tests (`pnpm -r test`).
   - Verify health checks (`/healthz` and `/readyz` endpoints).

5. **Deployment**:
   - Follow the deployment guide in `PRODUCTION_DEPLOYMENT_GUIDE.md`.

6. **Monitoring**:
   - Set up monitoring for SLO targets:
     - p95 agent latency < 500ms.
     - core-api 5xx rate < 0.1%.

---

This file consolidates all actionable items and instructions for NovaOS development and launch readiness.
