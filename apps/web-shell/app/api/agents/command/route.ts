import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const token = process.env.AGENT_SHARED_TOKEN || "";
  const base = (process.env.CORE_API_URL || "http://core-api:8000").replace(/\/+$/, "");
  const url = `${base}/api/v1/agent/command`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-agent-token": token,
    },
    body: JSON.stringify(body),
  });

  const j = await r.json().catch(() => ({}));
  return NextResponse.json(j, { status: r.status });
}