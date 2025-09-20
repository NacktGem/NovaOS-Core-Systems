import { NextRequest, NextResponse } from 'next/server';

type RateRecord = { count: number; resetAt: number };

declare global {
  // extend globalThis for the in-memory rate map used in dev
  var __unlockRate: Map<string, RateRecord> | undefined;
}

// simple in-memory rate limiter: per-IP limit (note: ephemeral, use Redis for prod)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

if (!globalThis.__unlockRate) globalThis.__unlockRate = new Map<string, RateRecord>();
const rateMap: Map<string, RateRecord> = globalThis.__unlockRate as Map<string, RateRecord>;

function getIp(req: NextRequest) {
  // prefer x-forwarded-for, fallback to unknown - in production behind proxy this should be set
  const xf = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  if (xf) return xf.split(',')[0].trim();
  return 'unknown';
}

function constantTimeEquals(a: string, b: string) {
  // simple constant-time comparison
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}

export async function POST(req: NextRequest) {
  // Only accept JSON
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return NextResponse.json({ ok: false, error: 'invalid_content_type' }, { status: 400 });
  }

  const ip = getIp(req);
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (rec && rec.resetAt > now && rec.count >= RATE_LIMIT_MAX) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const pass = typeof body?.password === 'string' ? body.password : '';

    if (!pass) {
      // increment counter for bad attempts
      const next =
        rec && rec.resetAt > now
          ? { count: (rec.count || 0) + 1, resetAt: rec.resetAt }
          : { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
      rateMap.set(ip, next);
      return NextResponse.json({ ok: false, error: 'missing_password' }, { status: 400 });
    }

    const expected = process.env.UNLOCK_PASSWORD;
    if (!expected) {
      console.error('unlock endpoint misconfigured: UNLOCK_PASSWORD missing');
      return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });
    }
    const ok = constantTimeEquals(pass, expected);

    if (ok) {
      // reset on success
      rateMap.delete(ip);
      // redirect to Black Rose Collective login after unlock
      return NextResponse.json({ ok: true, redirect: '/login' });
    }

    // failed attempt -> increment
    const next =
      rec && rec.resetAt > now
        ? { count: (rec.count || 0) + 1, resetAt: rec.resetAt }
        : { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(ip, next);
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    // do not leak exception details to client
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
}
