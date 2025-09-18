"use client";

import { FormEvent, useState } from "react";

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

interface ConsentUploadFormProps {
  onSubmitted: (consent: ConsentRecord) => void;
}

function parseContentIds(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export default function ConsentUploadForm({ onSubmitted }: ConsentUploadFormProps) {
  const [partner, setPartner] = useState("");
  const [contentRefs, setContentRefs] = useState("");
  const [metaJson, setMetaJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    let meta: Record<string, unknown> | null = null;
    if (metaJson.trim()) {
      try {
        const parsed = JSON.parse(metaJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("Meta must be a JSON object");
        }
        meta = parsed as Record<string, unknown>;
      } catch (err) {
        setSubmitting(false);
        setError(err instanceof Error ? err.message : "Invalid JSON in meta field");
        return;
      }
    }

    const payload = {
      partner_name: partner.trim(),
      content_ids: parseContentIds(contentRefs),
      signed_at: new Date().toISOString(),
      meta,
    };

    try {
      const res = await fetch("/api/consent/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { detail?: string } & ConsentRecord;
      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : res.statusText;
        throw new Error(detail || "Upload failed");
      }
      onSubmitted(data);
      setPartner("");
      setContentRefs("");
      setMetaJson("{}");
      setSuccessMessage("Consent package encrypted and delivered to Audita.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6faab1]">
          Partner / collaborator
        </label>
        <input
          value={partner}
          onChange={(event) => setPartner(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-[#2A1721] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
          placeholder="Legal name for consent counterpart"
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6faab1]">
          Content references
        </label>
        <input
          value={contentRefs}
          onChange={(event) => setContentRefs(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-[#2A1721] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
          placeholder="Comma separated asset IDs"
        />
        <p className="mt-1 text-xs text-[#6C7280]">
          Each ID is immutable and referenced inside the encrypted vault. Example: VID-2025-01, SHOOT-882.
        </p>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-widest text-[#6faab1]">
          Meta (JSON)
        </label>
        <textarea
          value={metaJson}
          onChange={(event) => setMetaJson(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[#2A1721] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
          rows={4}
        />
        <p className="mt-1 text-xs text-[#6C7280]">
          Include verifying documents, scanned IDs, or production notes. AES-512 at rest, ProtonMail relay to 4LE.
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-[#7c2d2d] bg-[#2b090f] px-4 py-3 text-sm text-[#f5b8c1]">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-[#204f3a] bg-[#0c1f1c] px-4 py-3 text-sm text-[#6fe7b5]">
          {successMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#A33A5B] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#050109] disabled:cursor-not-allowed disabled:bg-[#4C2B38]"
      >
        {submitting ? "Encrypting…" : "Upload consent"}
      </button>
    </form>
  );
}
