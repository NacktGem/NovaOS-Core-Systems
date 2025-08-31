import sys
import tempfile
import pathlib
import importlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.security import passwords as passwords_module  # noqa: E402


def test_password_hash_verify(monkeypatch):
    monkeypatch.setenv("AUTH_PEPPER", "pepper")
    importlib.reload(passwords_module)
    h = passwords_module.hash_password("secret")
    assert passwords_module.verify_password("secret", h)
    assert not passwords_module.verify_password("wrong", h)


def test_jwt_roundtrip(monkeypatch):
    priv = tempfile.NamedTemporaryFile(delete=False)
    pub = tempfile.NamedTemporaryFile(delete=False)
    import rsa
    pubkey, privkey = rsa.newkeys(512)
    priv.write(privkey.save_pkcs1())
    priv.flush()
    pub.write(pubkey.save_pkcs1())
    pub.flush()
    monkeypatch.setenv("JWT_PRIVATE_KEY_PATH", priv.name)
    monkeypatch.setenv("JWT_PUBLIC_KEY_PATH", pub.name)
    jwt_mod = importlib.import_module("app.security.jwt")
    importlib.reload(jwt_mod)
    tok = jwt_mod.create_token("123", {"email": "a@b", "role": "user"})
    data = jwt_mod.verify_token(tok)
    assert data["sub"] == "123"
    assert data["email"] == "a@b"
    assert data["role"] == "user"
