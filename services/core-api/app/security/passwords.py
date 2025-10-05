import os
from argon2 import PasswordHasher

_ph = PasswordHasher()

PEPPER = os.getenv("AUTH_PEPPER", "")

def hash_password(plain: str) -> str:
    if not PEPPER:
        raise RuntimeError("AUTH_PEPPER not set")
    return _ph.hash(plain + PEPPER)

def verify_password(plain: str, hashed: str) -> bool:
    if not PEPPER:
        raise RuntimeError("AUTH_PEPPER not set")
    try:
        return _ph.verify(hashed, plain + PEPPER)
    except Exception:
        return False
