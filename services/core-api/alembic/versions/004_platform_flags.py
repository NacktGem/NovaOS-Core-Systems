"""platform flags table"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision = "004_platform_flags"
down_revision = "003_agents_registry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "platform_flags",
        sa.Column("name", sa.String(), primary_key=True),
        sa.Column("value", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), onupdate=sa.text("now()")),
        sa.Column("updated_by", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
    )

    flags = table(
        "platform_flags",
        column("name", sa.String()),
        column("value", sa.Boolean()),
    )
    op.bulk_insert(
        flags,
        [
            {"name": "admin_calm_mode", "value": True},
            {"name": "nsfw_enabled", "value": False},
            {"name": "consent_lockdown", "value": False},
        ],
    )


def downgrade() -> None:
    op.drop_table("platform_flags")
