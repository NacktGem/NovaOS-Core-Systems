import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.CORE_API_URL || "http://core-api:8760").replace(/\/+$/, "");
  const url = `${base}/api/v1/agent/online`;

  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ error: `core-api ${r.status}` }, { status: r.status });
    const data = await r.json();
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "proxy error" }, { status: 502 });
  }
}