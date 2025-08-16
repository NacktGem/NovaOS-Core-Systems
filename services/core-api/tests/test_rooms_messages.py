import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))


def get_room_id(session, name):
    from app.db.models import Room

    return str(session.query(Room).filter_by(name=name).first().id)


def test_non_founder_message_persisted(client, session):
    from app.db.models import Message

    room_id = get_room_id(session, "family-home")
    client.post("/auth/login", json={"email": "user1@local", "password": "devdev"})
    csrf = client.cookies.get("csrf_token")
    res = client.post(
        f"/rooms/{room_id}/messages",
        json={"body": "hi"},
        headers={"x-csrf-token": csrf},
    )
    assert res.status_code == 201
    assert session.query(Message).count() == 1


def test_founder_message_not_persisted(client, session):
    from app.db.models import Message

    room_id = get_room_id(session, "family-home")
    client.post("/auth/login", json={"email": "founder@local", "password": "devdev"})
    csrf = client.cookies.get("csrf_token")
    res = client.post(
        f"/rooms/{room_id}/messages",
        json={"body": "secret"},
        headers={"x-csrf-token": csrf},
    )
    assert res.status_code == 202
    assert session.query(Message).count() == 1


def test_rooms_visibility_and_memberships(client):
    client.post("/auth/login", json={"email": "user1@local", "password": "devdev"})
    rooms = {r["name"]: r for r in client.get("/rooms/").json()}
    assert "family-home" in rooms
    assert "rose-garden" in rooms
    assert "creator-hub" in rooms
    assert "founder-room" not in rooms
    assert "admin-desk" not in rooms
    client.post("/auth/logout")
    client.post("/auth/login", json={"email": "founder@local", "password": "devdev"})
    rooms = {r["name"]: r for r in client.get("/rooms/").json()}
    assert "founder-room" in rooms
    assert "admin-desk" in rooms
