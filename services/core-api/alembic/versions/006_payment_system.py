"""Add payment system with Stripe integration

Revision ID: 006_payment_system
Revises: 005_audit_system
Create Date: 2024-12-28 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_payment_system'
down_revision = '005_audit_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create creator_stripe_accounts table
    op.create_table('creator_stripe_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('stripe_account_id', sa.String(length=255), nullable=False),
        sa.Column('country', sa.String(length=2), nullable=False),
        sa.Column('charges_enabled', sa.Boolean(), nullable=True, default=False),
        sa.Column('payouts_enabled', sa.Boolean(), nullable=True, default=False),
        sa.Column('details_submitted', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_creator_stripe_accounts_creator_id'), 'creator_stripe_accounts', ['creator_id'], unique=True)
    op.create_index(op.f('ix_creator_stripe_accounts_stripe_account_id'), 'creator_stripe_accounts', ['stripe_account_id'], unique=True)

    # Create payment_transactions table
    op.create_table('payment_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=False),
        sa.Column('purchaser_id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('creator_stripe_account_id', sa.Integer(), nullable=False),
        sa.Column('bundle_id', sa.String(length=255), nullable=True),
        sa.Column('content_id', sa.String(length=255), nullable=True),
        sa.Column('purchase_type', sa.String(length=50), nullable=False),
        sa.Column('base_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('stripe_fees', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('customer_total', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('creator_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['creator_stripe_account_id'], ['creator_stripe_accounts.id'], ),
        sa.ForeignKeyConstraint(['purchaser_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_transactions_stripe_payment_intent_id'), 'payment_transactions', ['stripe_payment_intent_id'], unique=True)
    op.create_index(op.f('ix_payment_transactions_purchaser_id'), 'payment_transactions', ['purchaser_id'])
    op.create_index(op.f('ix_payment_transactions_creator_id'), 'payment_transactions', ['creator_id'])

    # Create promo_codes table
    op.create_table('promo_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('min_purchase_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('current_uses', sa.Integer(), nullable=False, default=0),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_promo_codes_code'), 'promo_codes', ['code'], unique=True)
    op.create_index(op.f('ix_promo_codes_creator_id'), 'promo_codes', ['creator_id'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index(op.f('ix_promo_codes_creator_id'), table_name='promo_codes')
    op.drop_index(op.f('ix_promo_codes_code'), table_name='promo_codes')
    op.drop_table('promo_codes')

    op.drop_index(op.f('ix_payment_transactions_creator_id'), table_name='payment_transactions')
    op.drop_index(op.f('ix_payment_transactions_purchaser_id'), table_name='payment_transactions')
    op.drop_index(op.f('ix_payment_transactions_stripe_payment_intent_id'), table_name='payment_transactions')
    op.drop_table('payment_transactions')

    op.drop_index(op.f('ix_creator_stripe_accounts_stripe_account_id'), table_name='creator_stripe_accounts')
    op.drop_index(op.f('ix_creator_stripe_accounts_creator_id'), table_name='creator_stripe_accounts')
    op.drop_table('creator_stripe_accounts')
