"""Merging multiple heads

Revision ID: 510c0f972c43
Revises: 727bd0825888, 73f0473cb4af
Create Date: 2025-03-07 04:51:00.756437

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '510c0f972c43'
down_revision: Union[str, None] = ('727bd0825888', '73f0473cb4af')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
