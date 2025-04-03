"""merging two heads

Revision ID: 2da5867559e2
Revises: 29cafea606b9, b95a8d6f6a24
Create Date: 2025-04-03 22:35:38.130635

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2da5867559e2'
down_revision: Union[str, None] = ('29cafea606b9', 'b95a8d6f6a24')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
