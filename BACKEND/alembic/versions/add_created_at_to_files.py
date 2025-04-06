"""add created_at to files

Revision ID: add_created_at_to_files
Revises: 
Create Date: 2024-04-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_created_at_to_files'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at column with default value
    op.add_column('files', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Update existing records with current timestamp
    op.execute("UPDATE files SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")


def downgrade():
    # Remove the created_at column
    op.drop_column('files', 'created_at') 