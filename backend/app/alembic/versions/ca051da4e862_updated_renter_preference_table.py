"""Updated renter preference table

Revision ID: ca051da4e862
Revises: 2ef6baff6e7e
Create Date: 2025-02-27 14:06:28.632943

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca051da4e862'
down_revision: Union[str, None] = '2ef6baff6e7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('renterpreference', 'user_id')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('renterpreference', sa.Column('user_id', sa.UUID(), autoincrement=False, nullable=False))
    # ### end Alembic commands ###
