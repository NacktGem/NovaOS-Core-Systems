import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any


class PaymentProvider(ABC):
    @abstractmethod
    def create_checkout(self, user_id: uuid.UUID, item_type: str, item_key: str, price_cents: int, currency: str) -> Dict[str, Any]:
        """Return provider-specific checkout payload"""

    @abstractmethod
    def handle_webhook(self, payload: Dict[str, Any]) -> None:
        """Process provider webhook"""
