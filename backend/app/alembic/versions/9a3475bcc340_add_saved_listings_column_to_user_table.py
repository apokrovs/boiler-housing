"""Add saved_listings column to user table

Revision ID: 9a3475bcc340
Revises: 073b219904c9
Create Date: 2025-04-01 01:13:34.633697

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a3475bcc340'
down_revision: Union[str, None] = '073b219904c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('saved_listings', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('user', 'saved_listings')
    # ### end Alembic commands ###
