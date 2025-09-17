import { cookies } from 'next/headers';

import HealthPanel from '@/components/health-panel';

const CORE_API = process.env.CORE_API_BASE ?? 'http://localhost:8760';

async function fetchProfile(cookieHeader: string): Promise<any | null> {
  try {
    const res = await fetch(`${CORE_API}/me`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GodModeDashboard() {
  const cookieHeader = cookies().toString();
  const profile = await fetchProfile(cookieHeader);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#000003] text-[#F5E5ED]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-semibold">Access error</h1>
          <p className="mt-2 text-sm text-[#f5b8c1]">Unable to fetch profile details.</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'GODMODE') {
    return (
      <div className="min-h-screen bg-[#000003] text-[#F5E5ED]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-semibold">Founder only</h1>
          <p className="mt-2 text-sm text-[#f5b8c1]">This dashboard is restricted to GodMode operators.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: '#000003', color: '#F5E5ED' }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#431D21] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
            GodMode / Founder
          </span>
          <h1 className="text-3xl font-semibold text-[#A33A5B]">NovaOS Health Dashboard</h1>
          <p className="max-w-2xl text-sm text-[#6faab1]">
            Unified service telemetry for Nova&apos;s sovereign agent mesh. Polling every 10 seconds with optional version handshakes.
          </p>
        </header>
        <HealthPanel />
      </div>
    </main>
  );
}
