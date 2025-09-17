import { NextResponse } from 'next/server';

import { SERVICE_CATALOG } from '@/lib/services';

type ServiceTarget = {
  name: string;
  label: string;
  description: string;
  base: string | null;
};

const HEALTH_PATHS = ['/health', '/healthz', '/internal/healthz'];

function normaliseBase(name: string, base: string | undefined): string | null {
  if (!base) return null;
  if (name === 'echo') {
    const normalised = base.replace(/^ws/i, 'http');
    return normalised.endsWith('/ws') ? normalised.slice(0, -3) : normalised;
  }
  return base;
}

function resolveTargets(): ServiceTarget[] {
  const baseOverrides: Record<string, string | undefined> = {
    'core-api': process.env.CORE_API_BASE ?? 'http://localhost:8760',
    echo: process.env.ECHO_WS ?? process.env.NEXT_PUBLIC_ECHO_WS_URL ?? 'ws://localhost:8765/ws',
    glitch: process.env.GLITCH_BASE_URL ?? 'http://localhost:8781',
    audita: process.env.AUDITA_BASE_URL ?? 'http://localhost:8770',
    velora: process.env.VELORA_BASE_URL ?? 'http://localhost:8780',
    lyra: process.env.LYRA_BASE_URL ?? 'http://localhost:8775',
    riven: process.env.RIVEN_BASE_URL ?? 'http://localhost:8772',
  };

  return SERVICE_CATALOG.map((service) => ({
    ...service,
    base: normaliseBase(service.name, baseOverrides[service.name]),
  }));
}

async function probe(target: ServiceTarget) {
  if (!target.base) {
    return {
      ...target,
      online: false,
      latency_ms: null,
      endpoint: null,
      version: null,
      commit: null,
      checked_at: new Date().toISOString(),
      error: 'missing base url',
    };
  }

  const baseUrl = target.base.replace(/\/$/, '');
  let online = false;
  let latency: number | null = null;
  let endpoint: string | null = null;
  let error: string | null = null;

  for (const path of HEALTH_PATHS) {
    const url = `${baseUrl}${path}`;
    const started = Date.now();
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        online = true;
        latency = Date.now() - started;
        endpoint = path;
        break;
      }
      error = `HTTP ${res.status}`;
    } catch (err) {
      error = String(err);
    }
  }

  let version: string | null = null;
  let commit: string | null = null;
  if (online) {
    try {
      const versionRes = await fetch(`${baseUrl}/version`, { cache: 'no-store' });
      if (versionRes.ok) {
        const payload = await versionRes.json();
        version = payload?.version ?? null;
        commit = payload?.commit ?? null;
      }
    } catch (err) {
      error = error ?? String(err);
    }
  }

  return {
    ...target,
    online,
    latency_ms: latency,
    endpoint,
    version,
    commit,
    checked_at: new Date().toISOString(),
    error,
  };
}

export async function GET() {
  const targets = resolveTargets();
  const results = await Promise.all(targets.map((target) => probe(target)));
  return NextResponse.json({ services: results, timestamp: new Date().toISOString() });
}
