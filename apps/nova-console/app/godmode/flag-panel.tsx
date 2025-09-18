"use client";

import { useCallback, useEffect, useState } from "react";

type FlagRecord = {
  value: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

interface FlagPanelProps {
  initialFlags: Record<string, FlagRecord>;
}

const ORDER: Array<{ name: string; label: string; description: string }> = [
  {
    name: "admin_calm_mode",
    label: "Calm mode default",
    description: "Force SFW shells for admin roles unless explicitly overridden.",
  },
  {
    name: "nsfw_enabled",
    label: "NSFW distribution",
    description: "Gate NSFW surface areas across explore + feeds.",
  },
  {
    name: "consent_lockdown",
    label: "Consent lockdown",
    description: "Freeze vault exports and force Audita review before unlock.",
  },
];

export default function FlagPanel({ initialFlags }: FlagPanelProps) {
  const [flags, setFlags] = useState<Record<string, FlagRecord>>(initialFlags);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/flags", { cache: "no-store" });
      if (!res.ok) throw new Error(`sync failed: ${res.status}`);
      const data = await res.json();
      setFlags(data.flags as Record<string, FlagRecord>);
    } catch (err) {
      console.error("Flag sync failed", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(sync, 30_000);
    return () => clearInterval(interval);
  }, [sync]);

  const toggle = useCallback(
    async (name: string, nextValue: boolean) => {
      setPending((prev) => ({ ...prev, [name]: true }));
      setError(null);
      try {
        const res = await fetch(`/api/platform/flags/${name}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: nextValue }),
        });
        const data = await res.json();
        if (!res.ok) {
          const detail = typeof data.detail === "string" ? data.detail : "update failed";
          throw new Error(detail);
        }
        setFlags((prev) => ({
          ...prev,
          [name]: {
            value: data.value,
            updated_at: data.updated_at,
            updated_by: data.updated_by,
          },
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Toggle update failed");
      } finally {
        setPending((prev) => ({ ...prev, [name]: false }));
      }
    },
    [],
  );

  return (
    <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/85 p-8 shadow-[0_35px_90px_rgba(0,0,0,0.55)]">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#F5DCE9]">Founder overrides</h2>
          <p className="text-sm text-[#6C7280]">
            Direct toggles call Nova Core API with no logging for godmode accounts. Changes propagate instantly to BRC + GypsyCove.
          </p>
        </div>
      </header>
      <div className="mt-6 space-y-4">
        {ORDER.map((item) => {
          const flag = flags[item.name] ?? { value: false, updated_at: null, updated_by: null };
          return (
            <div
              key={item.name}
              className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-5 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#F5DCE9]">{item.label}</h3>
                  <p className="text-sm text-[#6faab1]">{item.description}</p>
                  <p className="text-xs uppercase tracking-wide text-[#6C7280]">
                    Last change · {flag.updated_at ? new Date(flag.updated_at).toLocaleString() : "never"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.name, !flag.value)}
                  disabled={pending[item.name]}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                    flag.value
                      ? "border-[#0CE7A1] bg-[#0C1F1C] text-[#0CE7A1]"
                      : "border-[#2A1721] bg-[#10040F] text-[#B78A9B]"
                  } ${pending[item.name] ? "opacity-60" : ""}`}
                >
                  <span>{flag.value ? "Enabled" : "Disabled"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-[#7c2d2d] bg-[#2b090f] px-4 py-3 text-sm text-[#f5b8c1]">
          {error}
        </div>
      )}
    </div>
  );
}
