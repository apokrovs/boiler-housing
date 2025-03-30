"""merging multiple heads

Revision ID: 7af302b9af4e
Revises: 34565e904379, fd69a55b31ac
Create Date: 2025-03-07 03:01:32.213383

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7af302b9af4e'
down_revision: Union[str, None] = ('34565e904379', 'fd69a55b31ac')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
