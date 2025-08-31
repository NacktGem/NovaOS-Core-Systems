import uuid

from fastapi.testclient import TestClient

from app.main import app
from app.db.models import Message, Room


def get_room_id(session, name: str):
    return str(session.query(Room).filter_by(name=name).first().id)


def test_internal_messages_guarded_by_token(client, session):
    room_id = get_room_id(session, "family-home")
    res = client.post(
        "/internal/messages",
        json={"room": room_id, "body": "hi", "user_id": str(uuid.uuid4())},
    )
    assert res.status_code == 401
    res = client.post(
        "/internal/messages",
        headers={"X-Internal-Token": "wrong"},
        json={"room": room_id, "body": "hi", "user_id": str(uuid.uuid4())},
    )
    assert res.status_code == 401
    res = client.post(
        "/internal/messages",
        headers={"X-Internal-Token": "dev_internal_token"},
        json={"room": room_id, "body": "hi", "user_id": str(uuid.uuid4())},
    )
    assert res.status_code == 201
    assert session.query(Message).count() == 1


def test_internal_messages_skip_persist_for_godmode(client, session):
    room_id = get_room_id(session, "family-home")
    res = client.post(
        "/internal/messages",
        headers={"X-Internal-Token": "dev_internal_token"},
        json={"room": room_id, "body": "secret", "user_id": None},
    )
    assert res.status_code == 202
    assert session.query(Message).count() == 1  # unchanged from previous test
