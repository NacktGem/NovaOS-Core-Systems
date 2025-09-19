import { NextResponse } from "next/server";

import { CoreApiError, coreApiJson } from "@/lib/core-api";

type AgentRecord = {
  name: string;
  display_name: string;
  version: string | null;
  status: string;
  host: string | null;
  capabilities: string[];
  environment: string;
  last_seen: string | number | null;
  details: Record<string, unknown>;
};

type AgentsResponse = {
  agents: AgentRecord[];
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await coreApiJson<AgentsResponse>("/agents", {}, { includeAgentToken: true });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof CoreApiError) {
      return NextResponse.json(
        { error: "agents_fetch_failed", detail: error.payload },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "agents_fetch_failed", detail: "unknown error" },
      { status: 500 },
    );
  }
}
