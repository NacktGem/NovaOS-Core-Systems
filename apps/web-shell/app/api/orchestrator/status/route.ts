import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.ORCHESTRATOR_URL || 'http://nova-orchestrator:8000').replace(
    /\/+$/,
    ''
  );
  try {
    const [h, v] = await Promise.all([
      fetch(`${base}/internal/healthz`, { cache: 'no-store' }),
      fetch(`${base}/version`, { cache: 'no-store' }),
    ]);
    const health = (await h.json().catch(() => ({}))) as unknown;
    const version = (await v.json().catch(() => ({}))) as unknown;
    return NextResponse.json({ health, version }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'proxy_error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
