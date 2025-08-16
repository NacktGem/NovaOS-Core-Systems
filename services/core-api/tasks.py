import os

os.environ.setdefault("AUTH_PEPPER", "dev_pepper")

from invoke import task
from sqlalchemy import text

from app.db.base import engine, SessionLocal
from app.db import models
from app.security.passwords import hash_password


@task
def db_init(c):
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn, open("scripts/db_init.sql") as f:
            conn.execute(text(f.read()))
    c.run("alembic upgrade head")


@task
def db_migrate(c, m):
    c.run(f"alembic revision --autogenerate -m '{m}'")


@task
def db_upgrade(c):
    c.run("alembic upgrade head")


@task
def db_seed(c):
    session = SessionLocal()
    try:
        roles = [
            ("godmode", "Founder"),
            ("superadmin", "Super Admin"),
            ("admin", "Admin"),
            ("creator", "Creator"),
            ("user", "User"),
        ]
        for name, desc in roles:
            if not session.query(models.Role).filter_by(name=name).first():
                session.add(models.Role(name=name, description=desc))
        tiers = [
            ("free", "Free", 0),
            ("sovereign", "Sovereign", 0),
        ]
        for name, desc, price in tiers:
            if not session.query(models.Tier).filter_by(name=name).first():
                session.add(models.Tier(name=name, description=desc, monthly_price_cents=price))
        users = [
            ("founder@local", "godmode", []),
            ("jules@local", "superadmin", []),
            ("creator1@local", "creator", ["sovereign"]),
            ("user1@local", "user", ["free"]),
        ]
        for email, role, tiers in users:
            if not session.query(models.User).filter_by(email=email).first():
                session.add(
                    models.User(
                        email=email,
                        password_hash=hash_password("devdev"),
                        role=role,
                        tiers=tiers,
                    )
                )
        rooms = [
            ("family-home", False),
            ("rose-garden", False),
            ("creator-hub", False),
            ("founder-room", True),
            ("admin-desk", True),
        ]
        room_objs = {}
        for name, private in rooms:
            existing = session.query(models.Room).filter_by(name=name).first()
            if existing:
                r = existing
            else:
                r = models.Room(name=name, private=private)
                session.add(r)
                session.flush()
            room_objs[name] = r
        memberships = {
            "family-home": ["founder@local", "jules@local", "creator1@local", "user1@local"],
            "rose-garden": ["founder@local", "jules@local", "creator1@local"],
            "creator-hub": ["creator1@local"],
            "founder-room": ["founder@local"],
            "admin-desk": ["founder@local", "jules@local"],
        }
        user_map = {u.email: u for u in session.query(models.User).all()}
        for room_name, emails in memberships.items():
            for email in emails:
                if (
                    not session.query(models.RoomMember)
                    .filter_by(room_id=room_objs[room_name].id, user_id=user_map[email].id)
                    .first()
                ):
                    session.add(
                        models.RoomMember(room_id=room_objs[room_name].id, user_id=user_map[email].id)
                    )
        palettes = [
            (
                "dark",
                ["#A33A5B", "#89333F", "#431D21", "#000003", "#19212A", "#013E43"],
                False,
            ),
            (
                "light",
                ["#131F2F", "#102E4D", "#3F4F6E", "#695C7B", "#E66F5C", "#FE9B62"],
                True,
            ),
        ]
        for name, colors, locked in palettes:
            existing = session.query(models.Palette).filter_by(name=name).first()
            if not existing:
                session.add(models.Palette(name=name, colors=colors, locked=locked))
        session.commit()
    finally:
        session.close()
