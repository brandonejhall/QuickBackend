"""Add document_type column to files table

Revision ID: ccbd76a82534
Revises: 
Create Date: 2024-12-07 17:29:59.450848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ccbd76a82534'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('files', sa.Column('document_type', sa.String(), nullable=False))
    op.drop_column('files', 'filepath')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('files', sa.Column('filepath', sa.VARCHAR(), autoincrement=False, nullable=False))
    op.drop_column('files', 'document_type')
    # ### end Alembic commands ###
