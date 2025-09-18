"use client";

import { useMemo, useState } from "react";

import ConsentUploadForm from "./consent-form";

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

interface ConsentUploadShellProps {
  initialConsents: ConsentRecord[];
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Pending signature";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    hour12: false,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsentUploadShell({ initialConsents }: ConsentUploadShellProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>(initialConsents);

  const orderedConsents = useMemo(
    () =>
      [...consents].sort((a, b) => {
        const aTime = a.signed_at ? new Date(a.signed_at).getTime() : 0;
        const bTime = b.signed_at ? new Date(b.signed_at).getTime() : 0;
        return bTime - aTime;
      }),
    [consents],
  );

  return (
    <div className="min-h-screen bg-[#050109] px-6 py-12 text-[#F5E5ED]">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#30121C] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
            Consent · Audita Relay
          </span>
          <h1 className="text-3xl font-semibold text-[#F5DCE9]">Upload verified consent packages</h1>
          <p className="max-w-2xl text-sm text-[#6faab1]">
            Every submission is hashed, encrypted with AES-512 + PQ armor, and audited by Audita. Proton relay handles 4LE access when flagged.
          </p>
        </header>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-8 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
            <h2 className="text-xl font-semibold text-[#A33A5B]">New consent</h2>
            <p className="mt-2 text-sm text-[#6C7280]">
              Uploads sync directly to Nova Core API and replicate to encrypted vaults + ProtonMail evidence locker.
            </p>
            <div className="mt-6">
              <ConsentUploadForm
                onSubmitted={(record) => setConsents((prev) => [record, ...prev])}
              />
            </div>
          </div>
          <aside className="rounded-3xl border border-[#2A1721] bg-[#07020D]/60 p-8 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#F5DCE9]">Stored consents</h2>
              <span className="rounded-full border border-[#30121C] px-3 py-1 text-xs text-[#6faab1]">
                {orderedConsents.length} total
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {orderedConsents.map((consent) => (
                <article
                  key={consent.id}
                  className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                >
                  <header className="mb-2 flex items-center justify-between text-xs text-[#6faab1]">
                    <span className="font-semibold text-[#A33A5B]">{consent.partner_name}</span>
                    <span>{formatTimestamp(consent.signed_at)}</span>
                  </header>
                  <p className="text-sm text-[#F5E5ED]">
                    Assets: {consent.content_ids.join(", ")}
                  </p>
                  {consent.meta && (
                    <pre className="mt-3 overflow-hidden text-ellipsis whitespace-pre-wrap rounded-xl border border-[#2A1721] bg-[#0A0F1A] px-4 py-3 text-[11px] leading-relaxed text-[#9fb9c1]">
                      {JSON.stringify(consent.meta, null, 2)}
                    </pre>
                  )}
                </article>
              ))}
              {orderedConsents.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] p-6 text-sm text-[#6C7280]">
                  No consent files stored yet. Uploads propagate instantly to Audita and NovaOS vaults.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
