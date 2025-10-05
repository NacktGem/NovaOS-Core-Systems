"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, forwardRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { RoomSelector } from "./RoomSelector";

export type Room = {
    id: string;
    name: string;
    private: boolean;
};

export type Message = {
    id: string;
    user_id: string | null;
    body: string;
};

interface ChatWidgetProps {
    rooms: Room[];
    initialRoomId: string | null;
    initialMessages: Message[];
    variant?: "blackRose" | "novaOS" | "ghost";
    title?: string;
    apiBasePath?: string;
    className?: string;
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

const variants = {
    blackRose: {
        container: "flex bg-blackRose-bg text-blackRose-fg",
        main: "flex flex-1 flex-col",
        header: "border-b border-blackRose-midnightNavy bg-blackRose-trueBlack/90 px-8 py-6 backdrop-blur",
        headerMeta: "text-xs uppercase tracking-widest text-studios-cipherCore-cyberBlue",
        headerTitle: "text-2xl font-semibold text-blackRose-fg",
        headerStatus: "text-right text-xs text-studios-inkSteel-neutral",
        messageArea: "flex-1 overflow-y-auto px-8 py-6",
        errorAlert: "mb-4 rounded-lg border border-status-danger-dark bg-status-danger-main/20 px-4 py-3 text-sm text-status-danger-light",
        messagesContainer: "space-y-4",
        emptyState: "rounded-2xl border border-dashed border-blackRose-midnightNavy bg-blackRose-trueBlack p-8 text-center text-sm text-studios-inkSteel-neutral",
        footer: "border-t border-blackRose-midnightNavy bg-blackRose-trueBlack/90 px-8 py-6 backdrop-blur",
        form: "flex items-end gap-4",
        textarea: "flex-1 rounded-2xl border border-blackRose-midnightNavy bg-blackRose-bg px-4 py-3 text-sm text-blackRose-fg shadow-[0_18px_40px_rgba(0,0,0,0.35)] focus:border-blackRose-roseMauve focus:outline-none",
        button: "rounded-full bg-blackRose-roseMauve px-6 py-3 text-sm font-semibold uppercase tracking-wide text-blackRose-trueBlack disabled:cursor-not-allowed disabled:bg-blackRose-deepRosewood"
    },
    novaOS: {
        container: "flex bg-novaOS-blueLight text-studios-inkSteel-graphite",
        main: "flex flex-1 flex-col",
        header: "border-b border-novaOS-lavender bg-white/90 px-8 py-6 backdrop-blur",
        headerMeta: "text-xs uppercase tracking-widest text-studios-cipherCore-cyberBlue",
        headerTitle: "text-2xl font-semibold text-novaOS-blueDark",
        headerStatus: "text-right text-xs text-studios-inkSteel-steel",
        messageArea: "flex-1 overflow-y-auto px-8 py-6",
        errorAlert: "mb-4 rounded-lg border border-status-danger-main bg-status-danger-light px-4 py-3 text-sm text-status-danger-dark",
        messagesContainer: "space-y-4",
        emptyState: "rounded-2xl border border-dashed border-novaOS-lavender bg-white p-8 text-center text-sm text-studios-inkSteel-steel",
        footer: "border-t border-novaOS-lavender bg-white/90 px-8 py-6 backdrop-blur",
        form: "flex items-end gap-4",
        textarea: "flex-1 rounded-2xl border border-novaOS-lavender bg-white px-4 py-3 text-sm text-studios-inkSteel-graphite shadow-lg focus:border-novaOS-blueDark focus:outline-none",
        button: "rounded-full bg-novaOS-blueDark px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-studios-inkSteel-steel"
    },
    ghost: {
        container: "flex bg-studios-lightboxStudio-pearl text-studios-inkSteel-graphite",
        main: "flex flex-1 flex-col",
        header: "border-b border-studios-inkSteel-silver bg-white/90 px-8 py-6 backdrop-blur",
        headerMeta: "text-xs uppercase tracking-widest text-studios-inkSteel-steel",
        headerTitle: "text-2xl font-semibold text-studios-inkSteel-graphite",
        headerStatus: "text-right text-xs text-studios-inkSteel-neutral",
        messageArea: "flex-1 overflow-y-auto px-8 py-6",
        errorAlert: "mb-4 rounded-lg border border-status-warning-main bg-status-warning-light px-4 py-3 text-sm text-status-warning-dark",
        messagesContainer: "space-y-4",
        emptyState: "rounded-2xl border border-dashed border-studios-inkSteel-silver bg-white p-8 text-center text-sm text-studios-inkSteel-steel",
        footer: "border-t border-studios-inkSteel-silver bg-white/90 px-8 py-6 backdrop-blur",
        form: "flex items-end gap-4",
        textarea: "flex-1 rounded-2xl border border-studios-inkSteel-silver bg-white px-4 py-3 text-sm text-studios-inkSteel-graphite shadow focus:border-studios-inkSteel-steel focus:outline-none",
        button: "rounded-full bg-studios-inkSteel-graphite px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:bg-studios-inkSteel-silver"
    }
};

export const ChatWidget = forwardRef<HTMLDivElement, ChatWidgetProps>(
    ({
        rooms: initialRooms,
        initialRoomId,
        initialMessages,
        variant = "blackRose",
        title = "Chat",
        apiBasePath = "/api/inbox",
        className
    }, ref) => {
        const [rooms, setRooms] = useState<Room[]>(initialRooms);
        const [activeRoom, setActiveRoom] = useState<string | null>(initialRoomId);
        const [messages, setMessages] = useState<Message[]>(initialMessages);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [draft, setDraft] = useState("");

        const styles = variants[variant];

        useEffect(() => {
            async function refreshRooms() {
                try {
                    const data = await fetchJSON<{ rooms: Room[] }>(`${apiBasePath}/rooms`);
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
        }, [activeRoom, apiBasePath]);

        const loadMessages = useCallback(
            async (roomId: string) => {
                setLoading(true);
                try {
                    const data = await fetchJSON<{ messages: Message[] }>(
                        `${apiBasePath}/rooms/${roomId}/messages?limit=50`,
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
            [apiBasePath],
        );

        useEffect(() => {
            if (!activeRoom) {
                setMessages([]);
                return undefined;
            }
            loadMessages(activeRoom).catch(() => { });
            const interval = setInterval(() => {
                loadMessages(activeRoom).catch(() => { });
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
                    await fetchJSON<{ id: string }>(`${apiBasePath}/rooms/${activeRoom}/messages`, {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                    setDraft("");
                    await loadMessages(activeRoom);
                } catch (err) {
                    setError(err instanceof Error ? err.message : "Unable to send message");
                }
            },
            [activeRoom, draft, loadMessages, apiBasePath],
        );

        return (
            <div className={`${styles.container} ${className || ""}`} ref={ref}>
                <RoomSelector
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onRoomChange={setActiveRoom}
                    variant={variant}
                    title={title}
                />
                <section className={styles.main}>
                    <header className={styles.header}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className={styles.headerMeta}>
                                    {activeRoomMeta ? (activeRoomMeta.private ? "Encrypted" : "Open Channel") : "Select a channel"}
                                </div>
                                <h1 className={styles.headerTitle}>
                                    {activeRoomMeta?.name ?? title}
                                </h1>
                            </div>
                            <div className={styles.headerStatus}>
                                {loading ? "Syncing…" : `Polling every 10s`}
                            </div>
                        </div>
                    </header>
                    <div className={styles.main}>
                        <div className={styles.messageArea}>
                            {error && (
                                <div className={styles.errorAlert}>
                                    {error}
                                </div>
                            )}
                            <div className={styles.messagesContainer}>
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        variant={variant}
                                    />
                                ))}
                                {messages.length === 0 && (
                                    <div className={styles.emptyState}>
                                        No messages yet. Start the conversation to populate this channel.
                                    </div>
                                )}
                            </div>
                        </div>
                        <footer className={styles.footer}>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    placeholder={activeRoom ? "Encrypted message" : "Select a room to enable messaging"}
                                    className={styles.textarea}
                                    rows={3}
                                    disabled={!activeRoom}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={!activeRoom || !draft.trim()}
                                    className={styles.button}
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
);

ChatWidget.displayName = "ChatWidget";
