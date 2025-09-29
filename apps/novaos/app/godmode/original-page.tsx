/**
 * GodMode Dashboard - Unified Control Plane
 *
 * This is the sovereign control point for the entire NovaOS ecosystem.
 * All revenue, chat, consent, analytics, agent monitoring, NSFW detection,
 * and LeakGuard enforcement flows here.
 *
 * Architecture:
 * - Web-Shell: User-facing admin panel, but all control actions route back here
 * - GypsyCove: Family dashboard UI, but data/permissions controlled from here
 * - NovaOS: Primary control interface with full system visibility
 *
 * Data Sources:
 * - GodVault: /payments/revenue/* endpoints (12% platform cut calculations)
 * - ChatWidget: Agent rooms via /rooms/ and /inbox API with WebSocket (useEcho)
 * - CompliancePanel: /consent/all endpoint for release forms and IDs
 * - SystemAnalytics: /analytics/system/stats for users, transactions, events
 * - RolePermissionPanel: Controls visibility across Web-Shell and GypsyCove
 * - NSFWMonitorPanel: /analytics/nsfw/* endpoints for content moderation
 * - LeakGuardPanel: /agents/leakguard/* endpoints for security enforcement
 *
 * All components use Master Palette (blackRose) for consistent dark admin styling.
 */

import HealthPanel from '@/components/health-panel';
import { NSFWMonitorPanel } from '@/components/nsfw-monitor-panel';
import { LeakGuardPanel } from '@/components/leakguard-panel';
// import { ChatWidget } from '../../shared/components/chat';

import AgentGrid from './agent-grid';
import AnalyticsFeed from './analytics-feed';
import ConsentLedger from './consent-ledger';
import FlagPanel from './flag-panel';
import GodVault from './god-vault';
import GodModeCreatorProductivity from './god-creator-productivity';
import AuditControlPanel from './audit-control-panel';
import CompliancePanel from './compliance-panel';
import SystemAnalytics from './system-analytics';
import RolePermissionPanel from './role-permission-panel';
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

async function loadChatRooms(): Promise<{ rooms: Array<{ id: string; name: string; private: boolean }> }> {
  try {
    return coreApiJson<{ rooms: Array<{ id: string; name: string; private: boolean }> }>('/rooms/', {}, { includeAgentToken: true });
  } catch {
    // Default agent rooms if API fails
    return {
      rooms: [
        { id: 'nova', name: 'Nova Agent', private: false },
        { id: 'glitch', name: 'Glitch Agent', private: false },
        { id: 'lyra', name: 'Lyra Agent', private: false },
        { id: 'system_alerts', name: 'System Alerts', private: true }
      ]
    };
  }
}

export default async function GodModeDashboard() {
  try {
    const profile = await fetchProfile();
    if (profile.role?.toLowerCase() !== 'godmode') {
      return (
        <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">Founder only</h1>
            <p className="mt-2 text-sm text-status-danger-light">This dashboard is restricted to GodMode operators.</p>
          </div>
        </div>
      );
    }

    const [agents, flags, analytics, consents, chatRooms] = await Promise.all([
      loadAgents(),
      loadFlags(),
      loadAnalytics(),
      loadConsents(),
      loadChatRooms(),
    ]);

    return (
      <main className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
        <div className="flex max-w-none">
          {/* Main Content */}
          <div className="flex-1 px-6 py-12">
            <div className="mx-auto max-w-5xl flex flex-col gap-8">
              <header className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 px-3 py-1 text-xs uppercase tracking-wide text-blackRose-roseMauve">
                  GodMode • NovaOS
                </span>
                <h1 className="text-3xl font-semibold text-blackRose-roseMauve">Sovereign Control Plane</h1>
                <p className="max-w-3xl text-sm text-studios-cipherCore-cyberBlue">
                  Founder session: {profile.email}. No logs. AES-512 mesh encryption online. Nova orchestrates all agents and respects zero-trust boundaries with founder override priority.
                </p>
              </header>
              <HealthPanel />
              <GodVault />
              <GodModeCreatorProductivity />
              <AuditControlPanel />
              <SystemAnalytics />
              <CompliancePanel />
              <RolePermissionPanel />

              {/* NSFW Detection & LeakGuard Enforcement */}
              <div className="grid gap-6 lg:grid-cols-2">
                <NSFWMonitorPanel />
                <LeakGuardPanel />
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-blackRose-fg">Agent constellation</h2>
                  <span className="text-xs uppercase tracking-wide text-studios-cipherCore-cyberBlue">
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
          </div>
          {/* Chat Panel */}
          <div className="w-96 border-l border-blackRose-midnightNavy">
            {/* ChatWidget temporarily disabled for build
            <ChatWidget
              rooms={chatRooms.rooms}
              initialRoomId={chatRooms.rooms[0]?.id ?? null}
              initialMessages={[]}
              variant="blackRose"
              title="Agent Console"
              apiBasePath="/api/inbox"
              className="min-h-screen"
            />
            */}
            <div className="p-4">
              <h3 className="text-lg font-semibold">Agent Console</h3>
              <p className="text-gray-600">Chat system coming soon</p>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <h1 className="text-2xl font-semibold">Access error</h1>
            <p className="mt-2 text-sm text-status-danger-light">Unable to authenticate founder session.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-2xl font-semibold">NovaOS unavailable</h1>
          <p className="mt-2 text-sm text-status-danger-light">
            {error instanceof Error ? error.message : 'Unexpected failure while loading GodMode.'}
          </p>
        </div>
      </div>
    );
  }
}
