"use client";

import { useEffect, useMemo, useState } from "react";

// Black Rose palette
const COLOR = {
  roseMauve: "#A33A5B",
  deepRosewood: "#89333F",
  bloodBrown: "#431D21",
  trueBlack: "#000003",
  midnightNavy: "#19212A",
  deepTeal: "#013E43",
};

type AgentState = {
  agent: string;
  version: string;
  host?: string;
  pid?: number;
  capabilities?: string[];
  last_seen: number; // epoch seconds
};

type OnlineResponse = { agents: AgentState[] };

function timeAgo(secEpoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const delta = Math.max(0, now - secEpoch);
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function isStale(secEpoch: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - secEpoch > 90; // matches TTL in core
}

export default function AgentsPage() {
  const [data, setData] = useState<OnlineResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Poll every 5s
  useEffect(() => {
    let t: any;
    async function load() {
      try {
        const r = await fetch("/api/agents/online", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setData(j);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Network error");
      }
    }
    load();
    t = setInterval(() => {
      load();
      setTick((n) => n + 1);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const agents = useMemo(() => {
    const a = data?.agents || [];
    // deterministic order: online first, then name
    const sorted = [...a].sort((x, y) => {
      const xs = isStale(x.last_seen) ? 1 : 0;
      const ys = isStale(y.last_seen) ? 1 : 0;
      if (xs !== ys) return xs - ys;
      return x.agent.localeCompare(y.agent);
    });
    return sorted;
  }, [data, tick]);

  const onlineCount = agents.filter(a => !isStale(a.last_seen)).length;

  return (
    <div style={{
      background: COLOR.trueBlack, minHeight: "100vh", color: COLOR.roseMauve,
      fontFamily: "Inter, ui-sans-serif, system-ui"
    }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: `linear-gradient(180deg, ${COLOR.trueBlack} 0%, ${COLOR.midnightNavy} 100%)`,
        borderBottom: `1px solid ${COLOR.bloodBrown}`, padding: "16px 20px"
      }}>
        <h1 style={{ fontSize: 22, margin: 0, letterSpacing: 0.3 }}>
          GodMode • Agents
        </h1>
        <p style={{ margin: "6px 0 0 0", color: COLOR.deepTeal, fontSize: 13 }}>
          Live telemetry with 5s polling. Sovereign, encrypted, unflinching.
        </p>
      </header>

      <main style={{ padding: 20 }}>
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16
        }}>
          {/* Summary card */}
          <div style={{
            background: COLOR.midnightNavy,
            border: `1px solid ${COLOR.bloodBrown}`,
            borderRadius: 16, padding: 16, boxShadow: `0 8px 24px rgba(0,0,0,.45)`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Cluster</h2>
              <span style={{ fontSize: 12, color: COLOR.deepTeal }}>
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <Badge label="Online" value={`${onlineCount}`} tone="good" />
              <Badge label="Total" value={`${agents.length}`} tone="neutral" />
              {err && <span style={{ color: "#E66F5C", fontSize: 12 }}>{err}</span>}
            </div>
          </div>

          {/* Agent cards */}
          {agents.map((a) => (
            <AgentCard key={a.agent} a={a} />
          ))}

          {/* Empty state */}
          {!err && agents.length === 0 && (
            <div style={{
              background: COLOR.midnightNavy, border: `1px solid ${COLOR.bloodBrown}`,
              borderRadius: 16, padding: 16
            }}>
              <p style={{ margin: 0, color: COLOR.deepTeal }}>No agents reporting (yet).</p>
              <p style={{ marginTop: 6, fontSize: 12 }}>
                Ensure the agents profile is up and heartbeats are flowing.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AgentCard({ a }: { a: AgentState }) {
  const stale = isStale(a.last_seen);

  return (
    <div style={{
      background: stale ? "#111317" : "#0E1A22",
      border: `1px solid ${stale ? "#3a2a2a" : "#23424a"}`,
      borderRadius: 16, padding: 16, boxShadow: `0 8px 24px rgba(0,0,0,.35)`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 18, letterSpacing: 0.3 }}>{a.agent}</h3>
          <span style={{ fontSize: 12, color: "#6faab1" }}>v{a.version || "1.0.0"}</span>
        </div>
        <StatusDot stale={stale} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
        <KV k="Host" v={a.host || "—"} />
        <KV k="PID" v={a.pid?.toString() || "—"} />
        <KV k="Last Seen" v={timeAgo(a.last_seen)} />
        <KV k="Caps" v={(a.capabilities && a.capabilities.length) ? a.capabilities.join(", ") : "—"} />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <MiniButton
          title="Raw JSON"
          onClick={() => {
            const json = JSON.stringify(a, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const w = window.open();
            if (w) {
              w.document.write(`<pre style="white-space:pre-wrap;color:#A33A5B;background:#000003;padding:12px">${json.replace(/</g,"&lt;")}</pre>`);
            } else {
              URL.revokeObjectURL(url);
              alert(json);
            }
          }}
        />
        <MiniButton
          title="Copy cURL"
          onClick={async () => {
            const cmd = `curl -s ${location.origin}/api/agents/online | jq`;
            await navigator.clipboard.writeText(cmd);
          }}
        />
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#6faab1" }}>{k}</div>
      <div style={{ color: "#A33A5B" }}>{v}</div>
    </div>
  );
}

function StatusDot({ stale }: { stale: boolean }) {
  const bg = stale ? "#E66F5C" : "#2fb170";
  return (
    <span style={{
      width: 10, height: 10, borderRadius: 9999, display: "inline-block",
      background: bg, boxShadow: `0 0 12px ${bg}`
    }} />
  );
}

function Badge({ label, value, tone }: { label: string; value: string; tone: "good" | "neutral" }) {
  const bg = tone === "good" ? "#013E43" : "#19212A";
  const br = tone === "good" ? "#0b5d62" : "#2b3440";
  return (
    <div style={{
      background: bg, border: `1px solid ${br}`,
      color: "#A3D1D7", padding: "8px 10px", borderRadius: 12, minWidth: 72
    }}>
      <div style={{ fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 16, color: "#A33A5B" }}>{value}</div>
    </div>
  );
}

function MiniButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#19212A", color: "#A33A5B",
        border: "1px solid #431D21", borderRadius: 10, padding: "6px 10px",
        fontSize: 12, cursor: "pointer"
      }}
    >
      {title}
    </button>
  );
}