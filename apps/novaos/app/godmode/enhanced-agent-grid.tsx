"use client";

import { useEffect, useMemo, useState } from "react";

// Simple icon components
const Activity = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const MessageCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const Settings = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Zap = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const Brain = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const Cpu = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x="4" y="4" width="16" height="16" rx="2" />
        <rect strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x="9" y="9" width="6" height="6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 1v3m6-3v3m4 5h3m-3 6h3m-4 4v3m-6-3v3M1 14h3m-3-6h3" />
    </svg>
);

type AgentRecord = {
    name: string;
    display_name: string;
    version: string | null;
    status: string;
    host: string | null;
    capabilities: string[];
    environment: string;
    last_seen: string | number | null;
    details: Record<string, unknown>;
};

type LLMProvider = {
    name: string;
    status: "online" | "offline" | "error";
    endpoint: string;
    models: string[];
};

interface EnhancedAgentGridProps {
    initialAgents: AgentRecord[];
    onChatWithAgent?: (agentId: string) => void;
    onRunCommand?: (agentId: string, command: string) => void;
}

const ORDER = ["nova", "glitch", "lyra", "velora", "audita", "echo", "riven"];

const AGENT_DESCRIPTIONS = {
    nova: "Core orchestration & system management",
    glitch: "Security analysis & threat intelligence",
    lyra: "Creative tutoring & educational content",
    velora: "Revenue analytics & creator optimization",
    audita: "Compliance monitoring & audit trails",
    echo: "Communication relay & message routing",
    riven: "Data mining & pattern recognition"
};

const AGENT_ICONS = {
    nova: Cpu,
    glitch: Activity,
    lyra: Brain,
    velora: Zap,
    audita: Settings,
    echo: MessageCircle,
    riven: Activity
};

function normalizeLastSeen(value: string | number | null): string {
    if (typeof value === "number") {
        const delta = Math.floor(Date.now() / 1000) - value;
        if (delta <= 5) return "now";
        if (delta < 60) return `${delta}s ago`;
        const minutes = Math.floor(delta / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    }
    if (typeof value === "string") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            const diff = Date.now() - date.getTime();
            if (diff < 30_000) return "now";
            const minutes = Math.floor(diff / 60_000);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            return `${hours}h ago`;
        }
        return value;
    }
    return "unknown";
}

function statusPalette(status: string): { badge: string; text: string; border: string; glow: string } {
    switch (status.toLowerCase()) {
        case "online":
            return {
                badge: "bg-[#0C1F1C] text-[#0CE7A1] border border-[#0CE7A1]/50",
                text: "text-[#0CE7A1]",
                border: "border-[#0CE7A1]/40",
                glow: "shadow-[0_0_20px_rgba(12,231,161,0.3)]"
            };
        case "degraded":
            return {
                badge: "bg-[#2b1d04] text-[#ffb347] border border-[#ffb347]/50",
                text: "text-[#ffb347]",
                border: "border-[#ffb347]/40",
                glow: "shadow-[0_0_20px_rgba(255,179,71,0.2)]"
            };
        default:
            return {
                badge: "bg-[#2b090f] text-[#f5b8c1] border border-[#f5b8c1]/40",
                text: "text-[#f5b8c1]",
                border: "border-[#f5b8c1]/30",
                glow: "shadow-[0_0_20px_rgba(245,184,193,0.1)]"
            };
    }
}

