"""merge multiple heads

Revision ID: 073b219904c9
Revises: 0a55b92fc079, 29cafea606b9
Create Date: 2025-03-30 04:35:15.837080

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '073b219904c9'
down_revision: Union[str, None] = ('0a55b92fc079', '29cafea606b9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
