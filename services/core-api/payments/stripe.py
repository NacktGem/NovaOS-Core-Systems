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


class StripeProvider(PaymentProvider):
    def __init__(self):
        self.secret = os.getenv('STRIPE_SECRET_KEY')
        self.manual = not self.secret

    def create_checkout(self, user_id: uuid.UUID, item_type: str, item_key: str, price_cents: int, currency: str) -> Dict[str, Any]:
        if self.manual:
            raise RuntimeError('Stripe disabled')
        data = {
            'mode': 'payment',
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
            'line_items': [{
                'price_data': {
                    'currency': currency.lower(),
                    'unit_amount': price_cents,
                    'product_data': {'name': item_key},
                },
                'quantity': 1,
            }],
            'metadata': {
                'user_id': str(user_id),
                'item_type': item_type,
                'item_key': item_key,
            },
        }
        resp = requests.post('https://api.stripe.com/v1/checkout/sessions', data=data, auth=(self.secret, ''), timeout=10)
        resp.raise_for_status()
        sess = resp.json()
        return {'session_id': sess['id'], 'checkout_url': sess['url']}

    def handle_webhook(self, payload: Dict[str, Any]) -> None:
        event_type = payload.get('type')
        data = payload.get('data', {}).get('object', {})
        if event_type != 'checkout.session.completed':
            return
        metadata = data.get('metadata', {})
        user_id = uuid.UUID(metadata['user_id'])
        item_type = metadata['item_type']
        item_key = metadata['item_key']
        price_cents = int(data['amount_total'])
        currency = data['currency'].upper()
        with SessionLocal() as db:
            if item_type == 'subscription':
                tier = db.execute(sa.text("SELECT id, features_json FROM billing.tiers WHERE key=:k"), {'k': item_key}).first()
                if not tier:
                    return
                now = datetime.utcnow()
                db.execute(sa.text("INSERT INTO billing.invoices(user_id,tier_id,amount_cents,currency,created_at,paid_at,provider,provider_ref) VALUES (:u,:t,:a,:c,:now,:now,'stripe',:ref)"),
                           {'u': str(user_id), 't': tier.id, 'a': price_cents, 'c': currency, 'now': now, 'ref': data['id']})
                db.execute(sa.text("INSERT INTO billing.subscriptions(user_id,tier_id,status,started_at) VALUES (:u,:t,'active',:now)"),
                           {'u': str(user_id), 't': tier.id, 'now': now})
                features = tier.features_json.get('flags', [])
                cache = user_flag_cache.setdefault(user_id, {})
                for f in features:
                    cache[f] = True
            elif item_type == 'palette':
                db.execute(sa.text("INSERT INTO content.palette_purchases(user_id,palette_key,price_cents) VALUES (:u,:k,:p)"),
                           {'u': str(user_id), 'k': item_key, 'p': price_cents})
            db.commit()
