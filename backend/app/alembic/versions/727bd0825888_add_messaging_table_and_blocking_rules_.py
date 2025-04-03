"""Add messaging table and blocking rules to user

Revision ID: 727bd0825888
Revises: 9d2c7eb6f434
Create Date: 2025-03-07 00:41:27.135468

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '727bd0825888'
down_revision: Union[str, None] = '9d2c7eb6f434'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass