import { NextRequest, NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type ConsentPayload = {
  partner_name: string;
  content_ids: string[];
  signed_at?: string | null;
  meta?: Record<string, unknown> | null;
};

type ConsentResponse = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as ConsentPayload;
  try {
    const response = await coreApiJson<ConsentResponse>("/consent/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "consent_upload_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "consent_upload_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
