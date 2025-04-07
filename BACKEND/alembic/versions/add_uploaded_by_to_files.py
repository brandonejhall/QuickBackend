"""add uploaded_by to files

Revision ID: add_uploaded_by_to_files
Revises: 
Create Date: 2024-04-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_uploaded_by_to_files'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add uploaded_by column to files table
    op.add_column('files', sa.Column('uploaded_by', sa.String(), nullable=True))
    
    # Update existing records to have a default value
    op.execute("UPDATE files SET uploaded_by = 'system' WHERE uploaded_by IS NULL")


def downgrade() -> None:
    # Remove uploaded_by column from files table
    op.drop_column('files', 'uploaded_by') 