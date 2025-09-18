import { NextRequest, NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  try {
    const consents = await coreApiJson<ConsentRecord[]>("/consent/");
    return NextResponse.json(
      { consents: consents.slice(0, Math.max(1, Math.min(limit, 100))) },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "consent_fetch_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "consent_fetch_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
