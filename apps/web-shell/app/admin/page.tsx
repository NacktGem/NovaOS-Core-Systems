import AdminShell from "./admin-shell";
import { CoreApiError, coreApiJson } from "@/lib/core-api";
import { ChatWidget } from "../../../shared/components/chat";

type FlagsResponse = {
  flags: Record<string, {
    value: boolean;
    updated_at: string | null;
    updated_by: string | null;
  }>;
};

async function fetchFlags(): Promise<FlagsResponse> {
  const response = await coreApiJson<FlagsResponse>("/flags", {});
  return response;
}

async function loadChatRooms() {
  return [
    { id: "admin_room", name: "Admin Operations", description: "Administrative chat and coordination", private: true },
    { id: "system_alerts", name: "System Alerts", description: "Critical system notifications and responses", private: true },
  ];
}

export default async function AdminPage() {
  const chatRooms = await loadChatRooms();

  try {
    const data = await fetchFlags();
    return (
      <div className="flex min-h-screen">
        <div className="flex-1">
          <AdminShell initialFlags={data.flags} />
        </div>
        <div className="w-96 border-l border-[#2A1721]">
          <ChatWidget
            variant="blackRose"
            rooms={chatRooms}
            initialRoomId="admin_room"
            initialMessages={[]}
          />
        </div>
      </div>
    );
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
