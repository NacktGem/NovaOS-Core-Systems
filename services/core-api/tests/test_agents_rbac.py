import pytest


def test_agent_role_allowed(client):
    resp = client.post(
        "/agents/echo",
        json={"command": "send_message", "args": {"message": "hi"}},
        headers={"x-role": "GODMODE", "x-csrf-token": "t"},
        cookies={"csrf_token": "t"},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_agent_role_denied(client):
    resp = client.post(
        "/agents/echo",
        json={"command": "send_message", "args": {"message": "hi"}},
        headers={"x-role": "USER", "x-csrf-token": "t"},
        cookies={"csrf_token": "t"},
    )
    assert resp.status_code == 403
