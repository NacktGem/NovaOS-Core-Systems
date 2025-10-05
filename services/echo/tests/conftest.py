import os
import pytest_asyncio
import pathlib
import sys
import time

import jwt
import pytest
import rsa
import fakeredis.aioredis

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))
from app import deps  # noqa: E402

_priv_key: bytes | None = None


@pytest.fixture(scope="session", autouse=True)
def _setup(tmp_path_factory):
    global _priv_key
    tmp = tmp_path_factory.mktemp("echo")
    priv = tmp / "priv.pem"
    pub = tmp / "pub.pem"
    pubkey, privkey = rsa.newkeys(512)
    priv.write_bytes(privkey.save_pkcs1())
    pub.write_bytes(pubkey.save_pkcs1())
    _priv_key = privkey.save_pkcs1()
    os.environ.setdefault("JWT_PUBLIC_KEY_PATH", str(pub))
    os.environ.setdefault("CORE_API_URL", "http://core")
    os.environ.setdefault("ECHO_INTERNAL_TOKEN", "dev_internal_token")
    yield


@pytest_asyncio.fixture(autouse=True)
async def _patch_redis(monkeypatch):
    r = fakeredis.aioredis.FakeRedis()
    async def _get():
        return r
    monkeypatch.setattr(deps, "get_redis", _get)
    yield
    await r.flushdb()


@pytest_asyncio.fixture
async def core_client(monkeypatch):
    import httpx
    class MockClient:
        def __init__(self):
            self.calls = []
        async def post(self, path, json):
            self.calls.append((path, json))
            return httpx.Response(201, json={"id": "deadbeef-dead-beef-dead-beefdeadbeef"})
    client = MockClient()
    async def _get():
        return client
    monkeypatch.setattr(deps, "get_core_client", _get)
    return client


@pytest.fixture
def token_factory():
    def _make(sub: str, email: str, role: str, tiers=None, exp=None):
        payload = {"sub": sub, "email": email, "role": role, "tiers": tiers or [], "exp": exp or (int(time.time()) + 3600)}
        return jwt.encode(payload, _priv_key, algorithm="RS256")
    return _make
