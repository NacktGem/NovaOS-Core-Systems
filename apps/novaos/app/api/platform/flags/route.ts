import { NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type FlagRecord = {
  value: boolean;
  updated_at: string | null;
  updated_by: string | null;
};

type FlagsResponse = {
  flags: Record<string, FlagRecord>;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await coreApiJson<FlagsResponse>("/platform/flags");
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "flags_fetch_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "flags_fetch_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
