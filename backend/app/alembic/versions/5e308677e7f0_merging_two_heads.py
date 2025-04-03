"""merging two heads

Revision ID: 5e308677e7f0
Revises: 23c4696d9900, ed4135e22b9a
Create Date: 2025-04-03 23:42:08.790608

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5e308677e7f0'
down_revision: Union[str, None] = ('23c4696d9900', 'ed4135e22b9a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
