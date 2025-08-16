
def test_auth_login_rate_limit(client):
    for _ in range(5):
        res = client.post("/auth/login", json={"email": "spam@local", "password": "wrong"})
        assert res.status_code in {200, 401}
    res = client.post("/auth/login", json={"email": "spam@local", "password": "wrong"})
    assert res.status_code == 429
