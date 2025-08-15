"""roles tiers palettes schema and seeds

Revision ID: 20240816_000001
Revises: 
Create Date: 2024-08-16 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20240816_000001"
down_revision = None
branch_labels = None
depends_on = None

ROLE_VALUES = (
    'godmode','super_admin_jules','super_admin_nova','admin_agent','advisor','moderator','creator_standard','creator_sovereign','user_verified','guest'
)
STATUS_VALUES = ('active','suspended')
PAYOUT_VALUES = ('monthly','weekly','none')
SUB_STATUS_VALUES = ('active','canceled','past_due')
SCOPE_VALUES = ('global','admin','creator','user')


def upgrade() -> None:
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS auth'))
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS roles'))
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS billing'))
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS content'))
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS toggles'))
    op.execute(sa.text('CREATE SCHEMA IF NOT EXISTS analytics'))
    op.execute(sa.text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.Text(), nullable=False),
        sa.Column('username', sa.Text(), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('role', sa.Text(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('dob', sa.Date()),
        sa.UniqueConstraint('email', name='uq_users_email'),
        sa.UniqueConstraint('username', name='uq_users_username'),
        sa.CheckConstraint("role IN (" + ",".join(f"'{r}'" for r in ROLE_VALUES) + ")", name='ck_users_role'),
        sa.CheckConstraint("status IN ('active','suspended')", name='ck_users_status'),
        schema='auth'
    )

    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('key', sa.Text, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        schema='roles'
    )

    op.create_table(
        'user_permissions',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('perm_key', sa.Text, nullable=False),
        sa.Column('value', sa.Boolean, nullable=False),
        sa.UniqueConstraint('user_id','perm_key', name='uq_user_permissions'),
        schema='roles'
    )

    op.create_table(
        'tiers',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('key', sa.Text, nullable=False, unique=True),
        sa.Column('name', sa.Text, nullable=False),
        sa.Column('price_cents', sa.Integer, nullable=False),
        sa.Column('platform_cut_bps', sa.Integer, nullable=False),
        sa.Column('payout_frequency', sa.Text, nullable=False),
        sa.Column('features_json', postgresql.JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.CheckConstraint("payout_frequency IN ('monthly','weekly','none')", name='ck_tiers_payout_frequency'),
        schema='billing'
    )

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier_id', sa.Integer, sa.ForeignKey('billing.tiers.id'), nullable=False),
        sa.Column('status', sa.Text, nullable=False),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('renews_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('canceled_at', sa.TIMESTAMP(timezone=True)),
        sa.CheckConstraint("status IN ('active','canceled','past_due')", name='ck_subscriptions_status'),
        schema='billing'
    )

    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier_id', sa.Integer, sa.ForeignKey('billing.tiers.id'), nullable=False),
        sa.Column('amount_cents', sa.Integer, nullable=False),
        sa.Column('currency', sa.Text, nullable=False, server_default='USD'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('paid_at', sa.TIMESTAMP(timezone=True)),
        sa.Column('provider', sa.Text),
        sa.Column('provider_ref', sa.Text),
        schema='billing'
    )

    op.create_table(
        'palettes',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('key', sa.Text, nullable=False),
        sa.Column('name', sa.Text, nullable=False),
        sa.Column('price_cents', sa.Integer, nullable=False),
        sa.Column('is_free', sa.Boolean, server_default=sa.text('false'), nullable=False),
        sa.UniqueConstraint('key', name='uq_palettes_key'),
        schema='content'
    )

    op.create_table(
        'palette_purchases',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('palette_key', sa.Text, nullable=False),
        sa.Column('price_cents', sa.Integer, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('user_id','palette_key', name='uq_palette_purchases'),
        schema='content'
    )

    op.create_table(
        'posts',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('visibility', sa.Text, nullable=False),
        sa.Column('price_cents', sa.Integer, server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        schema='content'
    )

    op.create_table(
        'media_assets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auth.users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('visibility', sa.Text, nullable=False),
        sa.Column('price_cents', sa.Integer, server_default='0', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        schema='content'
    )

    op.create_table(
        'feature_flags',
        sa.Column('key', sa.Text, primary_key=True),
        sa.Column('enabled', sa.Boolean, nullable=False),
        sa.Column('scope', sa.Text, nullable=False),
        sa.CheckConstraint("scope IN ('global','admin','creator','user')", name='ck_feature_flags_scope'),
        schema='toggles'
    )

    tiers_table = sa.table(
        'tiers',
        sa.column('key', sa.Text),
        sa.column('name', sa.Text),
        sa.column('price_cents', sa.Integer),
        sa.column('platform_cut_bps', sa.Integer),
        sa.column('payout_frequency', sa.Text),
        sa.column('features_json', postgresql.JSONB),
        schema='billing'
    )
    op.bulk_insert(
        tiers_table,
        [
            {"key": "sovereign_standard", "name": "Sovereign Standard", "price_cents": 3900, "platform_cut_bps": 800, "payout_frequency": "monthly", "features_json": {}},
            {"key": "sovereign_premium", "name": "Sovereign Premium", "price_cents": 4900, "platform_cut_bps": 800, "payout_frequency": "weekly", "features_json": {}},
        ],
    )

    palettes_table = sa.table(
        'palettes',
        sa.column('key', sa.Text),
        sa.column('name', sa.Text),
        sa.column('price_cents', sa.Integer),
        sa.column('is_free', sa.Boolean),
        schema='content'
    )
    op.bulk_insert(
        palettes_table,
        [
            {"key": "light", "name": "Light", "price_cents": 0, "is_free": True},
            {"key": "dark", "name": "Dark", "price_cents": 0, "is_free": True},
            {"key": "midnight_rose", "name": "Midnight Rose", "price_cents": 300, "is_free": False},
            {"key": "obsidian_teal", "name": "Obsidian Teal", "price_cents": 300, "is_free": False},
            {"key": "velvet_amber", "name": "Velvet Amber", "price_cents": 300, "is_free": False},
        ],
    )

    flags_table = sa.table(
        'feature_flags',
        sa.column('key', sa.Text),
        sa.column('enabled', sa.Boolean),
        sa.column('scope', sa.Text),
        schema='toggles'
    )
    op.bulk_insert(
        flags_table,
        [
            {"key": "sovereign.analytics.pro", "enabled": False, "scope": "global"},
            {"key": "sovereign.concierge", "enabled": False, "scope": "global"},
            {"key": "sovereign.themes.all", "enabled": False, "scope": "global"},
            {"key": "sovereign.leakguard.plus", "enabled": False, "scope": "global"},
            {"key": "sovereign.priority_queue", "enabled": False, "scope": "global"},
            {"key": "sovereign.early_access", "enabled": False, "scope": "global"},
            {"key": "payments.stripe.enabled", "enabled": False, "scope": "global"},
            {"key": "payments.crypto.enabled", "enabled": False, "scope": "global"},
        ],
    )


def downgrade() -> None:
    op.drop_table('feature_flags', schema='toggles')
    op.drop_table('media_assets', schema='content')
    op.drop_table('posts', schema='content')
    op.drop_table('palette_purchases', schema='content')
    op.drop_table('palettes', schema='content')
    op.drop_table('invoices', schema='billing')
    op.drop_table('subscriptions', schema='billing')
    op.drop_table('tiers', schema='billing')
    op.drop_table('user_permissions', schema='roles')
    op.drop_table('permissions', schema='roles')
    op.drop_table('users', schema='auth')
    op.execute(sa.text('DROP SCHEMA IF EXISTS toggles CASCADE'))
    op.execute(sa.text('DROP SCHEMA IF EXISTS content CASCADE'))
    op.execute(sa.text('DROP SCHEMA IF EXISTS billing CASCADE'))
    op.execute(sa.text('DROP SCHEMA IF EXISTS roles CASCADE'))
    op.execute(sa.text('DROP SCHEMA IF EXISTS auth CASCADE'))
    op.execute(sa.text('DROP SCHEMA IF EXISTS analytics CASCADE'))
