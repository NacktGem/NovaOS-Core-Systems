# Security & Sovereign Standard

- **Local-first.** No cloud calls by default. Any optional external integrations are explicit and off by default.
- **Role-gated.** Every sensitive action is protected by RBAC; **GodMode** (Founder) bypasses logs; all others are fully logged.
- **GodMode ephemeral.** Messages from godmode are broadcast only; nothing is written to storage.
- **GodMode banners.** Clients display a role badge and prominent banner when GodMode is active.
- **Redis fan-out.** Echo relays rely exclusively on Redis pub/sub; no process-local hubs.

- **Consent-bound.** Forensics/capture modules are **owner-only** and require explicit toggle in NovaOS Console.
- **NSFW compliance.** Black Rose requires verified 18+ and consent artifacts. Audita enforces DMCA/4LE workflows.
- **E2EE paths.** Messaging and private artifacts (where configured) use end-to-end encryption.
- **Data erasure.** Users may request data export and deletion; founders may purge logs (except legal holds).
- **Secrets.** Use local env files and OS keyrings; never commit secrets.
- **CSRF defense.** All state-changing requests require an `x-csrf-token` header sourced from the CSRF cookie; JWTs remain in httpOnly cookies and are never read client-side.

Report issues privately to the Founder. Lawful-only usage.
