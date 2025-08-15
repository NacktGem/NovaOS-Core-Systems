import json
import logging
import math
import uuid
from datetime import date, datetime
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional

import bcrypt
import sqlalchemy as sa
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker
from starlette.middleware.base import BaseHTTPMiddleware

from payments.base import PaymentProvider
from payments.crypto_btcpay import BTCPayProvider
from payments.stripe import StripeProvider
from state import user_flag_cache

DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost/novaos"
engine = sa.create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

metadata = sa.MetaData()
users = sa.Table('users', metadata, schema='auth', autoload_with=engine)
permissions = sa.Table('permissions', metadata, schema='roles', autoload_with=engine)
user_permissions = sa.Table('user_permissions', metadata, schema='roles', autoload_with=engine)
tiers = sa.Table('tiers', metadata, schema='billing', autoload_with=engine)
subscriptions = sa.Table('subscriptions', metadata, schema='billing', autoload_with=engine)
palettes = sa.Table('palettes', metadata, schema='content', autoload_with=engine)
palette_purchases = sa.Table('palette_purchases', metadata, schema='content', autoload_with=engine)
invoices = sa.Table('invoices', metadata, schema='billing', autoload_with=engine)
feature_flags = sa.Table('feature_flags', metadata, schema='toggles', autoload_with=engine)

ROLE_DEFAULT_PERMS: Dict[str, Dict[str, bool]] = {
    'godmode': {'*': True},
    'super_admin_jules': {'manage_roles': True},
    'super_admin_nova': {'manage_roles': True},
}

sessions: Dict[str, uuid.UUID] = {}
MEDIA_QUEUE = Path(__file__).resolve().parents[1] / 'media-pipeline' / 'jobs' / 'queue.jsonl'

logger = logging.getLogger("core")
logging.basicConfig(level=logging.INFO, format='%(message)s')


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_from_session(token: Optional[str], db: Session) -> Optional[SimpleNamespace]:
    if not token or token not in sessions:
        return None
    user_id = sessions[token]
    row = db.execute(select(users).where(users.c.id == user_id)).first()
    if row:
        return SimpleNamespace(**row._mapping)
    return None


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        with SessionLocal() as db:
            user = get_user_from_session(request.cookies.get('session_token'), db)
        response = await call_next(request)
        if user and user.role == 'godmode':
            return response
        log_data = {
            'request_id': request_id,
            'route': request.url.path,
            'actor': str(user.id) if user else None,
            'role': user.role if user else None,
            'status': response.status_code,
        }
        logger.info(json.dumps(log_data))
        return response


app = FastAPI()
app.add_middleware(LoggingMiddleware)


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    dob: Optional[date] = None


def verify_csrf(request: Request):
    cookie = request.cookies.get('csrf_token')
    header = request.headers.get('X-CSRF-Token')
    if not cookie or not header or cookie != header:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='CSRF token mismatch')


def create_session(response: Response, user_id: uuid.UUID) -> None:
    token = uuid.uuid4().hex
    sessions[token] = user_id
    csrf = uuid.uuid4().hex
    response.set_cookie('session_token', token, httponly=True, secure=True, samesite='strict')
    response.set_cookie('csrf_token', csrf, httponly=False, secure=True, samesite='strict')


