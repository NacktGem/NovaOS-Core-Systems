# Runbook

## Trace an Agent Call
1. Send a request and capture `x-request-id` header:
   ```bash
   curl -i -H 'x-role: GODMODE' -d '{"command":"send_message","args":{"message":"hi"}}' \
     http://localhost:8760/agents/echo
   ```
2. Inspect JSON body for `job_id`.
3. Fetch log using the agent name and `job_id`:
   ```bash
   curl -H 'x-role: GODMODE' http://localhost:8760/logs/echo/<job_id>.json
   ```
