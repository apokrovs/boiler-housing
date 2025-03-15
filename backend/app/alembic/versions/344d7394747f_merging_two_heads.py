"""merging two heads

Revision ID: 344d7394747f
Revises: 510c0f972c43, 7af302b9af4e
Create Date: 2025-03-07 21:31:37.542780

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '344d7394747f'
down_revision: Union[str, None] = ('510c0f972c43', '7af302b9af4e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
