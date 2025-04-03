"""empty message

Revision ID: e1c8832e3dba
Revises: 2b86cf182ea1, 660ab45a966f
Create Date: 2025-04-03 18:57:47.088495

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1c8832e3dba'
down_revision: Union[str, None] = ('2b86cf182ea1', '660ab45a966f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
