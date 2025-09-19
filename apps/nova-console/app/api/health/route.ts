import { NextResponse } from "next/server";

type ServiceKey = "core-api" | "echo" | "nova-console" | "web-shell" | "gypsy-cove";

function serviceBase(service: ServiceKey): string {
  switch (service) {
    case "core-api":
      return process.env.CORE_API_BASE || process.env.NEXT_PUBLIC_CORE_API_URL || "http://localhost:8760";
    case "echo":
      return process.env.ECHO_BASE_URL || process.env.NEXT_PUBLIC_ECHO_URL || process.env.NEXT_PUBLIC_ECHO_WS_URL || "http://localhost:8765";
    case "web-shell":
      return process.env.WEB_SHELL_BASE_URL || "http://localhost:3002";
    case "gypsy-cove":
      return process.env.GYPSY_COVE_BASE_URL || "http://localhost:3000";
    case "nova-console":
    default:
      return process.env.NOVA_CONSOLE_BASE_URL || "http://localhost:3001";
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const svc = (url.searchParams.get("service") || "core-api") as ServiceKey;
  const path = url.searchParams.get("path") || "/internal/healthz";
  const withVersion = url.searchParams.get("version") === "1";
  const base = serviceBase(svc).replace(/\/+$/, "");

  const out: Record<string, unknown> = { service: svc, base, path };
  try {
    const hres = await fetch(base + path, { cache: "no-store" });
    out.status = hres.status;
    out.ok = hres.ok;
    if (withVersion) {
      try {
        const vres = await fetch(base + "/version", { cache: "no-store" });
        out.versionStatus = vres.status;
        out.version = await vres.json().catch(() => null);
      } catch (e) {
        out.versionError = String(e);
      }
    }
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    out.ok = false;
    out.error = String(e);
    return NextResponse.json(out, { status: 200 });
  }
}

