import { NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type Room = {
  id: string;
  name: string;
  private: boolean;
};

type RoomsResponse = Room[];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await coreApiJson<RoomsResponse>("/rooms/");
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "rooms_fetch_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "rooms_fetch_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
