import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))


def test_auth_login_success(client):
    res = client.post("/auth/login", json={"email": "user1@local", "password": "devdev"})
    assert res.status_code == 200
    assert "access_token" in res.cookies
    assert "csrf_token" in res.cookies
    data = res.json()
    assert data["role"] == "user"
    assert data["tiers"] == ["free"]


def test_jwt_claims_include_role_tiers(client):
    from app.security import jwt

    res = client.post("/auth/login", json={"email": "creator1@local", "password": "devdev"})
    token = res.cookies["access_token"]
    claims = jwt.verify_token(token)
    assert claims["role"] == "creator"
    assert claims["tiers"] == ["sovereign"]
