'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthResponse, SERVICE_CATALOG } from '@/lib/services';

type ServiceState = HealthResponse['services'][number];

const COLOR = {
  roseMauve: '#A33A5B',
  deepRosewood: '#89333F',
  bloodBrown: '#431D21',
  trueBlack: '#000003',
  midnightNavy: '#19212A',
  deepTeal: '#013E43',
  emerald: '#0CE7A1',
  signal: '#E66F5C',
};

export default function HealthPanel(): JSX.Element {
  const [status, setStatus] = useState<ServiceState[]>(() =>
    SERVICE_CATALOG.map((service) => ({
      ...service,
      online: false,
      latency_ms: null,
      endpoint: null,
      version: null,
      commit: null,
      checked_at: new Date(0).toISOString(),
      error: 'awaiting first probe',
    })),
  );
  const [timestamp, setTimestamp] = useState<string>(new Date(0).toISOString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const json: HealthResponse = await res.json();
        if (!mounted) return;
        setStatus(json.services);
        setTimestamp(json.timestamp);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
      }
    }

    load();
    const timer = setInterval(load, 10_000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const counters = useMemo(() => {
    const online = status.filter((service) => service.online).length;
    return { online, total: status.length };
  }, [status]);

  return (
    <div
      className="rounded-3xl border border-[#431D21] bg-[#050109]/80 p-6 backdrop-blur"
      style={{ boxShadow: '0 45px 120px rgba(0,0,0,0.55)' }}
    >
      <div className="flex flex-col gap-2 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: COLOR.roseMauve }}>
              Sovereign Health Mesh
            </h2>
            <p className="text-sm" style={{ color: COLOR.deepTeal }}>
              Live probe against /health* for every agent service. Updated {new Date(timestamp).toLocaleTimeString()}.
            </p>
          </div>
          <div className="flex gap-3">
            <MetricBadge label="Online" value={counters.online} tone="good" />
            <MetricBadge label="Total" value={counters.total} tone="neutral" />
          </div>
        </div>
        {error && (
          <div className="rounded-xl border border-[#7c2d2d] bg-[#2b090f] px-4 py-2 text-sm" role="alert">
            Probe error: {error}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {status.map((service) => (
          <Card
            key={service.name}
            className="h-full border-[#431D21] bg-[#0D111A]/90"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.45)' }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{service.label}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </div>
                <StatusPill online={service.online} latency={service.latency_ms} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow k="Endpoint" v={service.endpoint ?? 'n/a'} />
              <InfoRow k="Version" v={service.version ?? 'unknown'} />
              <InfoRow k="Commit" v={service.commit ?? '—'} />
              <InfoRow k="Checked" v={new Date(service.checked_at).toLocaleTimeString()} />
              {service.error && (
                <p className="rounded-lg border border-[#7c2d2d] bg-[#2b090f] px-3 py-2 text-xs text-[#f5b8c1]">
                  {service.error}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusPill({
  online,
  latency,
}: {
  online: boolean;
  latency: number | null;
}): JSX.Element {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: online ? 'rgba(12, 231, 161, 0.12)' : 'rgba(230, 111, 92, 0.12)',
        color: online ? '#0CE7A1' : '#E66F5C',
        border: `1px solid ${online ? 'rgba(12,231,161,0.45)' : 'rgba(230,111,92,0.45)'}`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: online ? '#0CE7A1' : '#E66F5C' }}
        aria-hidden
      />
      <span>{online ? 'Online' : 'Offline'}</span>
      {typeof latency === 'number' && (
        <span className="text-[10px] opacity-80">{latency} ms</span>
      )}
    </div>
  );
}

function MetricBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'good' | 'neutral';
}): JSX.Element {
  const palette = tone === 'good'
    ? { bg: 'rgba(12,231,161,0.15)', border: 'rgba(12,231,161,0.45)', color: '#0CE7A1' }
    : { bg: 'rgba(163,58,91,0.15)', border: 'rgba(163,58,91,0.35)', color: '#A33A5B' };

  return (
    <div
      className="flex flex-col rounded-xl px-3 py-2 text-xs"
      style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color }}
    >
      <span className="uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-[#6faab1]">{k}</span>
      <span className="truncate text-sm text-[#F5E5ED]" title={v}>
        {v}
      </span>
    </div>
  );
}
