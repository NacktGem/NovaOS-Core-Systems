import { useEffect, useRef, useState, useCallback } from "react";
import { fireAnalytics } from "../http/api";

export function useEcho(room: string, wsUrl: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<unknown[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queue = useRef<string[]>([]);
  const reconnectRef = useRef<number>(0);

  const send = useCallback(
    (payload: unknown) => {
      const data = JSON.stringify(payload);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
      else queue.current.push(data);
      fireAnalytics("message_send", { room });
    },
    [room]
  );

  useEffect(() => {
    let alive = true;
    function connect() {
      const url = new URL(wsUrl);
      url.searchParams.set("room", room);
      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        while (queue.current.length) ws.send(queue.current.shift()!);
        fireAnalytics("echo_connect", { room });
      };
      ws.onmessage = (evt) => {
        try { setMessages((m) => [...m, JSON.parse(evt.data)]); }
        catch { /* ignore malformed */ }
      };
      ws.onclose = () => {
        setConnected(false);
        fireAnalytics("echo_disconnect", { room });
        if (!alive) return;
        const timeout = Math.min(1000 * Math.pow(2, reconnectRef.current++), 15000);
        setTimeout(connect, timeout);
      };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { alive = false; wsRef.current?.close(); };
  }, [room, wsUrl]);

  return { connected, messages, send };
}
