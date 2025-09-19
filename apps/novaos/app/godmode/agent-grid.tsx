"use client";

import { useEffect, useMemo, useState } from "react";

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

interface AgentGridProps {
  initialAgents: AgentRecord[];
}

const ORDER = ["nova", "glitch", "lyra", "velora", "audita", "echo", "riven"];

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

function statusPalette(status: string): { badge: string; text: string; border: string } {
  switch (status.toLowerCase()) {
    case "online":
      return { badge: "bg-[#0C1F1C] text-[#0CE7A1] border border-[#0CE7A1]/50", text: "text-[#0CE7A1]", border: "border-[#0CE7A1]/40" };
    case "degraded":
      return { badge: "bg-[#2b1d04] text-[#ffb347] border border-[#ffb347]/50", text: "text-[#ffb347]", border: "border-[#ffb347]/40" };
    default:
      return { badge: "bg-[#2b090f] text-[#f5b8c1] border border-[#f5b8c1]/40", text: "text-[#f5b8c1]", border: "border-[#f5b8c1]/30" };
  }
}

export default function AgentGrid({ initialAgents }: AgentGridProps) {
  const [agents, setAgents] = useState<AgentRecord[]>(initialAgents);

  const orderedAgents = useMemo(() => {
    const map = new Map(agents.map((agent) => [agent.name, agent]));
    return ORDER.map((name) => map.get(name)).filter(Boolean) as AgentRecord[];
  }, [agents]);

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
    const interval = setInterval(sync, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orderedAgents.map((agent) => {
        const palette = statusPalette(agent.status);
        return (
          <article
            key={agent.name}
            className={`rounded-3xl border ${palette.border} bg-[#07020D]/80 p-6 shadow-[0_35px_100px_rgba(0,0,0,0.55)]`}
          >
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F5DCE9]">{agent.display_name}</h3>
                <p className="text-xs uppercase tracking-wide text-[#6faab1]">{agent.environment}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette.badge}`}>
                {agent.status.toUpperCase()}
              </span>
            </header>
            <dl className="mt-4 space-y-3 text-sm text-[#B78A9B]">
              <div className="flex items-center justify-between">
                <dt className="text-[#6C7280]">Version</dt>
                <dd className="text-[#F5E5ED]">{agent.version ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#6C7280]">Host</dt>
                <dd className="text-[#F5E5ED]">{agent.host ?? "offline"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#6C7280]">Capabilities</dt>
                <dd className="text-right text-[#F5E5ED]">
                  {agent.capabilities.length ? agent.capabilities.join(", ") : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#6C7280]">Last seen</dt>
                <dd className={`text-right ${palette.text}`}>{normalizeLastSeen(agent.last_seen)}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