export default function EnhancedAgentGrid({ initialAgents, onChatWithAgent, onRunCommand }: EnhancedAgentGridProps) {
    const [agents, setAgents] = useState<AgentRecord[]>(initialAgents);
    const [llmProviders, setLLMProviders] = useState<LLMProvider[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [commandText, setCommandText] = useState("");
    const [executingCommand, setExecutingCommand] = useState<string | null>(null);

    const orderedAgents = useMemo(() => {
        const map = new Map(agents.map((agent) => [agent.name, agent]));
        return ORDER.map((name) => map.get(name)).filter(Boolean) as AgentRecord[];
    }, [agents]);

    // Poll for agent updates
    useEffect(() => {
        let cancelled = false;
        async function sync() {
            try {
                const res = await fetch("/api/agents", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && Array.isArray(data.agents)) {
                    setAgents(data.agents as AgentRecord[]);
                }
            } catch (err) {
                console.error("Agent poll failed", err);
            }
        }
        sync();
        const interval = setInterval(sync, 10_000); // More frequent updates
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    // Poll for LLM provider status
    useEffect(() => {
        let cancelled = false;
        async function checkLLM() {
            try {
                const res = await fetch("/api/llm/health", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) {
                    setLLMProviders(data.providers || []);
                }
            } catch (err) {
                console.error("LLM health check failed", err);
            }
        }
        checkLLM();
        const interval = setInterval(checkLLM, 15_000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    const handleRunCommand = async (agentName: string, command: string) => {
        if (!command.trim()) return;

        setExecutingCommand(agentName);
        try {
            const res = await fetch(`/api/agents/${agentName}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command, args: {} })
            });

            const result = await res.json();
            if (result.success) {
                console.log(`Command executed on ${agentName}:`, result.output);
                setCommandText("");
                if (onRunCommand) {
                    onRunCommand(agentName, command);
                }
            } else {
                console.error(`Command failed on ${agentName}:`, result.error);
            }
        } catch (err) {
            console.error(`Command execution failed:`, err);
        } finally {
            setExecutingCommand(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* LLM Provider Status */}
            {llmProviders.length > 0 && (
                <div className="relative rounded-3xl border border-[#dc2626]/30 bg-gradient-to-br from-[#1a0a1a]/80 to-[#0a0a0f]/60 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#dc2626]/10 to-transparent rounded-3xl"></div>
                    <div className="relative">
                        <h3 className="text-xl font-bold text-[#e2e8f0] mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0CE7A1]/20 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-[#0CE7A1] animate-pulse"></div>
                            </div>
                            LLM Provider Network
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {llmProviders.map((provider) => {
                                const palette = statusPalette(provider.status);
                                return (
                                    <div
                                        key={provider.name}
                                        className={`relative rounded-2xl border ${palette.border} bg-gradient-to-br from-[#1a1a2a]/80 to-[#0a0a0f]/40 backdrop-blur-lg p-5 hover:scale-105 transition-all duration-300 ${palette.glow}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-bold text-[#e2e8f0]">{provider.name}</span>
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${palette.badge} shadow-lg`}>
                                                    {provider.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#94a3b8] mb-2 font-mono">{provider.endpoint}</p>
                                            <p className="text-xs text-[#6faab1] font-semibold">
                                                {provider.models.length} models available
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Agent Grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {orderedAgents.map((agent) => {
                    const palette = statusPalette(agent.status);
                    const IconComponent = AGENT_ICONS[agent.name as keyof typeof AGENT_ICONS] || Activity;
                    const isSelected = selectedAgent === agent.name;
                    const isExecuting = executingCommand === agent.name;

                    return (
                        <article
                            key={agent.name}
                            className={`group relative rounded-3xl border ${palette.border} bg-gradient-to-br from-[#1a1a2a]/90 to-[#0a0a0f]/60 backdrop-blur-xl p-8 transition-all duration-500 hover:scale-105 ${palette.glow} ${isSelected ? 'ring-2 ring-[#dc2626] ring-offset-2 ring-offset-[#0a0a0f] scale-105' : ''} overflow-hidden`}
                        >
                            {/* Background gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#dc2626]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Animated border glow */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-[#dc2626]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>

                            <div className="relative z-10">
                                <header className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`relative rounded-2xl p-3 ${palette.badge.split(' ')[0]} ${palette.border} shadow-lg`}>
                                            <IconComponent className="h-6 w-6 drop-shadow" />
                                            {agent.status.toLowerCase() === "online" && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#0CE7A1] animate-ping"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#e2e8f0] drop-shadow">{agent.display_name}</h3>
                                            <p className="text-xs uppercase tracking-wide text-[#6faab1] font-semibold">{agent.environment}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-4 py-2 text-xs font-bold ${palette.badge} shadow-lg`}>
                                        {agent.status.toUpperCase()}
                                    </span>
                                </header>

                                {/* Agent Description */}
                                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1a1a2a]/50 to-transparent border border-white/10">
                                    <p className="text-sm text-[#94a3b8] font-medium">
                                        {AGENT_DESCRIPTIONS[agent.name as keyof typeof AGENT_DESCRIPTIONS] || "Specialized agent"}
                                    </p>
                                </div>

                                <dl className="space-y-4 text-sm mb-8">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1a1a2a]/30 to-transparent">
                                        <dt className="text-[#94a3b8] font-semibold">Version</dt>
                                        <dd className="text-[#e2e8f0] font-bold">{agent.version ?? "—"}</dd>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1a1a2a]/30 to-transparent">
                                        <dt className="text-[#94a3b8] font-semibold">Host</dt>
                                        <dd className="text-[#e2e8f0] font-mono text-xs">{agent.host ?? "offline"}</dd>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1a1a2a]/30 to-transparent">
                                        <dt className="text-[#94a3b8] font-semibold">Capabilities</dt>
                                        <dd className="text-right text-[#e2e8f0] text-xs font-semibold">
                                            {agent.capabilities.length ? agent.capabilities.slice(0, 2).join(", ") + (agent.capabilities.length > 2 ? "..." : "") : "—"}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#1a1a2a]/30 to-transparent">
                                        <dt className="text-[#94a3b8] font-semibold">Last seen</dt>
                                        <dd className={`text-right font-bold ${palette.text}`}>{normalizeLastSeen(agent.last_seen)}</dd>
                                    </div>
                                </dl>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mb-6">
                                    <button
                                        onClick={() => onChatWithAgent?.(agent.name)}
                                        disabled={agent.status.toLowerCase() !== "online"}
                                        className="flex-1 rounded-2xl bg-gradient-to-r from-[#dc2626]/20 to-[#dc2626]/10 border border-[#dc2626]/50 px-4 py-3 text-sm font-bold text-[#dc2626] hover:from-[#dc2626]/30 hover:to-[#dc2626]/20 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg backdrop-blur-sm"
                                    >
                                        <MessageCircle className="h-4 w-4 inline mr-2" />
                                        Chat
                                    </button>
                                    <button
                                        onClick={() => setSelectedAgent(isSelected ? null : agent.name)}
                                        className="rounded-2xl bg-gradient-to-r from-[#6faab1]/20 to-[#6faab1]/10 border border-[#6faab1]/50 px-4 py-3 text-sm font-bold text-[#6faab1] hover:from-[#6faab1]/30 hover:to-[#6faab1]/20 hover:scale-105 transition-all duration-300 shadow-lg backdrop-blur-sm"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Quick Command Interface */}
                                {isSelected && agent.status.toLowerCase() === "online" && (
                                    <div className="border-t border-[#dc2626]/30 pt-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex gap-3 mb-4">
                                            <input
                                                type="text"
                                                placeholder="Enter command..."
                                                value={commandText}
                                                onChange={(e) => setCommandText(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleRunCommand(agent.name, commandText);
                                                    }
                                                }}
                                                className="flex-1 rounded-xl border border-[#1a1a2a]/50 bg-gradient-to-r from-[#0a0a0f]/80 to-[#1a1a2a]/40 backdrop-blur-lg px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#94a3b8] focus:border-[#dc2626]/50 focus:outline-none focus:ring-2 focus:ring-[#dc2626]/20 transition-all duration-300"
                                            />
                                            <button
                                                onClick={() => handleRunCommand(agent.name, commandText)}
                                                disabled={isExecuting || !commandText.trim()}
                                                className="rounded-xl bg-gradient-to-r from-[#dc2626] to-[#dc2626]/80 px-5 py-3 text-sm font-bold text-white hover:from-[#dc2626]/90 hover:to-[#dc2626]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                                            >
                                                {isExecuting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : "Run"}
                                            </button>
                                        </div>
                                        {/* Quick Commands */}
                                        <div className="flex flex-wrap gap-2">
                                            {agent.capabilities.slice(0, 3).map((cmd) => (
                                                <button
                                                    key={cmd}
                                                    onClick={() => setCommandText(cmd)}
                                                    className="rounded-lg bg-gradient-to-r from-[#1a1a2a]/60 to-[#1a1a2a]/40 px-3 py-2 text-xs text-[#6faab1] hover:from-[#1a1a2a]/80 hover:to-[#1a1a2a]/60 hover:text-[#e2e8f0] transition-all duration-300 border border-[#6faab1]/20 font-semibold"
                                                >
                                                    {cmd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
