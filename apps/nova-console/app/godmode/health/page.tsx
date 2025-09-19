"use client";
import { useEffect, useMemo, useState } from "react";

type ServiceKey = "core-api" | "echo" | "nova-console" | "web-shell" | "gypsy-cove";

type HealthRow = {
  key: ServiceKey;
  label: string;
  path: string;
  ok?: boolean;
  status?: number;
  version?: unknown;
  base?: string;
};

function getRole(): string | null {
  const cookie = typeof document !== "undefined" ? document.cookie : "";
  const token = cookie.split("; ").find((c) => c.startsWith("access_token="))?.split("=")[1];
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role || null;
  } catch {
    return null;
  }
}

export default function HealthPanel() {
  const [data, setData] = useState<HealthRow[]>([]);
  const [ts, setTs] = useState<number>(0);
  const role = useMemo(getRole, []);

  const services: HealthRow[] = [
    { key: "core-api", label: "Core API", path: "/internal/healthz" },
    { key: "echo", label: "Echo WS", path: "/healthz" },
    { key: "nova-console", label: "Nova Console", path: "/" },
    { key: "web-shell", label: "Web-Shell", path: "/" },
    { key: "gypsy-cove", label: "Gypsy Cove", path: "/" },
  ];

  async function poll() {
    const rows: HealthRow[] = [];
    for (const s of services) {
      try {
        const q = new URLSearchParams({ service: s.key, path: s.path, version: "1" });
        const r = await fetch(`/api/health?${q}`, { cache: "no-store" });
        const j = (await r.json()) as any;
        rows.push({ key: s.key, label: s.label, path: s.path, ok: !!j.ok, status: j.status, version: j.version, base: j.base });
      } catch {
        rows.push({ key: s.key, label: s.label, path: s.path, ok: false });
      }
    }
    setData(rows);
    setTs(Date.now());
  }

  useEffect(() => {
    let stop = false;
    function loop() {
      if (stop) return;
      poll().finally(() => setTimeout(loop, 10000));
    }
    loop();
    return () => {
      stop = true;
    };
  }, []);

  if (role?.toLowerCase() !== "godmode") {
    return (
      <div className="min-h-screen bg-black text-rose-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">403</h1>
          <p className="mt-2 text-rose-300">Founder role required to view Health Panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-rose-200 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">NovaOS Health Panel</h1>
          <p className="text-rose-300 text-sm">Auto-refreshes every 10s • {new Date(ts).toLocaleTimeString() || "--"}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((row) => (
            <div key={row.key} className="rounded-lg border border-rose-600/40 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{row.label}</div>
                  <div className="text-xs text-rose-300">{row.base || ""}{row.path}</div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${row.ok ? "bg-green-500" : "bg-red-500"}`}
                  title={row.ok ? "online" : "offline"}
                />
              </div>
              <div className="mt-3 text-sm space-y-1">
                <div>Status: <span className="text-rose-300">{row.status ?? "n/a"}</span></div>
                {row.version && (
                  <pre className="text-xs text-rose-300 whitespace-pre-wrap break-words bg-black/30 p-2 rounded">
                    {JSON.stringify(row.version, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

