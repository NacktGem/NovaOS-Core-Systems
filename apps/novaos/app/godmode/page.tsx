import HealthPanel from '@/components/health-panel';

import AgentGrid from './agent-grid';
import AnalyticsFeed from './analytics-feed';
import ConsentLedger from './consent-ledger';
import FlagPanel from './flag-panel';
import { CoreApiError, coreApiJson } from '@/lib/core-api';

type Profile = {
  id: string;
  email: string;
  role: string;
};

type AgentsResponse = {
  agents: Array<{
    name: string;
    display_name: string;
    version: string | null;
    status: string;
    host: string | null;
    capabilities: string[];
    environment: string;
    last_seen: string | number | null;
    details: Record<string, unknown>;
  }>;
};

type FlagsResponse = {
  flags: Record<string, {
    value: boolean;
    updated_at: string | null;
    updated_by: string | null;
  }>;
};

type AnalyticsEvent = {
  id: string;
  event_name: string;
  props: Record<string, unknown>;
  created_at: string;
};

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

async function fetchProfile(): Promise<Profile> {
  return coreApiJson<Profile>('/me');
}

async function loadAgents(): Promise<AgentsResponse> {
  return coreApiJson<AgentsResponse>('/agents', {}, { includeAgentToken: true });
}

async function loadFlags(): Promise<FlagsResponse> {
  return coreApiJson<FlagsResponse>('/platform/flags');
}

async function loadAnalytics(): Promise<AnalyticsEvent[]> {
  return coreApiJson<AnalyticsEvent[]>('/analytics/events?limit=25');
}

async function loadConsents(): Promise<ConsentRecord[]> {
  return coreApiJson<ConsentRecord[]>('/consent/');
}

export default async function GodModeDashboard() {
  try {
    const profile = await fetchProfile();
    if (profile.role?.toLowerCase() !== 'godmode') {
      return (
        <div className="min-h-screen bg-[#000003] text-[#F5E5ED]">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">Founder only</h1>
            <p className="mt-2 text-sm text-[#f5b8c1]">This dashboard is restricted to GodMode operators.</p>
          </div>
        </div>
      );
    }

    const [agents, flags, analytics, consents] = await Promise.all([
      loadAgents(),
      loadFlags(),
      loadAnalytics(),
      loadConsents(),
    ]);

    return (
      <main className="min-h-screen bg-[#000003] text-[#F5E5ED]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
          <header className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#431D21] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
              GodMode • NovaOS
            </span>
            <h1 className="text-3xl font-semibold text-[#A33A5B]">Sovereign Control Plane</h1>
            <p className="max-w-3xl text-sm text-[#6faab1]">
              Founder session: {profile.email}. No logs. AES-512 mesh encryption online. Nova orchestrates all agents and respects zero-trust boundaries with founder override priority.
            </p>
          </header>
          <HealthPanel />
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[#F5DCE9]">Agent constellation</h2>
              <span className="text-xs uppercase tracking-wide text-[#6faab1]">
                {agents.agents.length} active agents
              </span>
            </div>
            <AgentGrid initialAgents={agents.agents} />
          </section>
          <FlagPanel initialFlags={flags.flags} />
          <section className="grid gap-6 lg:grid-cols-2">
            <AnalyticsFeed initialEvents={analytics} />
            <ConsentLedger initialConsents={consents.slice(0, 12)} />
          </section>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="min-h-screen bg-[#000003] text-[#F5E5ED]">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">Access error</h1>
            <p className="mt-2 text-sm text-[#f5b8c1]">Unable to authenticate founder session.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#000003] text-[#F5E5ED]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-semibold">NovaOS unavailable</h1>
          <p className="mt-2 text-sm text-[#f5b8c1]">
            {error instanceof Error ? error.message : 'Unexpected failure while loading GodMode.'}
          </p>
        </div>
      </div>
    );
  }
}
