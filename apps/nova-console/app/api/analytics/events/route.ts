import { NextRequest, NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type AnalyticsEvent = {
  id: string;
  event_name: string;
  props: Record<string, unknown>;
  created_at: string;
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit") ?? "25";
  try {
    const events = await coreApiJson<AnalyticsEvent[]>(`/analytics/events?limit=${limit}`);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "analytics_fetch_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "analytics_fetch_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
