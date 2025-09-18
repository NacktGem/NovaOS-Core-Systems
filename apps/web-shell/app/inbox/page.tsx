import InboxShell from "./inbox-shell";
import { CoreApiError, coreApiJson } from "@/lib/core-api";

type Room = {
  id: string;
  name: string;
  private: boolean;
};

type Message = {
  id: string;
  user_id: string | null;
  body: string;
};

async function fetchRooms(): Promise<Room[]> {
  return coreApiJson<Room[]>("/rooms/");
}

async function fetchMessages(roomId: string): Promise<Message[]> {
  return coreApiJson<Message[]>(`/rooms/${roomId}/messages?limit=50`);
}

export default async function InboxPage() {
  try {
    const rooms = await fetchRooms();
    const activeRoomId = rooms[0]?.id ?? null;
    const messages = activeRoomId ? await fetchMessages(activeRoomId) : [];
    return (
      <InboxShell
        rooms={rooms}
        initialRoomId={activeRoomId}
        initialMessages={messages.slice().reverse()}
      />
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 401) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-[#A33A5B]">Authentication required</h1>
            <p className="mt-3 text-sm text-[#B78A9B]">
              Sign in to access your encrypted inbox. Tokens are scoped per subdomain and respect strict SameSite rules.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050109] px-6 py-12 text-[#F5E5ED]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#A33A5B]">Inbox unavailable</h1>
          <p className="mt-3 text-sm text-[#B78A9B]">
            {error instanceof Error ? error.message : "Unable to reach core messaging services. Retry shortly."}
          </p>
        </div>
      </div>
    );
  }
}
