# AGENT_SPEC.md — NovaOS Agent Role + Logic Definition

This file defines the **role, capabilities, input/output schema, and behavior** for each agent in NovaOS.  
All logic in `.codexrc.md` must follow these specs exactly — no placeholders.

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

Requirements
	•	Every agent defines: name, version, description
	•	run() always accepts a JSON-safe dict payload
	•	Must return Standard Response Schema (below)
	•	If log: true → persist to logs/{agent}/{timestamp}.json

⸻

🎯 Agent Logic Specs

1. Nova — Orchestrator, Master AI
	•	Role: Platform AI, emotional UX, agent orchestrator
	•	Triggers: User commands, system boot, 3D/voice UI
	•	Functions:
	•	Route jobs to all other agents
	•	Persist memory, session, state
	•	Console, voice, and UI presence
	•	Emergency restore from backup
	•	Commands:
	•	route_job: Forward payload to target agent
	•	session_save: Save current memory/session
	•	session_restore: Restore last known state
	•	emergency_recover: Load backup and reinit system

⸻

2. Glitch — Forensics, Red/Blue Team, Jailbreaking
	•	Role: Digital forensics, threat response, exploit scanner
	•	Triggers: CLI or agent requests
	•	Functions:
	•	Analyze disk/memory, scrub logs, simulate attacks
	•	Output forensic JSON reports under /logs/glitch/*.json
	•	Sandbox detection, entropy scans, honeypot/keylog detection
	•	Tools: SleuthKit, Volatility, Hydra, Nmap, etc.
	•	Commands:
	•	hash_file: Return sha256, md5 of file
	•	scan_system: Run system forensic scan
	•	detect_entropy: Check for suspicious randomness in file
	•	sandbox_check: Detect VM/sandbox environment
	•	network_probe: Basic nmap scan of host

⸻

3. Lyra — Creative, Herbalist, Educational
	•	Role: Creator support, AI tutor, herbalist, project planner
	•	Triggers: Family/child input, Nova handoff
	•	Functions:
	•	Generate curriculum, lesson plans, creative prompts
	•	Herb scanner/journal, dosing guides
	•	Sync child progress with Riven
	•	Store outputs under /logs/lyra/ or /data/
	•	Commands:
	•	generate_lesson: Create lesson plan for topic/grade
	•	evaluate_progress: Track and store student progress
	•	create_prompt: Output writing/art prompt
	•	herb_log: Save herb details to journal
	•	dose_guide: Suggest herbal dosage guidelines

⸻

4. Velora — Analytics, Sales, Business Engine
	•	Role: Business dashboards, automation, CRM engine
	•	Triggers: Cron jobs, Nova calls, Echo events
	•	Functions:
	•	Marketing content, analytics reports, growth stats
	•	Schedule posts, forecast revenue, generate ads
	•	Integrate with Audita for financial/tax hooks
	•	Commands:
	•	generate_report: Business/traffic report
	•	schedule_post: Schedule social post
	•	forecast_revenue: Predict income from data
	•	crm_export: Export customer/lead info
	•	ad_generate: Auto-create ad copy or asset

⸻

5. Audita — Compliance, Legal, Consent, Tax
	•	Role: Legal/DMCA manager, tax reporter, audit logger
	•	Triggers: File uploads, admin requests
	•	Functions:
	•	Consent chain validation, GDPR scans, 4LE tracking
	•	ID/release PDF storage, emergency lockout triggers
	•	Export CSV/PDF audits to logs/legal/ or vault/
	•	TaxOrganizer AI: crypto, receipts, flag alerts
	•	Commands:
	•	validate_consent: Verify release/ID form chain
	•	gdpr_scan: Scan data for GDPR violations
	•	generate_audit: Export audit log PDF/CSV
	•	tax_report: Compile tax-ready data
	•	dmca_notice: Generate DMCA takedown notice

⸻

6. Echo — Comms + AI Notification Relay
	•	Role: Push alert engine, AI-to-AI comms, file sharing
	•	Triggers: Internal agent events, API sync
	•	Functions:
	•	Push messages between agents/devices (Nova ↔ Quinn)
	•	Encrypted voice notes, file/screen relay
	•	Real-time alert delivery (family, business, security)
	•	Commands:
	•	send_message: Relay text/JSON payload
	•	send_file: Relay file between agents
	•	send_voice: Transmit encrypted voice note
	•	broadcast: Push alert to all connected nodes

⸻

7. Riven — Parental, Medical, Survival AI
	•	Role: Family monitor, field support, off-grid failover
	•	Triggers: GPS/device/mic/video signals, Nova orchestrations
	•	Functions:
	•	GPS, mic, screen, and app monitoring (child tracking)
	•	Medical symptom logs, protocol creation
	•	Bugout maps, alert escalation, blackout/wipe command
	•	Off-grid comms: mesh/ham planner, power usage logs
	•	Commands:
	•	track_device: Log GPS/mic/screen activity
	•	log_symptom: Save medical observation
	•	generate_protocol: Create medical/field protocol
	•	bugout_map: Export safe route map
	•	wipe_device: Secure erase + lockout

⸻

📥 Input Payload (Universal Schema)

{
  "agent": "glitch",
  "command": "hash_file",
  "args": {
    "path": "artifacts/test.txt",
    "log": true
  }
}


⸻

📤 Standard Response Format

{
  "success": true,
  "output": {
    "summary": "Hash complete",
    "sha256": "abc123...",
    "md5": "def456..."
  },
  "error": null
}

Required fields
	•	success: true/false
	•	output: dict of results (never raw string only)
	•	error: string or null

Logging behavior
	•	If args.log: true, the output must be written to:

logs/{agent}/{timestamp}.json



⸻

✅ This file is authoritative.
All Codex commits for Phase 2+3 must conform exactly.

---

This version now gives **exact command sets** per agent, so Codex won’t improvise — it will know to implement `hash_file` for Glitch, `generate_lesson` for Lyra, etc.  
