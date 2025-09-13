import json
import uuid

import pytest
from httpx import AsyncClient, ASGITransport
from starlette.websockets import WebSocketDisconnect

from app.main import app


@pytest.mark.asyncio
async def test_echo_auth_rejects_invalid_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.websocket_connect("/ws?room=family-home", headers={"Authorization": "Bearer bad"}) as ws:
            with pytest.raises(WebSocketDisconnect) as exc:
                await ws.receive_text()
        assert exc.value.code == 4401


@pytest.mark.asyncio
async def test_echo_room_membership_enforced(token_factory):
    token = token_factory(str(uuid.uuid4()), "user1@local", "user", [])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.websocket_connect("/ws?room=founder-room", headers={"Authorization": f"Bearer {token}"}) as ws:
            with pytest.raises(WebSocketDisconnect) as exc:
                await ws.receive_text()
        assert exc.value.code == 4403


@pytest.mark.asyncio
async def test_echo_broadcast_and_persist_for_non_founder(token_factory, core_client):
    token = token_factory(str(uuid.uuid4()), "user1@local", "user", [])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.websocket_connect("/ws?room=family-home", headers={"Authorization": f"Bearer {token}"}) as ws:
            await ws.send_text(json.dumps({"body": "hi"}))
            data = json.loads(await ws.receive_text())
            assert data["body"] == "hi"
    assert len(core_client.calls) == 1


@pytest.mark.asyncio
async def test_echo_godmode_no_persist(token_factory, core_client):
    token = token_factory(str(uuid.uuid4()), "founder@local", "godmode", [])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        async with client.websocket_connect("/ws?room=family-home", headers={"Authorization": f"Bearer {token}"}) as ws:
            await ws.send_text(json.dumps({"body": "secret"}))
            data = json.loads(await ws.receive_text())
            assert data["body"] == "secret"
    assert len(core_client.calls) == 0


@pytest.mark.asyncio
async def test_healthz_ping_redis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/healthz")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