def require_user(request: Request, db: Session = Depends(get_db)) -> SimpleNamespace:
    user = get_user_from_session(request.cookies.get('session_token'), db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user


class SubscribeRequest(BaseModel):
    tier_key: str


class ProviderError(HTTPException):
    pass


def get_provider(db: Session) -> PaymentProvider:
    stripe_flag = db.execute(select(feature_flags.c.enabled).where(feature_flags.c.key == 'payments.stripe.enabled')).scalar()
    crypto_flag = db.execute(select(feature_flags.c.enabled).where(feature_flags.c.key == 'payments.crypto.enabled')).scalar()
    if stripe_flag:
        return StripeProvider()
    if crypto_flag:
        return BTCPayProvider()
    raise ProviderError(status_code=503, detail='no payment provider')
 
@app.post('/auth/register', response_model=UserOut)
def register(data: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    verify_csrf(request)
    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    user_id = uuid.uuid4()
    db.execute(sa.insert(users).values(id=user_id, email=data.email, username=data.username, password_hash=hashed, role='guest', status='active'))
    db.commit()
    create_session(response, user_id)
    row = db.execute(select(users).where(users.c.id == user_id)).first()
    return row._mapping


@app.post('/auth/login', response_model=UserOut)
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    verify_csrf(request)
    row = db.execute(select(users).where(users.c.email == data.email)).first()
    if not row or not bcrypt.checkpw(data.password.encode(), row.password_hash.encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    create_session(response, row.id)
    return row._mapping


@app.post('/auth/logout')
def logout(request: Request, response: Response):
    verify_csrf(request)
    token = request.cookies.get('session_token')
    if token and token in sessions:
        del sessions[token]
    response.delete_cookie('session_token')
    response.delete_cookie('csrf_token')
    return {'ok': True}


@app.get('/me', response_model=UserOut)
def me(user: SimpleNamespace = Depends(require_user)):
    return user.__dict__


class RoleUpdate(BaseModel):
    role: str


@app.get('/admin/roles/{user_id}')
def get_roles(user_id: uuid.UUID, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in ('godmode', 'super_admin_jules', 'super_admin_nova', 'admin_agent'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    target = db.execute(select(users).where(users.c.id == user_id)).first()
    if not target:
        raise HTTPException(status_code=404)
    perm_rows = db.execute(select(user_permissions.c.perm_key, user_permissions.c.value).where(user_permissions.c.user_id == user_id)).all()
    perms = {r.perm_key: r.value for r in perm_rows}
    return {'role': target.role, 'permissions': perms}


@app.post('/admin/roles/{user_id}')
def set_role(user_id: uuid.UUID, data: RoleUpdate, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    if user.role not in ('godmode', 'super_admin_jules', 'super_admin_nova'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    db.execute(sa.update(users).where(users.c.id == user_id).values(role=data.role))
    db.commit()
    return {'ok': True}


@app.get('/me/permissions')
def me_permissions(user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    perms = ROLE_DEFAULT_PERMS.get(user.role, {}).copy()
    rows = db.execute(select(user_permissions.c.perm_key, user_permissions.c.value).where(user_permissions.c.user_id == user.id)).all()
    for r in rows:
        perms[r.perm_key] = r.value
    return perms


class FeatureFlagOut(BaseModel):
    key: str
    enabled: bool
    scope: str


def flag_visible(scope: str, role: str) -> bool:
    if scope == 'global':
        return True
    if scope == 'admin':
        return role in ('godmode','super_admin_jules','super_admin_nova','admin_agent')
    if scope == 'creator':
        return role.startswith('creator') or flag_visible('admin', role)
    if scope == 'user':
        return role != 'guest'
    return False


@app.get('/feature-flags', response_model=List[FeatureFlagOut])
def get_feature_flags(user: SimpleNamespace = Depends(require_user)):
    return [FeatureFlagOut(**row.__dict__) for row in select_flags(user.role, user.id)]


def select_flags(role: str, user_id: Optional[uuid.UUID]) -> List[Any]:
    with SessionLocal() as db:
        rows = db.execute(select(feature_flags)).all()
    cache = user_flag_cache.get(user_id, {}) if user_id else {}
    result = []
    for r in rows:
        if flag_visible(r.scope, role):
            enabled = cache.get(r.key, r.enabled)
            result.append(SimpleNamespace(key=r.key, enabled=enabled, scope=r.scope))
    return result


@app.get('/me/palettes')
def me_palettes(user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    owned = set(db.execute(select(palette_purchases.c.palette_key).where(palette_purchases.c.user_id == user.id)).scalars())
    free = set(db.execute(select(palettes.c.key).where(palettes.c.is_free == True)).scalars())
    owned |= free
    sub = db.execute(
        select(tiers.c.key)
        .select_from(subscriptions.join(tiers, subscriptions.c.tier_id == tiers.c.id))
        .where(subscriptions.c.user_id == user.id, subscriptions.c.status == 'active')
    ).scalar()
    if sub in ('sovereign_standard', 'sovereign_premium'):
        paid = set(db.execute(select(palettes.c.key).where(palettes.c.is_free == False)).scalars())
        owned |= paid
    rows = db.execute(select(palettes).where(palettes.c.key.in_(owned))).all()
    return [row._mapping for row in rows]


@app.get('/me/sovereign')
def me_sovereign(user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    row = db.execute(
        select(tiers.c.key, tiers.c.features_json)
        .select_from(subscriptions.join(tiers, subscriptions.c.tier_id == tiers.c.id))
        .where(subscriptions.c.user_id == user.id, subscriptions.c.status == 'active')
    ).first()
    if not row:
        return {'active': False, 'tier_key': None, 'features': {}}
    return {'active': True, 'tier_key': row.key, 'features': row.features_json}


class SplitRequest(BaseModel):
    gross_cents: int


class SplitResponse(BaseModel):
    platform_cents: int
    creator_cents: int


@app.post('/calc/split', response_model=SplitResponse)
def calc_split(data: SplitRequest, request: Request, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    verify_csrf(request)
    sub = db.execute(
        select(tiers.c.key)
        .select_from(subscriptions.join(tiers, subscriptions.c.tier_id == tiers.c.id))
        .where(subscriptions.c.user_id == user.id, subscriptions.c.status == 'active')
    ).scalar()
    rate = 0.08 if sub in ('sovereign_standard','sovereign_premium') else 0.12
    platform = math.floor(data.gross_cents * rate)
    creator = data.gross_cents - platform
    return {'platform_cents': platform, 'creator_cents': creator}


@app.post('/billing/subscribe')
def billing_subscribe(data: SubscribeRequest, request: Request, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    verify_csrf(request)
    tier = db.execute(select(tiers).where(tiers.c.key == data.tier_key)).first()
    if not tier:
        raise HTTPException(status_code=404)
    provider = get_provider(db)
    return provider.create_checkout(user.id, 'subscription', data.tier_key, tier.price_cents, 'USD')


@app.post('/billing/palette/{palette_key}/buy')
def billing_palette_buy(palette_key: str, request: Request, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    verify_csrf(request)
    pal = db.execute(select(palettes).where(palettes.c.key == palette_key)).first()
    if not pal or pal.is_free:
        raise HTTPException(status_code=404)
    provider = get_provider(db)
    return provider.create_checkout(user.id, 'palette', palette_key, pal.price_cents, 'USD')


@app.get('/billing/invoices')
def billing_invoices(user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    rows = db.execute(select(invoices).where(invoices.c.user_id == user.id)).all()
    return [r._mapping for r in rows]


@app.post('/billing/crypto/webhook')
def billing_crypto_webhook(payload: Dict[str, Any]):
    BTCPayProvider().handle_webhook(payload)
    return {'ok': True}


@app.post('/billing/stripe/webhook')
def billing_stripe_webhook(payload: Dict[str, Any], db: Session = Depends(get_db)):
    flag = db.execute(select(feature_flags.c.enabled).where(feature_flags.c.key == 'payments.stripe.enabled')).scalar()
    if not flag:
        raise HTTPException(status_code=404)
    StripeProvider().handle_webhook(payload)
    return {'ok': True}


class UploadRequest(BaseModel):
    post_id: int
    input_path: str
    watermark_mode: str


class MediaCallback(BaseModel):
    post_id: int
    manifest: Dict[str, Any]


@app.post('/media/upload')
def media_upload(data: UploadRequest, user: SimpleNamespace = Depends(require_user), db: Session = Depends(get_db)):
    sub = db.execute(select(tiers.c.key).select_from(subscriptions.join(tiers, subscriptions.c.tier_id == tiers.c.id)).where(subscriptions.c.user_id == user.id, subscriptions.c.status == 'active')).scalar()
    priority = 100 if sub in ('sovereign_standard','sovereign_premium') else 10
    job = {
        'creator_id': str(user.id),
        'post_id': data.post_id,
        'input_path': data.input_path,
        'watermark_mode': data.watermark_mode,
        'priority': priority,
        'created_at': datetime.utcnow().isoformat()
    }
    with open(MEDIA_QUEUE, 'a') as f:
        f.write(json.dumps(job) + '\n')
    return {'queued': True}


@app.post('/media/callback')
def media_callback(data: MediaCallback):
    return {'ok': True}
