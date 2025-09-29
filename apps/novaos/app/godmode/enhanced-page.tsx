/**
 * Enhanced GodMode Dashboard - Master Control Interface with LLM Integration
 *
 * This is the enhanced sovereign control point for the entire NovaOS ecosystem.
 * Features enhanced agent management, integrated LLM chat, and real-time monitoring.
 *
 * New Features:
 * - Direct agent communication with LLM streaming
 * - Enhanced agent grid with command execution
 * - Multi-provider LLM integration (OpenAI, Ollama, LM Studio)
 * - Real-time agent health monitoring
 * - Advanced agent management console
 *
 * Architecture:
 * - Enhanced Agent Grid: Real-time monitoring with direct command execution
 * - LLM Chat Panel: Direct agent communication with streaming responses
 * - All existing GodMode features preserved and enhanced
 */

import HealthPanel from '@/components/health-panel';
import { NSFWMonitorPanel } from '@/components/nsfw-monitor-panel';
import { LeakGuardPanel } from '@/components/leakguard-panel';

import EnhancedAgentGrid from './enhanced-agent-grid';
import LLMChatPanel from './llm-chat-panel';
import AnalyticsFeed from './analytics-feed';
import ConsentLedger from './consent-ledger';
import FlagPanel from './flag-panel';
import GodVault from './god-vault';
import GodModeCreatorProductivity from './god-creator-productivity';
import AuditControlPanel from './audit-control-panel';
import CompliancePanel from './compliance-panel';
import SystemAnalytics from './system-analytics';
import RolePermissionPanel from './role-permission-panel';
import GypsyCoveManagementPanel from './gypsy-cove-panel';
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

export default async function EnhancedGodModeDashboard() {
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

        const [agents, flags, analytics, consents] = await Promise.all([
            loadAgents(),
            loadFlags(),
            loadAnalytics(),
            loadConsents(),
        ]);

        return (
            <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a1a] to-[#1a1a2a] text-[#e2e8f0]">
                <div className="flex max-w-none">
                    {/* Main Content */}
                    <div className="flex-1 px-8 py-14">
                        <div className="mx-auto max-w-7xl flex flex-col gap-10">
                            <header className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#dc2626] bg-[#1a0a1a]/80 px-4 py-2 text-sm uppercase tracking-wide text-[#dc2626] shadow-lg">
                                        <span className="font-bold">GodMode</span> • Enhanced • NovaOS
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#0CE7A1] animate-pulse shadow-lg"></div>
                                        <span className="text-sm text-[#6faab1] font-semibold">LLM Integration Active</span>
                                    </div>
                                </div>
                                <h1 className="text-4xl font-extrabold text-[#dc2626] drop-shadow-lg">Sovereign Control Plane</h1>
                                <p className="max-w-3xl text-base text-[#6faab1] font-medium">
                                    Enhanced founder session: <span className="font-bold text-[#e2e8f0]">{profile.email}</span>. Direct agent communication enabled. Multi-provider LLM integration active. Nova orchestrates all agents with LLM-enhanced capabilities and founder override priority.
                                </p>
                            </header>

                            {/* System Health & Core Panels */}
                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                <HealthPanel />
                                <GodVault />
                                <GodModeCreatorProductivity />
                                <AuditControlPanel />
                                <SystemAnalytics />
                                <CompliancePanel />
                                <RolePermissionPanel />
                            </div>

                            {/* NSFW Detection & LeakGuard Enforcement */}
                            <div className="grid gap-8 md:grid-cols-2">
                                <NSFWMonitorPanel />
                                <LeakGuardPanel />
                            </div>

                            {/* Enhanced Agent Management */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-bold text-[#e2e8f0] drop-shadow">Enhanced Agent Constellation</h2>
                                    <div className="flex items-center gap-6">
                                        <span className="text-sm uppercase tracking-wide text-[#6faab1] font-semibold">
                                            {agents.agents.length} active agents
                                        </span>
                                        <span className="text-sm text-[#dc2626] font-semibold">
                                            LLM-Enhanced • Direct Command • Streaming Chat
                                        </span>
                                    </div>
                                </div>
                                <EnhancedAgentGrid
                                    initialAgents={agents.agents}
                                    onChatWithAgent={(agentId) => {
                                        // This will be handled by the LLM Chat Panel
                                        console.log('Chat with agent:', agentId);
                                    }}
                                    onRunCommand={(agentId, command) => {
                                        console.log('Command executed:', agentId, command);
                                    }}
                                />
                            </section>

                            {/* Traditional panels */}
                            <FlagPanel initialFlags={flags.flags} />

                            {/* Gypsy Cove Management Panel */}
                            <section>
                                <GypsyCoveManagementPanel />
                            </section>

                            <section className="grid gap-8 md:grid-cols-2">
                                <AnalyticsFeed initialEvents={analytics} />
                                <ConsentLedger initialConsents={consents.slice(0, 12)} />
                            </section>
                        </div>
                    </div>

                    {/* Enhanced LLM Chat Panel */}
                    <div className="w-[440px] bg-gradient-to-b from-[#1a0a1a]/80 to-[#0a0a0f]/90 shadow-2xl rounded-l-3xl border-l border-[#dc2626]/30">
                        <LLMChatPanel
                            agents={agents.agents.map(a => ({
                                name: a.name,
                                display_name: a.display_name,
                                status: a.status
                            }))}
                            className="min-h-screen"
                        />
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
                        <p className="mt-2 text-sm text-status-danger-light">Unable to authenticate enhanced founder session.</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
                <div className="mx-auto max-w-2xl px-6 py-16">
                    <h1 className="text-2xl font-semibold">Enhanced NovaOS unavailable</h1>
                    <p className="mt-2 text-sm text-status-danger-light">
                        {error instanceof Error ? error.message : 'Unexpected failure while loading Enhanced GodMode.'}
                    </p>
                    <p className="mt-1 text-xs text-studios-inkSteel-neutral">
                        LLM integration and enhanced agent management temporarily offline.
                    </p>
                </div>
            </div>
        );
    }
}
