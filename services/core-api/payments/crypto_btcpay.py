import os
import uuid
from datetime import datetime
from typing import Any, Dict

import requests
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

from .base import PaymentProvider
from ..state import user_flag_cache

DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost/novaos"
engine = sa.create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

pending: Dict[str, Dict[str, Any]] = {}


class BTCPayProvider(PaymentProvider):
    def __init__(self):
        self.server = os.getenv('BTCPAY_SERVER_URL')
        self.api_key = os.getenv('BTCPAY_API_KEY')
        self.manual = not (self.server and self.api_key)

    def create_checkout(self, user_id: uuid.UUID, item_type: str, item_key: str, price_cents: int, currency: str) -> Dict[str, Any]:
        if self.manual:
            pid = uuid.uuid4().hex
            pending[pid] = {
                'user_id': user_id,
                'item_type': item_type,
                'item_key': item_key,
                'price_cents': price_cents,
                'currency': currency,
            }
            qr = f"manual:{pid}:{price_cents}{currency}"
            return {'payment_id': pid, 'qr': qr}
        headers = {'Authorization': f'Bearer {self.api_key}'}
        data = {
            'amount': price_cents / 100,
            'currency': currency,
            'metadata': {
                'user_id': str(user_id),
                'item_type': item_type,
                'item_key': item_key,
            },
        }
        resp = requests.post(f'{self.server}/api/v1/invoices', json=data, headers=headers, timeout=10)
        resp.raise_for_status()
        inv = resp.json()
        pending[inv['id']] = {
            'user_id': user_id,
            'item_type': item_type,
            'item_key': item_key,
            'price_cents': price_cents,
            'currency': currency,
        }
        return {'payment_id': inv['id'], 'checkout_url': inv['checkoutLink']}

    def handle_webhook(self, payload: Dict[str, Any]) -> None:
        pid = payload.get('id') or payload.get('invoiceId')
        info = pending.get(pid)
        if not info:
            return
        with SessionLocal() as db:
            user_id = info['user_id']
            if info['item_type'] == 'subscription':
                tier = db.execute(sa.text("SELECT id, features_json FROM billing.tiers WHERE key=:k"), {'k': info['item_key']}).first()
                if not tier:
                    return
                now = datetime.utcnow()
                db.execute(sa.text("INSERT INTO billing.invoices(user_id,tier_id,amount_cents,currency,created_at,paid_at,provider,provider_ref) VALUES (:u,:t,:a,:c,:now,:now,'crypto',:ref)"),
                           {'u': str(user_id), 't': tier.id, 'a': info['price_cents'], 'c': info['currency'], 'now': now, 'ref': pid})
                db.execute(sa.text("INSERT INTO billing.subscriptions(user_id,tier_id,status,started_at) VALUES (:u,:t,'active',:now)"),
                           {'u': str(user_id), 't': tier.id, 'now': now})
                features = tier.features_json.get('flags', [])
                cache = user_flag_cache.setdefault(user_id, {})
                for f in features:
                    cache[f] = True
            elif info['item_type'] == 'palette':
                db.execute(sa.text("INSERT INTO content.palette_purchases(user_id,palette_key,price_cents) VALUES (:u,:k,:p)"),
                           {'u': str(info['user_id']), 'k': info['item_key'], 'p': info['price_cents']})
            db.commit()
        del pending[pid]
