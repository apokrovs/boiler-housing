"""Merging multiple heads

Revision ID: c5614be91309
Revises: 29cafea606b9, b95a8d6f6a24
Create Date: 2025-03-30 06:21:43.416066

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c5614be91309'
down_revision: tuple = ('29cafea606b9', 'b95a8d6f6a24')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass


def downgrade() -> None:
    pass