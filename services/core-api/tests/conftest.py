import os
import pathlib
import sys
import rsa
import pytest
import redis.asyncio as redis


class FakePipe:
    def __init__(self, store):
        self.store = store
        self.key = None

    def incr(self, key, amount=1):
        self.key = key
        self.store[key] = self.store.get(key, 0) + amount
        return self

    def expire(self, key, window):
        return self

    async def execute(self):
        return (self.store[self.key], True)


class FakeRedis:
    def __init__(self):
        self.store = {}

    def pipeline(self):
        return FakePipe(self.store)


def setup_env(tmp_path: pathlib.Path):
    keys_dir = tmp_path
    priv = keys_dir / "priv.pem"
    pub = keys_dir / "pub.pem"
    pubkey, privkey = rsa.newkeys(512)
    priv.write_bytes(privkey.save_pkcs1())
    pub.write_bytes(pubkey.save_pkcs1())
    db_file = keys_dir / "test.db"
    os.environ.setdefault("DATABASE_URL", f"sqlite:///{db_file}")
    os.environ.setdefault("AUTH_PEPPER", "pepper")
    os.environ.setdefault("JWT_PRIVATE_KEY_PATH", str(priv))
    os.environ.setdefault("JWT_PUBLIC_KEY_PATH", str(pub))
    os.environ.setdefault("ECHO_INTERNAL_TOKEN", "dev_internal_token")
    os.environ.setdefault("CORS_ORIGINS", "http://test")
    os.environ.setdefault("REDIS_URL", "redis://test")


def patch_redis():
    redis.from_url = lambda *args, **kwargs: FakeRedis()


@pytest.fixture(scope="session", autouse=True)
def _setup(tmp_path_factory):
    tmp_path = tmp_path_factory.mktemp("core")
    sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))
    setup_env(tmp_path)
    patch_redis()
    from app.db.base import Base, engine, SessionLocal
    from app.db import models
    Base.metadata.create_all(engine)
    session = SessionLocal()
    from app.security.passwords import hash_password
    roles = ["godmode", "superadmin", "admin", "creator", "user"]
    for r in roles:
        session.add(models.Role(name=r, description=r.title()))
    tiers = ["free", "sovereign"]
    for t in tiers:
        session.add(models.Tier(name=t, description=t.title(), monthly_price_cents=0))
    users = [
        ("founder@local", "godmode", []),
        ("jules@local", "superadmin", []),
        ("creator1@local", "creator", ["sovereign"]),
        ("user1@local", "user", ["free"]),
    ]
    for email, role, tiers in users:
        session.add(models.User(email=email, password_hash=hash_password("devdev"), role=role, tiers=tiers))
    rooms = [
        ("family-home", False),
        ("rose-garden", False),
        ("creator-hub", False),
        ("founder-room", True),
        ("admin-desk", True),
    ]
    room_map = {}
    for name, private in rooms:
        room = models.Room(name=name, private=private)
        session.add(room)
        session.flush()
        room_map[name] = room
    member_map = {
        "family-home": ["founder@local", "jules@local", "creator1@local", "user1@local"],
        "rose-garden": ["founder@local", "jules@local", "creator1@local"],
        "creator-hub": ["creator1@local"],
        "founder-room": ["founder@local"],
        "admin-desk": ["founder@local", "jules@local"],
    }
    user_map = {u.email: u for u in session.query(models.User).all()}
    for room, emails in member_map.items():
        for email in emails:
            session.add(models.RoomMember(room_id=room_map[room].id, user_id=user_map[email].id))
    palettes = [
        ("dark", ["#A33A5B", "#89333F", "#431D21", "#000003", "#19212A", "#013E43"], False),
        ("light", ["#131F2F", "#102E4D", "#3F4F6E", "#695C7B", "#E66F5C", "#FE9B62"], True),
    ]
    for name, colors, locked in palettes:
        session.add(models.Palette(name=name, colors=colors, locked=locked))
    session.commit()
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client():
    from app.main import app
    from fastapi.testclient import TestClient

    return TestClient(app)


@pytest.fixture()
def session():
    from app.db.base import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
