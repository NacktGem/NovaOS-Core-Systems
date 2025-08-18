# AGENT_SPEC.md — NovaOS Agent Role + Logic Definition

This file defines the full role, capabilities, input/output schema, and behavior for each agent in NovaOS.

All logic in `.codexrc.md` must follow these specs.

---

## 🧠 BaseAgent Interface

All agents must subclass this interface (Python):

```python
class BaseAgent:
    name: str
    version: str
    description: str

    def run(self, payload: dict) -> dict:
        """
        Takes a JSON-safe dict payload, returns JSON-safe result.
        All exceptions must return { "error": "..." }
        """
        raise NotImplementedError
```

---

## 🎯 Agent Logic Specs

---

### 1. `nova` — Orchestrator, Master AI

- **Role**: Platform AI, emotional UX, agent orchestrator
- **Triggers**: User commands, system boot, 3D/voice UI
- **Functions**:
  - Route jobs to all other agents
  - Persist memory, session, state
  - Console, voice, and UI presence
  - Emergency restore from backup

---

### 2. `glitch` — Forensics, Red/Blue Team, Jailbreaking

- **Role**: Digital forensics, threat response, exploit scanner
- **Triggers**: CLI or agent requests
- **Functions**:
  - Analyze disk/memory, scrub logs, simulate attacks
  - Output to `/logs/glitch/*.json`
  - Sandbox detection, entropy scans, keylog/honeypot (optional)
  - Tools: SleuthKit, Volatility, Hydra, Nmap, etc.

---

### 3. `lyra` — Creative, Herbalist, Educational

- **Role**: Creator support, AI tutor, herbalist, project planner
- **Triggers**: Family/child input, Nova handoff
- **Functions**:
  - Generate curriculum, creative prompts
  - Herb scanner/journal, dosing guides
  - Sync child progress with `riven`
  - Outputs saved to `/logs/lyra/` or `data/`

---

### 4. `velora` — Analytics, Sales, Business Engine

- **Role**: Business dashboards, auto-posting, CRM engine
- **Triggers**: Cron jobs, Nova calls, Echo events
- **Functions**:
  - Marketing content, analytics reports, growth stats
  - Schedule posts, forecast revenue, generate ads
  - Integrate with `audita` for financial/tax hooks

---

### 5. `audita` — Compliance, Legal, Consent, Tax

- **Role**: Legal/DMCA manager, tax reporter, audit logger
- **Triggers**: File uploads, admin requests
- **Functions**:
  - Consent chain validation, GDPR scans, 4LE tracking
  - ID/release PDF storage, emergency lockout triggers
  - Export CSV/PDF audits to `logs/legal/` or `vault/`
  - TaxOrganizer AI: crypto, receipts, flag alerts

---

### 6. `echo` — Comms + AI Notification Relay

- **Role**: Push alert engine, AI-to-AI comms, file sharing
- **Triggers**: Internal agent events, API sync
- **Functions**:
  - Push messages between agents/devices (Nova ↔ Quinn)
  - Encrypted voice notes, screen/file relay
  - Real-time alert delivery (child, business, security)

---

### 7. `riven` — Parental, Medical, Survival AI

- **Role**: Family monitor, field support, off-grid failover
- **Triggers**: GPS/device/mic/video signals, Nova
- **Functions**:
  - GPS, mic, screen, app monitoring (child tracking)
  - Medical symptom logs, protocol creation
  - Bugout map, alert escalation, blackout/wipe command
  - Off-grid comms: mesh/ham planner, power logs

---

## 📥 Input Payload (Standard for all agents)

```json
{
  "agent": "glitch",
  "command": "run_scan",
  "args": {
    "depth": "full",
    "log": true
  }
}
```

## 📤 Output Format (Standard Response)

```json
{
  "success": true,
  "output": {
    "summary": "Scan complete",
    "report": "logs/glitch/scan-0825.json"
  },
  "error": null
}
```

- All agents must return:
  - `success: true/false`
  - `output`: result dict
  - `error`: string or null
- If `log: true` is passed, save output to `/logs/{agent}/timestamp.json`