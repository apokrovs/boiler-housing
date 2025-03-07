"""Merging multiple heads

Revision ID: 73f0473cb4af
Revises: 34565e904379, fd69a55b31ac
Create Date: 2025-03-07 01:36:43.579767

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73f0473cb4af'
down_revision: Union[str, None] = ('34565e904379', 'fd69a55b31ac')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
