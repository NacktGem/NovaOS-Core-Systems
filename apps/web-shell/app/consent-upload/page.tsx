import ConsentUploadShell from "./consent-upload-shell";
import { CoreApiError, coreApiJson } from "@/lib/core-api";

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
  meta: Record<string, unknown> | null;
};

async function fetchConsents(): Promise<ConsentRecord[]> {
  return coreApiJson<ConsentRecord[]>("/consent/");
}

export default async function ConsentUploadPage() {
  try {
    const consents = await fetchConsents();
    return <ConsentUploadShell initialConsents={consents} />;
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[#A33A5B]">Founders or verified creators only</h1>
            <p className="mt-3 text-sm text-[#B78A9B]">
              Sign in with your Black Rose Collective credentials to upload signed consents. Unauthorized attempts are honeytrapped by Glitch.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#A33A5B]">Consent system offline</h1>
          <p className="mt-3 text-sm text-[#B78A9B]">
            {error instanceof Error ? error.message : "Unable to reach Audita intake. Retry or alert Ty immediately."}
          </p>
        </div>
      </div>
    );
  }
}
