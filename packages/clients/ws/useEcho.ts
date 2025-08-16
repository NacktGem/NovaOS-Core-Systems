import { useEffect, useRef, useState, useCallback } from "react";

export function useEcho(room: string, wsUrl: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queue = useRef<string[]>([]);
  const reconnectRef = useRef<number>(0);

  const send = useCallback((payload: any) => {
    const data = JSON.stringify(payload);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
    else queue.current.push(data);
  }, []);

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
      };
      ws.onmessage = (evt) => {
        try { setMessages((m) => [...m, JSON.parse(evt.data)]); } catch {}
      };
      ws.onclose = () => {
        setConnected(false);
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
