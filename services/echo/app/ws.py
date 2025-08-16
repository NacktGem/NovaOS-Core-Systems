import asyncio
import json
import uuid

from fastapi import WebSocket

from .deps import get_redis, get_core_client, get_logger
from .schemas import WSIn, WSOut, UserOut


class RoomHub:
    def __init__(self, max_queue: int = 500) -> None:
        self.max_queue = max_queue

    async def handle_socket(self, room: str, user, ws: WebSocket) -> None:
        redis = await get_redis()
        logger = get_logger()
        pub_chan = f"room:{room}"
        sub = redis.pubsub()
        await sub.subscribe(pub_chan)
        req_id = uuid.uuid4().hex

        recv_task = asyncio.create_task(self._recv_loop(room, user, ws, redis, req_id))
        send_task = asyncio.create_task(self._send_loop(ws, sub, req_id, room))

        done, pending = await asyncio.wait({recv_task, send_task}, return_when=asyncio.FIRST_COMPLETED)
        for task in pending:
            task.cancel()
        await sub.unsubscribe(pub_chan)

    async def _recv_loop(self, room: str, user, ws: WebSocket, redis, req_id: str) -> None:
        core = await get_core_client()
        logger = get_logger()
        while True:
            raw = await ws.receive_text()
            try:
                data = WSIn.model_validate_json(raw)
            except Exception:  # noqa: BLE001
                continue
            body = data.body.strip()
            if not body:
                continue
            event = WSOut(
                id=uuid.uuid4() if not user.is_godmode else None,
                body=body,
                user=UserOut(id=None if user.is_godmode else user.id, role=user.role),
                room=room,
            )
            if not user.is_godmode:
                try:
                    resp = await core.post(
                        "/internal/messages",
                        json={"room": room, "body": body, "user_id": str(user.id)},
                    )
                    resp.raise_for_status()
                    if resp.status_code == 201:
                        event.id = uuid.UUID(resp.json()["id"])
                except Exception:  # noqa: BLE001
                    logger.exception(
                        json.dumps({"request_id": req_id, "room": room, "event": "persist_fail", "user_role": user.role})
                    )
            await redis.publish(f"room:{room}", event.model_dump_json())
            logger.info(json.dumps({"request_id": req_id, "room": room, "event": "recv", "user_role": user.role}))

    async def _send_loop(self, ws: WebSocket, sub, req_id: str, room: str) -> None:
        logger = get_logger()
        queue: asyncio.Queue[str] = asyncio.Queue(self.max_queue)

        async def reader() -> None:
            async for msg in sub.listen():
                if msg["type"] != "message":
                    continue
                data = msg["data"]
                if queue.full():
                    queue.get_nowait()
                await queue.put(data)

        reader_task = asyncio.create_task(reader())
        try:
            while True:
                data = await queue.get()
                await ws.send_text(data)
        except Exception as exc:  # noqa: BLE001
            logger.exception(json.dumps({"request_id": req_id, "room": room, "event": "send_error"}))
            await ws.close(code=1011)
        finally:
            reader_task.cancel()
