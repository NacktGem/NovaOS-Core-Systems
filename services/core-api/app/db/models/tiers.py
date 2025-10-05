import sqlalchemy as sa

from ..base import Base


class Tier(Base):
    __tablename__ = "tiers"

    name = sa.Column(sa.String, primary_key=True)
    description = sa.Column(sa.Text)
    monthly_price_cents = sa.Column(sa.Integer, nullable=False, default=0)
