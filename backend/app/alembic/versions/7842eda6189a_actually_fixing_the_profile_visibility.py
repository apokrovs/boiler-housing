"""Actually fixing the profile_visibility

Revision ID: 7842eda6189a
Revises: b2366c127cab
Create Date: 2025-03-02 20:33:40.974308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7842eda6189a'
down_revision: Union[str, None] = 'b2366c127cab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    pass
    # ### end Alembic commands ###
