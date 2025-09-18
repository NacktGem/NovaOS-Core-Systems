# NovaOS-Core-Systems

**Three domains. One brain.**

- **NovaOS (Console)** — private cockpit and agent orchestrator (Founder-only)
- **Black Rose Collective** — public creator platform (SFW/NSFW with consent)
- **GypsyCove** — invite-only family dashboard (allowlist, private rooms)

## Roles

GODMODE → SUPER_ADMIN (Jules, Nova) → ADMIN_AGENT → ADVISOR → MODERATOR → CREATOR_STANDARD → CREATOR_SOVEREIGN → VERIFIED_USER → GUEST

## Tiers (BRC)

- **Free**
- **Sovereign** — priority explore boost, advanced analytics, early features, concierge support, collaborator codes, extra palettes.

## Palettes

- Free: DarkCore, RoseNoir
- Paid: ObsidianBloom, GarnetMist, BlueAsh, VelvetNight

## Payments

Crypto (BTCPay) + optional Stripe. Platform cut: **12%**.

## Repos & Services

- apps/web-shell (BRC UI)
- apps/gypsy-cove (Family UI)
- apps/nova-console (Founder UI)
- services/core-api (FastAPI)
- services/audita (Consent/DMCA/Tax)
- services/echo (WebSockets & push)
- services/velora (Analytics/CRM)
- services/media-pipeline (FFmpeg/ImageMagick/Tesseract)
- services/nova-orchestrator (agent bus)
- services/riven (parental/medical/off-grid)
- services/glitch (defensive forensics)
- packages/{shared,ui,sdk}

## App Quickstart

Run all services locally:

### Quick Start (Cross-Platform)

```bash
# All platforms: Docker Compose method
make dev

# Windows: PowerShell method
make dev-win

# macOS/Linux: Shell script method
make dev-mac
```

### Platform-Specific Setup

- **Windows**: See standard setup below
- **macOS**: See [docs/DEVELOPMENT_MAC.md](docs/DEVELOPMENT_MAC.md)
- **Linux**: Use standard bash scripts

### Development (Traditional)

```bash
pnpm -r dev
```

### Web-Shell (Black Rose Collective)

- URL: http://localhost:3000
- Login: creator1@local / devdev
- Test: sign in, explore feed, unlock palettes.

### Gypsy-Cove (Family)

- URL: http://localhost:3001
- Login: user1@local / devdev
- Test: join family-home chat, submit consent upload.

### Nova-Console (Founder/Admin)

- URL: http://localhost:3002
- Login: founder@local / devdev
- Test: verify GodMode banner, review DMCA inbox, view analytics.

## Echo

Env vars (.env.echo):

- REDIS_URL
- CORE_API_URL
- JWT_PUBLIC_KEY_PATH
- ECHO_INTERNAL_TOKEN

/healthz checks Redis. Rooms enforce founder/family policy; other rooms require Core API membership.

## Sovereign Standard

Local-first, consent-bound, RBAC enforced, Founder controls everything.

## Supply Chain Security

NovaOS implements **Stage 11 Sovereign Standard** for complete supply chain transparency:

- **SBOM Generation**: Every container includes a Software Bill of Materials
- **Image Signing**: All published images are cryptographically signed with cosign
- **Verification**: Full audit trail from PR to deployment

See [docs/SUPPLY_CHAIN_VERIFICATION.md](docs/SUPPLY_CHAIN_VERIFICATION.md) for verification commands.

## CLI

Run NovaOS agents directly from the terminal:

```bash
./scripts/run-agent.sh echo send_message '{"message":"hi"}'
```

Glitch forensics shortcuts:

```bash
./scripts/forensics.sh hash path/to/file
./scripts/forensics.sh scan
```

<!-- ci: trigger core-api-deploy workflow -->
