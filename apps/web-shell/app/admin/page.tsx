import AdminShell from "./admin-shell";
import { CoreApiError, coreApiJson } from "@/lib/core-api";

type FlagsResponse = {
  flags: Record<string, {
    value: boolean;
    updated_at: string | null;
    updated_by: string | null;
  }>;
};

async function fetchFlags(): Promise<FlagsResponse> {
  return coreApiJson<FlagsResponse>("/platform/flags");
}

export default async function AdminPage() {
  try {
    const data = await fetchFlags();
    return <AdminShell initialFlags={data.flags} />;
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[#A33A5B]">Founder clearance required</h1>
            <p className="mt-3 text-sm text-[#B78A9B]">
              Only Jules, Nova, and Ty may adjust production toggles. Request access through NovaOS if escalation is justified.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#A33A5B]">Admin panel unavailable</h1>
          <p className="mt-3 text-sm text-[#B78A9B]">
            {error instanceof Error ? error.message : "Unable to reach Nova governance service."}
          </p>
        </div>
      </div>
    );
  }
}
