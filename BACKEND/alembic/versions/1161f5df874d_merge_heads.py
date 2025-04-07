"""merge heads

Revision ID: 1161f5df874d
Revises: 4072a7f0f43c, add_uploaded_by_to_files
Create Date: 2025-04-07 00:33:14.308830

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1161f5df874d'
down_revision: Union[str, None] = ('4072a7f0f43c', 'add_uploaded_by_to_files')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
