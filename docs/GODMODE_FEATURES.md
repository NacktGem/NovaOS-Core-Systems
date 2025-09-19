**GodMode Dashboard — Features Checklist**

Scope: Founder dashboard across NovaOS apps (Web-Shell GodMode, Nova Console additions)

Implemented

- [x] Orchestrator status panel (web-shell `/godmode`)
- [x] Agent runner with command/args and log link (web-shell `/godmode`)
- [x] Logs viewer with auto-refresh (web-shell `/godmode`)
- [x] Nova Console Health Panel (founder-gated) at `apps/nova-console/app/godmode/health/page.tsx`

Missing / Incomplete

- [ ] Founder server-side auth guard in nova-console (currently client-side role read)
- [ ] Centralized service discovery and config surface in UI
- [ ] Aggregated `/version` view across services with commit/build metadata
- [ ] Controls: emergency stop, agent reset — currently UI-only placeholders
- [ ] Audit trail viewer (merge agent registry logs per job)

Planned Enhancements

- [ ] Add tiles for agents heartbeats and last error per agent
- [ ] Add link-outs to `/metrics` (when enabled) and upstream logs
- [ ] Add palette/theme toggle using Black Rose dark variables

