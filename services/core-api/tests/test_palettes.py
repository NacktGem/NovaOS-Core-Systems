import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))


def test_palettes_list_and_unlock_stub(client, session):
    from app.db.models import Purchase
    client.post("/auth/login", json={"email": "user1@local", "password": "devdev"})
    palettes = client.get("/palettes/").json()
    locked_palette = next(p for p in palettes if p["locked"])
    res = client.post(
        "/payments/upgrade",
        json={"target": "palette", "id": locked_palette["id"], "price_cents": 1000},
        headers={"x-csrf-token": client.cookies.get("csrf_token")},
    )
    assert res.status_code == 200
    palettes = client.get("/palettes/").json()
    updated = {p["id"]: p for p in palettes}
    assert not updated[locked_palette["id"]]["locked"]
    # ensure purchase exists
    assert session.query(Purchase).count() == 1
