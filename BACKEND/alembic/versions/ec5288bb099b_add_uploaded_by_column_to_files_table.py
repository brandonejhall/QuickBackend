"""add uploaded_by column to files table

Revision ID: ec5288bb099b
Revises: 8637c94e7ac5
Create Date: 2025-04-07 00:41:58.950968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec5288bb099b'
down_revision: Union[str, None] = '8637c94e7ac5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update existing records with a default value
    op.execute("UPDATE files SET uploaded_by = 'system' WHERE uploaded_by IS NULL")
    
    # Make the column non-nullable
    op.alter_column('files', 'uploaded_by',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)


def downgrade() -> None:
    # Make the column nullable
    op.alter_column('files', 'uploaded_by',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
