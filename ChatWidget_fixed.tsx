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
    initialRoomId?: string;
    initialMessages?: Message[];
    variant?: "blackRose" | "gypsyCove" | "novaos";
    title?: string;
    apiBasePath?: string;
    className?: string;
}

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
        const [rooms, setRooms] = useState<Room[]>(initialRooms || []);
        const [currentRoomId, setCurrentRoomId] = useState<string | null>(
            initialRoomId || (initialRooms && initialRooms.length > 0 ? initialRooms[0].id : null)
        );
        const [messages, setMessages] = useState<Message[]>(initialMessages || []);
        const [newMessage, setNewMessage] = useState("");

        const currentRoom = useMemo(() => {
            return rooms.find(r => r.id === currentRoomId) || null;
        }, [rooms, currentRoomId]);

        const sendMessage = useCallback(async (e: FormEvent) => {
            e.preventDefault();
            if (!newMessage.trim() || !currentRoomId) return;

            const message: Message = {
                id: Date.now().toString(),
                user_id: "current-user",
                body: newMessage.trim()
            };

            setMessages(prev => [...prev, message]);
            setNewMessage("");
        }, [newMessage, currentRoomId]);

        return (
            <div ref={ref} className={`chat-widget ${variant} ${className || ""}`}>
                <div className="chat-header">
                    <h3>{title}</h3>
                    <RoomSelector
                        rooms={rooms}
                        currentRoomId={currentRoomId}
                        onRoomChange={setCurrentRoomId}
                    />
                </div>
                <div className="chat-messages">
                    {messages.map(message => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                </div>
                <form onSubmit={sendMessage} className="chat-input">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        );
    }
);

ChatWidget.displayName = "ChatWidget";
