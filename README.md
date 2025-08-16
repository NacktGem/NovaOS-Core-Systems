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
