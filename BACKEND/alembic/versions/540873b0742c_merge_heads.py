"""merge heads

Revision ID: 540873b0742c
Revises: add_created_at_to_files, ccbd76a82534
Create Date: 2025-04-05 21:25:27.955162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '540873b0742c'
down_revision: Union[str, None] = ('add_created_at_to_files', 'ccbd76a82534')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
