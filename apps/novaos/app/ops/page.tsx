import { revalidatePath } from "next/cache";

import { coreApiJson } from "@/lib/core-api";

async function ingestEvent(formData: FormData) {
  "use server";

  const eventName = (formData.get("event_name") ?? "").toString().trim();
  const rawProps = (formData.get("event_props") ?? "").toString().trim();

  if (!eventName) {
    console.warn("ops.ingestEvent missing event_name");
    return;
  }

  let props: Record<string, unknown> = { source: "novaos-ops" };
  if (rawProps) {
    try {
      const parsed = JSON.parse(rawProps);
      if (typeof parsed === "object" && parsed !== null) {
        props = { ...props, ...(parsed as Record<string, unknown>) };
      }
    } catch (error) {
      console.error("ops.ingestEvent invalid props", error);
      return;
    }
  }

  await coreApiJson(
    "/analytics/ingest",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        events: [
          {
            event_name: eventName,
            props,
          },
        ],
      }),
    },
  );

  revalidatePath("/ops");
}

async function dispatchAgent(formData: FormData) {
  "use server";

  const agent = (formData.get("agent") ?? "").toString().trim().toLowerCase();
  const command = (formData.get("command") ?? "").toString().trim();
  const rawArgs = (formData.get("args") ?? "").toString().trim();

  if (!agent || !command) {
    console.warn("ops.dispatchAgent missing agent/command");
    return;
  }

  let args: Record<string, unknown> = {};
  if (rawArgs) {
    try {
      const parsed = JSON.parse(rawArgs);
      if (typeof parsed === "object" && parsed !== null) {
        args = parsed as Record<string, unknown>;
      }
    } catch (error) {
      console.error("ops.dispatchAgent invalid args", error);
      return;
    }
  }

  await coreApiJson(
    `/agents/${agent}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "GODMODE",
      },
      body: JSON.stringify({
        command,
        args,
        log: true,
      }),
    },
    { includeAgentToken: true },
  );

  revalidatePath("/ops");
}

export default function OpsConsole() {
  return (
    <main className="min-h-screen bg-[#050109] px-6 py-12 text-[#F5E5ED]">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#30121C] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
            Ops • NovaOS Console
          </span>
          <h1 className="text-3xl font-semibold text-[#F5DCE9]">Operational Dispatch</h1>
          <p className="max-w-3xl text-sm text-[#6faab1]">
            Founder-only controls. All actions flow through Nova orchestrator; no filesystem writes, no public endpoints.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            action={ingestEvent}
            className="space-y-4 rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]"
          >
            <header className="space-y-1">
              <h2 className="text-xl font-semibold text-[#F5DCE9]">Analytics event ingest</h2>
              <p className="text-sm text-[#6C7280]">
                Push a sovereign analytics signal directly into Core API. All payloads are signed and stored for Velora.
              </p>
            </header>
            <label className="block text-sm">
              <span className="text-[#6faab1]">Event name</span>
              <input
                name="event_name"
                required
                placeholder="e.g. ops.vault.audit"
                className="mt-1 w-full rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#6faab1]">Event props (JSON)</span>
              <textarea
                name="event_props"
                rows={5}
                placeholder='{"actor":"founder","severity":"high"}'
                className="mt-1 w-full rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 font-mono text-sm text-[#9fb9c1] focus:border-[#A33A5B] focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#A33A5B] bg-[#13020F] px-4 py-3 text-sm font-semibold text-[#F5DCE9] transition hover:bg-[#1E0616]"
            >
              Ingest event
            </button>
          </form>

          <form
            action={dispatchAgent}
            className="space-y-4 rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.55)]"
          >
            <header className="space-y-1">
              <h2 className="text-xl font-semibold text-[#F5DCE9]">Dispatch agent command</h2>
              <p className="text-sm text-[#6C7280]">
                Execute a Nova agent with full GodMode context. Commands are logged via orchestrator and replayable via request IDs.
              </p>
            </header>
            <label className="block text-sm">
              <span className="text-[#6faab1]">Agent</span>
              <input
                name="agent"
                required
                placeholder="e.g. velora"
                className="mt-1 w-full rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#6faab1]">Command</span>
              <input
                name="command"
                required
                placeholder="e.g. schedule_post"
                className="mt-1 w-full rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 text-[#F5E5ED] focus:border-[#A33A5B] focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-[#6faab1]">Args (JSON)</span>
              <textarea
                name="args"
                rows={6}
                placeholder='{"content":"Vault release","when":"2024-12-01T16:00:00Z"}'
                className="mt-1 w-full rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 font-mono text-sm text-[#9fb9c1] focus:border-[#A33A5B] focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[#A33A5B] bg-[#13020F] px-4 py-3 text-sm font-semibold text-[#F5DCE9] transition hover:bg-[#1E0616]"
            >
              Dispatch via Nova
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
