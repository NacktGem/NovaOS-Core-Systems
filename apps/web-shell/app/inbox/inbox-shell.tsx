"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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

interface InboxShellProps {
  rooms: Room[];
  initialRoomId: string | null;
  initialMessages: Message[];
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const message = typeof detail?.detail === "string" ? detail.detail : res.statusText;
    throw new Error(message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export default function InboxShell({
  rooms: initialRooms,
  initialRoomId,
  initialMessages,
}: InboxShellProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [activeRoom, setActiveRoom] = useState<string | null>(initialRoomId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    async function refreshRooms() {
      try {
        const data = await fetchJSON<{ rooms: Room[] }>("/api/inbox/rooms");
        setRooms(data.rooms);
        if (!activeRoom && data.rooms.length > 0) {
          setActiveRoom(data.rooms[0].id);
        }
      } catch (err) {
        console.error("Failed to refresh rooms", err);
      }
    }

    refreshRooms();
    const interval = setInterval(refreshRooms, 30_000);
    return () => clearInterval(interval);
  }, [activeRoom]);

  const loadMessages = useCallback(
    async (roomId: string) => {
      setLoading(true);
      try {
        const data = await fetchJSON<{ messages: Message[] }>(
          `/api/inbox/rooms/${roomId}/messages?limit=50`,
        );
        setMessages(data.messages.slice().reverse());
        setError(null);
      } catch (err) {
        console.error("Failed to load messages", err);
        setError(err instanceof Error ? err.message : "Unable to load messages");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return undefined;
    }
    loadMessages(activeRoom).catch(() => {});
    const interval = setInterval(() => {
      loadMessages(activeRoom).catch(() => {});
    }, 10_000);
    return () => clearInterval(interval);
  }, [activeRoom, loadMessages]);

  const activeRoomMeta = useMemo(
    () => rooms.find((room) => room.id === activeRoom) ?? null,
    [rooms, activeRoom],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!activeRoom || !draft.trim()) return;
      const payload = { body: draft.trim() };
      try {
        await fetchJSON<{ id: string }>(`/api/inbox/rooms/${activeRoom}/messages`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setDraft("");
        await loadMessages(activeRoom);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send message");
      }
    },
    [activeRoom, draft, loadMessages],
  );

  return (
    <div className="flex min-h-screen bg-[#050109] text-[#F5E5ED]">
      <aside className="w-72 border-r border-[#30121C] bg-[#07020D]">
        <div className="px-5 py-6">
          <div className="text-xs uppercase tracking-widest text-[#A33A5B]">Inbox</div>
          <h2 className="mt-2 text-lg font-semibold">Direct Channels</h2>
        </div>
        <nav className="space-y-1 px-3 pb-6">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setActiveRoom(room.id)}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                room.id === activeRoom
                  ? "border-[#A33A5B] bg-[#1A0C18]"
                  : "border-transparent bg-transparent hover:border-[#2A1721] hover:bg-[#10040F]"
              }`}
            >
              <span className="text-sm font-medium">{room.name}</span>
              <span className="text-[11px] uppercase tracking-wide text-[#6C7280]">
                {room.private ? "Private" : "Public"}
              </span>
            </button>
          ))}
          {rooms.length === 0 && (
            <p className="rounded-lg border border-[#30121C] bg-[#12010E] px-4 py-3 text-sm text-[#B78A9B]">
              No rooms available. Admin must invite you to a channel.
            </p>
          )}
        </nav>
      </aside>
      <section className="flex flex-1 flex-col">
        <header className="border-b border-[#30121C] bg-[#07020D]/90 px-8 py-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#6faab1]">
                {activeRoomMeta ? (activeRoomMeta.private ? "Encrypted" : "Open Channel") : "Select a channel"}
              </div>
              <h1 className="text-2xl font-semibold text-[#F5DCE9]">
                {activeRoomMeta?.name ?? "Inbox"}
              </h1>
            </div>
            <div className="text-right text-xs text-[#6C7280]">
              {loading ? "Syncing…" : `Polling every 10s`}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {error && (
              <div className="mb-4 rounded-lg border border-[#7c2d2d] bg-[#2b090f] px-4 py-3 text-sm text-[#f5b8c1]">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-2xl border border-[#1F0A15] bg-[#0B040E] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
                >
                  <header className="mb-1 flex items-center gap-3 text-xs text-[#6faab1]">
                    <span className="font-semibold text-[#A33A5B]">
                      {message.user_id ? message.user_id.slice(0, 8) : "System"}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[#302530]" aria-hidden />
                    <span>Secured via NovaOS relay</span>
                  </header>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#F5E5ED]">
                    {message.body}
                  </p>
                </article>
              ))}
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#2A1721] bg-[#09020C] p-8 text-center text-sm text-[#6C7280]">
                  No messages yet. Start the conversation to populate this channel.
                </div>
              )}
            </div>
          </div>
          <footer className="border-t border-[#30121C] bg-[#07020D]/90 px-8 py-6 backdrop-blur">
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeRoom ? "Encrypted message" : "Select a room to enable messaging"}
                className="flex-1 rounded-2xl border border-[#2A1721] bg-[#0B040E] px-4 py-3 text-sm text-[#F5E5ED] shadow-[0_18px_40px_rgba(0,0,0,0.35)] focus:border-[#A33A5B] focus:outline-none"
                rows={3}
                disabled={!activeRoom}
                required
              />
              <button
                type="submit"
                disabled={!activeRoom || !draft.trim()}
                className="rounded-full bg-[#A33A5B] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#050109] disabled:cursor-not-allowed disabled:bg-[#4C2B38]"
              >
                Send
              </button>
            </form>
          </footer>
        </div>
      </section>
    </div>
  );
}
