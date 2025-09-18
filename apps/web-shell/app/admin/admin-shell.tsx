"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FlagRecord = {
  value: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

interface AdminShellProps {
  initialFlags: Record<string, FlagRecord>;
}

type ToggleDescriptor = {
  label: string;
  description: string;
  security: string;
};

const TOGGLES: Record<string, ToggleDescriptor> = {
  admin_calm_mode: {
    label: "Calm mode UI",
    description: "Hides explicit media by default while allowing full admin access.",
    security: "Applies to Jules + advisors; founders unaffected.",
  },
  nsfw_enabled: {
    label: "NSFW distribution",
    description: "Controls publishing of NSFW content to explore feeds.",
    security: "Requires godmode override to enable; audited by Velora.",
  },
  consent_lockdown: {
    label: "Consent lockdown",
    description: "Prevents new uploads and locks vault exports until Audita review.",
    security: "Activates Audita + Glitch panic routines automatically.",
  },
};

function formatTimestamp(value: string | null): string {
  if (!value) return "never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AdminShell({ initialFlags }: AdminShellProps) {
  const [flags, setFlags] = useState<Record<string, FlagRecord>>(initialFlags);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const sortedFlags = useMemo(() => Object.keys(TOGGLES), []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/flags", { cache: "no-store" });
      if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
      const data = (await res.json()) as { flags: Record<string, FlagRecord> };
      setFlags(data.flags);
    } catch (err) {
      console.error("Failed to refresh platform flags", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 45_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleToggle = useCallback(
    async (name: string, nextValue: boolean) => {
      setPending((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: null }));
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
        setErrors((prev) => ({
          ...prev,
          [name]: err instanceof Error ? err.message : "Toggle failed",
        }));
      } finally {
        setPending((prev) => ({ ...prev, [name]: false }));
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[#050109] px-6 py-12 text-[#F5E5ED]">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#30121C] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
            Admin • NovaOS relay
          </span>
          <h1 className="text-3xl font-semibold text-[#F5DCE9]">Black Rose governance toggles</h1>
          <p className="max-w-2xl text-sm text-[#6faab1]">
            Founder overrides bypass logging. Jules operates in calm mode with NSFW disabled until explicitly granted.
          </p>
        </header>
        <section className="space-y-6">
          {sortedFlags.map((name) => {
            const descriptor = TOGGLES[name];
            const record = flags[name] ?? { value: false, updated_at: null, updated_by: null };
            return (
              <article
                key={name}
                className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#F5DCE9]">{descriptor.label}</h2>
                    <p className="text-sm text-[#6C7280]">{descriptor.description}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#6faab1]">{descriptor.security}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(name, !record.value)}
                    disabled={pending[name]}
                    className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                      record.value
                        ? "border-[#0CE7A1] bg-[#0C1F1C] text-[#0CE7A1]"
                        : "border-[#2A1721] bg-[#10040F] text-[#B78A9B]"
                    } ${pending[name] ? "opacity-60" : ""}`}
                  >
                    <span>{record.value ? "Enabled" : "Disabled"}</span>
                    {pending[name] && <span className="text-xs">…</span>}
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6C7280]">
                  <span>Last change: {formatTimestamp(record.updated_at)}</span>
                  <span>Updated by: {record.updated_by ?? "founder"}</span>
                </div>
                {errors[name] && (
                  <div className="mt-4 rounded-xl border border-[#7c2d2d] bg-[#2b090f] px-4 py-3 text-sm text-[#f5b8c1]">
                    {errors[name]}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
