import logging
import uuid
from datetime import datetime
import importlib.util
import pathlib
codex/initialize-monorepo-structure-and-workspace
import sys
main

import bcrypt
import sqlalchemy as sa
from fastapi.testclient import TestClient

codex/initialize-monorepo-structure-and-workspace
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

 main
spec = importlib.util.spec_from_file_location(
    "core_api", pathlib.Path(__file__).resolve().parents[1] / "main.py"
)
core = importlib.util.module_from_spec(spec)
spec.loader.exec_module(core)

app = core.app
sessions = core.sessions
SessionLocal = core.SessionLocal
users = core.users
palette_purchases = core.palette_purchases
tiers = core.tiers
subscriptions = core.subscriptions
codex/initialize-monorepo-structure-and-workspace
invoices = core.invoices
main

client = TestClient(app)


def create_user(role: str = 'guest') -> uuid.UUID:
    email = f"{uuid.uuid4().hex}@example.com"
    username = uuid.uuid4().hex[:8]
    pw = bcrypt.hashpw(b'pass', bcrypt.gensalt()).decode()
    user_id = uuid.uuid4()
    with SessionLocal() as db:
        db.execute(sa.insert(users).values(id=user_id, email=email, username=username, password_hash=pw, role=role, status='active'))
        db.commit()
    return user_id


def set_session(user_id: uuid.UUID, csrf: str = 'token'):
    token = uuid.uuid4().hex
    sessions[token] = user_id
    client.cookies.set('session_token', token)
    client.cookies.set('csrf_token', csrf)
    return token


def test_godmode_logging_bypass(caplog):
    sessions.clear()
    normal_id = create_user()
    god_id = create_user(role='godmode')

    set_session(normal_id)
    caplog.clear()
    with caplog.at_level(logging.INFO):
        client.get('/me')
    assert any('/me' in rec.message for rec in caplog.records if rec.name == 'core')

    set_session(god_id)
    caplog.clear()
    with caplog.at_level(logging.INFO):
        client.get('/me')
    assert not any('/me' in rec.message for rec in caplog.records if rec.name == 'core')


def test_split_calc():
    sessions.clear()
    user_a = create_user()
    set_session(user_a, csrf='a')
    res = client.post('/calc/split', json={'gross_cents': 10000}, headers={'X-CSRF-Token': 'a'})
    assert res.json() == {'platform_cents': 1200, 'creator_cents': 8800}

    user_b = create_user()
    with SessionLocal() as db:
        tier_id = db.execute(sa.select(tiers.c.id).where(tiers.c.key == 'sovereign_standard')).scalar_one()
        db.execute(sa.insert(subscriptions).values(user_id=user_b, tier_id=tier_id, status='active', started_at=datetime.utcnow()))
        db.commit()
    set_session(user_b, csrf='b')
    res = client.post('/calc/split', json={'gross_cents': 10000}, headers={'X-CSRF-Token': 'b'})
    assert res.json() == {'platform_cents': 800, 'creator_cents': 9200}


def test_palette_ownership():
    sessions.clear()
    u1 = create_user()
    with SessionLocal() as db:
        db.execute(sa.insert(palette_purchases).values(user_id=u1, palette_key='midnight_rose', price_cents=300))
        db.commit()
    set_session(u1)
    res = client.get('/me/palettes')
    keys = {p['key'] for p in res.json()}
    assert {'light', 'dark', 'midnight_rose'}.issubset(keys)
    assert 'velvet_amber' not in keys

    u2 = create_user()
    with SessionLocal() as db:
        tier_id = db.execute(sa.select(tiers.c.id).where(tiers.c.key == 'sovereign_standard')).scalar_one()
        db.execute(sa.insert(subscriptions).values(user_id=u2, tier_id=tier_id, status='active', started_at=datetime.utcnow()))
        db.commit()
    set_session(u2)
    res = client.get('/me/palettes')
    keys = {p['key'] for p in res.json()}
    assert {'midnight_rose', 'obsidian_teal', 'velvet_amber'}.issubset(keys)
codex/initialize-monorepo-structure-and-workspace

def test_manual_crypto_flow():
    sessions.clear()
    user = create_user()
    set_session(user, csrf='c')
    res = client.post('/billing/subscribe', json={'tier_key': 'sovereign_standard'}, headers={'X-CSRF-Token': 'c'})
    pid = res.json()['payment_id']
    client.post('/billing/crypto/webhook', json={'id': pid})
    with SessionLocal() as db:
        sub = db.execute(sa.select(subscriptions).where(subscriptions.c.user_id == user)).first()
        inv = db.execute(sa.select(invoices).where(invoices.c.user_id == user)).first()
        assert sub and sub.status == 'active'
        assert inv is not None
    res = client.post('/billing/palette/midnight_rose/buy', headers={'X-CSRF-Token': 'c'})
    pid = res.json()['payment_id']
    client.post('/billing/crypto/webhook', json={'id': pid})
    res = client.get('/me/palettes')
    keys = {p['key'] for p in res.json()}
    assert 'midnight_rose' in keys
main
