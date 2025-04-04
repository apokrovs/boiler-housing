"""merging multiple heads

Revision ID: ed4135e22b9a
Revises: 2da5867559e2, c5614be91309
Create Date: 2025-04-03 23:31:20.482910

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed4135e22b9a'
down_revision: Union[str, None] = ('2da5867559e2', 'c5614be91309')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
