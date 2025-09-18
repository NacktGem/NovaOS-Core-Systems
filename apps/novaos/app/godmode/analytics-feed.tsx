"use client";

import { useEffect, useState } from "react";

type AnalyticsEvent = {
  id: string;
  event_name: string;
  props: Record<string, unknown>;
  created_at: string;
};

interface AnalyticsFeedProps {
  initialEvents: AnalyticsEvent[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function AnalyticsFeed({ initialEvents }: AnalyticsFeedProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>(initialEvents);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/analytics/events?limit=25", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.events)) {
          setEvents(data.events as AnalyticsEvent[]);
        }
      } catch (err) {
        console.error("Analytics stream failed", err);
      }
    }
    const interval = setInterval(refresh, 25_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-6 shadow-[0_35px_90px_rgba(0,0,0,0.45)]">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#F5DCE9]">Velora analytics stream</h2>
          <p className="text-sm text-[#6C7280]">Real-time ingestion from revenue funnels, campaigns, and CRM hooks.</p>
        </div>
        <span className="rounded-full border border-[#30121C] px-3 py-1 text-xs text-[#6faab1]">
          {events.length} events
        </span>
      </header>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED]"
          >
            <div className="flex items-center justify-between text-xs text-[#6faab1]">
              <span className="font-semibold text-[#A33A5B]">{event.event_name}</span>
              <span>{formatDate(event.created_at)}</span>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-[11px] text-[#9fb9c1]">
              {JSON.stringify(event.props, null, 2)}
            </pre>
          </article>
        ))}
        {events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] p-6 text-sm text-[#6C7280]">
            No analytics activity logged yet. Velora will surface cohorts as soon as data arrives.
          </div>
        )}
      </div>
    </div>
  );
}
