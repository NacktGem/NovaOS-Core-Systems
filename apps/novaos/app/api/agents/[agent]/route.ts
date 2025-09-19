import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/');
  const idx = parts.lastIndexOf('agents');
  const agent = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';

  if (!agent) {
    return NextResponse.json({ error: 'missing_agent' }, { status: 400 });
  }

  let raw: unknown = {};
  try {
    raw = await request.json();
  } catch {}

  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const command = typeof b.command === 'string' ? b.command : '';
  const args =
    typeof b.args === 'object' && b.args !== null && !Array.isArray(b.args)
      ? (b.args as Record<string, unknown>)
      : {};
  const log = Boolean(b?.log);

  if (!command) {
    return NextResponse.json({ error: 'missing_command' }, { status: 400 });
  }

  const base = (process.env.ORCHESTRATOR_URL || 'http://nova-orchestrator:8000').replace(
    /\/+$/,
    ''
  );
  const token = process.env.AGENT_SHARED_TOKEN || process.env.NOVA_AGENT_TOKEN || '';
  const payload = { agent, command, args, log };

  try {
    const r = await fetch(`${base}/run`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-agent-token': token } : {}),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'proxy_error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
