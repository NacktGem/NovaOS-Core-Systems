"""enable crypto payments and tier features

Revision ID: 20240816_000002
Revises: 20240816_000001
Create Date: 2024-08-16 01:00:00
"""

from alembic import op
import sqlalchemy as sa
import json

revision = "20240816_000002"
down_revision = "20240816_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    standard = json.dumps({"flags": ["sovereign.themes.all", "sovereign.priority_queue", "sovereign.leakguard.plus"]})
    premium = json.dumps({
        "flags": [
            "sovereign.themes.all",
            "sovereign.priority_queue",
            "sovereign.leakguard.plus",
            "sovereign.analytics.pro",
            "sovereign.concierge",
            "sovereign.early_access",
        ]
    })
    op.execute(sa.text("UPDATE toggles.feature_flags SET enabled=true WHERE key='payments.crypto.enabled'"))
    op.execute(sa.text("UPDATE billing.tiers SET features_json = CAST(:v AS jsonb) WHERE key='sovereign_standard'").bindparams(v=standard))
    op.execute(sa.text("UPDATE billing.tiers SET features_json = CAST(:v AS jsonb) WHERE key='sovereign_premium'").bindparams(v=premium))


def downgrade() -> None:
    op.execute(sa.text("UPDATE toggles.feature_flags SET enabled=false WHERE key='payments.crypto.enabled'"))
    op.execute(sa.text("UPDATE billing.tiers SET features_json='{}' WHERE key in ('sovereign_standard','sovereign_premium')"))
