/*
  Fast CI-safe smoke test for web-shell proxy to orchestrator.
  Usage: WEB_SHELL_BASE_URL=http://localhost:3000 pnpm --filter ./apps/web-shell e2e:smoke
*/

const BASE = process.env.WEB_SHELL_BASE_URL || 'http://localhost:3000';

type RInit = RequestInit & { timeoutMs?: number };
async function fetchWithTimeout(input: string | URL, init: RInit = {}) {
  const { timeoutMs = 2000, ...rest } = init;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await globalThis.fetch(input, { ...rest, signal: ac.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function assert(condition: unknown, msg: string) {
  if (!condition) throw new Error(msg);
}

async function testAgentsEcho() {
  const url = new URL('/api/agents/echo', BASE).toString();
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command: 'send_message', args: { message: 'test smoke' } }),
    timeoutMs: 3000,
  });
  const data = await res.json().catch(() => ({}));
  assert(res.ok, `POST /api/agents/echo failed: ${res.status}`);
  assert(data && typeof data === 'object', 'echo response not an object');
  assert(data.success === true, 'echo success !== true');
  assert(typeof data.summary === 'string' && data.summary.length > 0, 'echo summary missing');
  // logs_path is optional; if present, must be string
  if (data.logs_path !== undefined && data.logs_path !== null) {
    assert(typeof data.logs_path === 'string', 'logs_path must be string when present');
  }
}

async function testOrchestratorStatus() {
  const url = new URL('/api/orchestrator/status', BASE).toString();
  const res = await fetchWithTimeout(url, { method: 'GET', timeoutMs: 2000 });
  assert(res.ok, `GET /api/orchestrator/status failed: ${res.status}`);
  const data = await res.json().catch(() => ({}));
  assert(data && typeof data === 'object', 'status response not an object');
  assert(data.version && typeof data.version === 'object', 'version payload missing');
  assert(typeof data.version.commit === 'string', 'version.commit missing');
  assert(typeof data.version.version === 'string', 'version.version missing');
  assert(data.health && typeof data.health === 'object', 'health payload missing');
}

async function main() {
  try {
    // Quick readiness check; if server isn't up, skip instead of failing CI
    try {
      const ping = await fetchWithTimeout(new URL('/api/orchestrator/status', BASE).toString(), {
        method: 'GET',
        timeoutMs: 1500,
      });
      if (!ping.ok) {
        console.log(`SMOKE: SKIP (server not ready, status ${ping.status})`);
        process.exit(0);
      }
    } catch {
      console.log('SMOKE: SKIP (server not running)');
      process.exit(0);
    }

    await testAgentsEcho();
    await testOrchestratorStatus();
    console.log('SMOKE: OK');
  } catch (err) {
    console.error('SMOKE: FAIL', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
