"""Renamed filetype to ImageFileType

Revision ID: b1be86446a3e
Revises: 66e7fab59f8a
Create Date: 2025-04-03 20:47:05.863529

"""
from typing import Sequence, Union
import sqlmodel.sql.sqltypes
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b1be86446a3e'
down_revision: Union[str, None] = '66e7fab59f8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the new enum type
    op.execute("CREATE TYPE imagefiletype AS ENUM ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')")

    # Convert data from old enum to new enum format
    op.execute("ALTER TABLE image ALTER COLUMN file_type TYPE varchar USING file_type::varchar")

    # Update to new enum type
    op.execute("ALTER TABLE image ALTER COLUMN file_type TYPE imagefiletype USING file_type::text::imagefiletype")

    # Drop the old enum type that is no longer in use
    op.execute("DROP TYPE filetype")


def downgrade() -> None:
    # Create the old enum type again
    op.execute("CREATE TYPE filetype AS ENUM ('JPEG', 'JPG', 'PNG', 'WEBP', 'GIF')")

    # Convert back to varchar temporarily
    op.execute("ALTER TABLE image ALTER COLUMN file_type TYPE varchar USING file_type::varchar")

    # Convert to the original enum type
    op.execute("ALTER TABLE image ALTER COLUMN file_type TYPE filetype USING file_type::text::filetype")

    # Drop the new enum type
    op.execute("DROP TYPE imagefiletype")
