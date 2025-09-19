import { CoreApiError, coreApiJson } from "@/lib/core-api";

type Profile = {
  id: string;
  email: string;
  role: string;
  tiers: string[];
};

type ConsentRecord = {
  id: string;
  partner_name: string;
  content_ids: string[];
  signed_at: string | null;
};

type Room = {
  id: string;
  name: string;
  private: boolean;
};

async function fetchProfile(): Promise<Profile> {
  return coreApiJson<Profile>("/me");
}

async function fetchConsents(): Promise<ConsentRecord[]> {
  try {
    return await coreApiJson<ConsentRecord[]>("/consent/");
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 403) {
      return [];
    }
    throw error;
  }
}

async function fetchRooms(): Promise<Room[]> {
  try {
    return await coreApiJson<Room[]>("/rooms/");
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 403) {
      return [];
    }
    throw error;
  }
}

export default async function ProfilePage() {
  try {
    const profile = await fetchProfile();
    const [consents, rooms] = await Promise.all([fetchConsents(), fetchRooms()]);
    const tierList = profile.tiers?.length ? profile.tiers : ["standard"];
    const latestConsent = consents[0] ?? null;

    return (
      <div className="min-h-screen bg-[#050109] px-6 py-12 text-[#F5E5ED]">
        <div className="mx-auto max-w-5xl space-y-10">
          <header className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#30121C] bg-[#0D111A]/80 px-3 py-1 text-xs uppercase tracking-wide text-[#A33A5B]">
              Identity · Black Rose Collective
            </span>
            <h1 className="text-3xl font-semibold text-[#F5DCE9]">{profile.email}</h1>
            <p className="text-sm text-[#6faab1]">
              Zero-trust role enforcement by NovaOS. Consent and vault access follow your verified role + tiers.
            </p>
          </header>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <section className="space-y-6">
              <article className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-8 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                <h2 className="text-xl font-semibold text-[#F5DCE9]">Access profile</h2>
                <dl className="mt-4 grid grid-cols-1 gap-4 text-sm">
                  <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-[#6faab1]">Role</dt>
                    <dd className="mt-1 font-semibold text-[#A33A5B]">{profile.role.toUpperCase()}</dd>
                  </div>
                  <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-[#6faab1]">Tiers</dt>
                    <dd className="mt-1 text-[#F5E5ED]">{tierList.join(", ")}</dd>
                  </div>
                  <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                    <dt className="text-xs uppercase tracking-wide text-[#6faab1]">Account ID</dt>
                    <dd className="mt-1 text-[#F5E5ED]">{profile.id}</dd>
                  </div>
                </dl>
              </article>
              <article className="rounded-3xl border border-[#2A1721] bg-[#07020D]/80 p-8 shadow-[0_35px_90px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#F5DCE9]">Consent snapshot</h2>
                  <span className="rounded-full border border-[#30121C] px-3 py-1 text-xs text-[#6faab1]">
                    {consents.length} stored
                  </span>
                </div>
                {latestConsent ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-[#6faab1]">Latest partner</div>
                      <div className="mt-1 font-semibold text-[#A33A5B]">{latestConsent.partner_name}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-[#6faab1]">Assets covered</div>
                      <div className="mt-1 text-[#F5E5ED]">{latestConsent.content_ids.join(", ")}</div>
                    </div>
                    <div className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3">
                      <div className="text-xs uppercase tracking-wide text-[#6faab1]">Signed</div>
                      <div className="mt-1 text-[#F5E5ED]">
                        {latestConsent.signed_at ? new Date(latestConsent.signed_at).toLocaleString() : "Pending timestamp"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] px-4 py-5 text-sm text-[#6C7280]">
                    No consent packages synced yet. Uploads channel through /consent-upload.
                  </p>
                )}
              </article>
            </section>
            <aside className="space-y-6">
              <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/70 p-8 backdrop-blur">
                <h2 className="text-xl font-semibold text-[#F5DCE9]">Channel access</h2>
                <p className="mt-2 text-sm text-[#6C7280]">
                  Rooms respect RBAC. Private rooms require explicit invites; public rooms follow NSFW toggle state.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {rooms.map((room) => (
                    <li
                      key={room.id}
                      className="flex items-center justify-between rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3"
                    >
                      <span className="font-medium text-[#F5E5ED]">{room.name}</span>
                      <span className="text-[11px] uppercase tracking-wide text-[#6faab1]">
                        {room.private ? "Private" : "Public"}
                      </span>
                    </li>
                  ))}
                  {rooms.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] px-4 py-5 text-sm text-[#6C7280]">
                      No room memberships detected. Request admin access via Inbox.
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-3xl border border-[#2A1721] bg-[#07020D]/70 p-8 backdrop-blur">
                <h2 className="text-xl font-semibold text-[#F5DCE9]">Security posture</h2>
                <ul className="mt-3 space-y-2 text-sm text-[#6C7280]">
                  <li>• AES-512 encrypted sessions across Nova mesh</li>
                  <li>• MFA-ready JWT, CSRF, and Redis-backed rate limits</li>
                  <li>• Consent + vault alerts mirrored to Glitch honeypots</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[#A33A5B]">Authenticate to continue</h1>
            <p className="mt-3 text-sm text-[#B78A9B]">
              Your session expired. Sign in again to restore sovereign access to NovaOS services.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#A33A5B]">Profile unavailable</h1>
          <p className="mt-3 text-sm text-[#B78A9B]">
            {error instanceof Error ? error.message : "Unable to load secure profile."}
          </p>
        </div>
      </div>
    );
  }
}
