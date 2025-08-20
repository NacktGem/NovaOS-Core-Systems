# STATUS
**Phase 2: Complete**
- BaseAgent + Registry: `agents/base.py`, `core/registry.py` (token-gated, JSON logs)
- Agents: nova, echo, glitch, lyra, velora, audita, riven

## Sample payloads
- Nova → Echo: `{"agent":"echo","command":"send_message","args":{"message":"hi"}}`
- Glitch hash: `{"command":"hash_file","args":{"path":"./README.md"}}`
- Lyra prompt: `{"command":"create_prompt","args":{"type":"writing"}}`
- Velora report: `{"command":"generate_report","args":{"data":{"a":1,"b":2}}}`
- Audita GDPR: `{"command":"gdpr_scan","args":{"data":"email test a@b.com"}}`
- Riven protocol: `{"command":"generate_protocol","args":{"title":"Bugout","steps":["Pack","Drive"]}}`

## Phase 3 usage
- **UI**: All apps proxy agent calls via `/api/agents/{agent}` (no client token).
- **CLI**:
  - `NOVA_AGENT_TOKEN=changeme ./scripts/run-agent.sh echo send_message '{"message":"hi"}'`
  - `NOVA_AGENT_TOKEN=changeme ./scripts/forensics.sh hash ./README.md`
  - `NOVA_AGENT_TOKEN=changeme ./scripts/audit.sh generate_audit`

## Verify
- `pnpm lint:all && pnpm test:all`
- `pnpm dev:all` boots apps with at least one working route
- UI Console shows agents + outputs
- Logs written to `logs/{agent}/*.json`

