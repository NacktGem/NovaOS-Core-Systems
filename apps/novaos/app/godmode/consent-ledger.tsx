"use client";

import { useEffect, useState } from "react";

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

interface ConsentLedgerProps {
  initialConsents: ConsentRecord[];
}

function formatSigned(value: string | null): string {
  if (!value) return "Pending timestamp";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ConsentLedger({ initialConsents }: ConsentLedgerProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>(initialConsents);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/consent?limit=20", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.consents)) {
          setConsents(data.consents as ConsentRecord[]);
        }
      } catch (err) {
        console.error("Consent ledger sync failed", err);
      }
    }
    const interval = setInterval(refresh, 40_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-6 shadow-[0_35px_90px_rgba(0,0,0,0.45)]">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#F5DCE9]">Audita consent ledger</h2>
          <p className="text-sm text-[#6C7280]">Encrypted proofs mirrored to Proton + offline vault. Panic wipe hooks wired to Glitch.</p>
        </div>
        <span className="rounded-full border border-[#30121C] px-3 py-1 text-xs text-[#6faab1]">
          {consents.length} records
        </span>
      </header>
      <div className="mt-4 space-y-3">
        {consents.map((consent) => (
          <article
            key={consent.id}
            className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED]"
          >
            <div className="flex items-center justify-between text-xs text-[#6faab1]">
              <span className="font-semibold text-[#A33A5B]">{consent.partner_name}</span>
              <span>{formatSigned(consent.signed_at)}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-[#6C7280]">
              Assets: {consent.content_ids.join(", ")}
            </p>
            {consent.meta && (
              <pre className="mt-2 whitespace-pre-wrap text-[11px] text-[#9fb9c1]">
                {JSON.stringify(consent.meta, null, 2)}
              </pre>
            )}
          </article>
        ))}
        {consents.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] p-6 text-sm text-[#6C7280]">
            No consent packages captured yet. Uploads from Black Rose route directly into this ledger.
          </div>
        )}
      </div>
    </div>
  );
}
