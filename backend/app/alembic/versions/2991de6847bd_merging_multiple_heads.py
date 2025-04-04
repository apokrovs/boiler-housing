"""Merging multiple heads

Revision ID: 2991de6847bd
Revises: 19f858e95032, 5e308677e7f0
Create Date: 2025-04-04 00:04:01.559873

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2991de6847bd'
down_revision: Union[str, None] = ('19f858e95032', '5e308677e7f0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
