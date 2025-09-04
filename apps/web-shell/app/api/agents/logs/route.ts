import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent");
  const limit = searchParams.get("limit") || "200";

  const token = process.env.AGENT_SHARED_TOKEN || "";
  const base = (process.env.CORE_API_URL || "http://core-api:8000").replace(/\/+$/, "");
  const url = `${base}/api/v1/agent/logs?${agent ? `agent=${encodeURIComponent(agent)}&` : ""}limit=${encodeURIComponent(limit)}`;

  const r = await fetch(url, { headers: { "x-agent-token": token }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j, { status: r.status });
}