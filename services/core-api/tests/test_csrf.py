
def test_csrf_required_on_post(client):
    res = client.post("/auth/login", json={"email": "user1@local", "password": "devdev"})
    assert res.status_code == 200
    # missing header
    res = client.post(
        "/consent/upload",
        json={"partner_name": "p", "content_ids": []},
    )
    assert res.status_code == 403
    csrf = client.cookies.get("csrf_token")
    res = client.post(
        "/consent/upload",
        json={"partner_name": "p", "content_ids": []},
        headers={"x-csrf-token": csrf},
    )
    assert res.status_code == 200
