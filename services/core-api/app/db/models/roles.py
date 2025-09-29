import sqlalchemy as sa

from ..base import Base


class Role(Base):
    __tablename__ = "roles"

    name = sa.Column(sa.String, primary_key=True)
    description = sa.Column(sa.Text)
