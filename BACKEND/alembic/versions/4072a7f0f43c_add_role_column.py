"""add_role_column

Revision ID: 4072a7f0f43c
Revises: 540873b0742c
Create Date: 2025-04-06 13:14:32.323927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from alembic import op
import sqlalchemy as sa
from app.models.user import UserRole  # Import the enum



# revision identifiers, used by Alembic.
revision: str = '4072a7f0f43c'
down_revision: Union[str, None] = '540873b0742c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create the enum type first
    user_role_enum = sa.Enum(UserRole, name='userrole')
    user_role_enum.create(op.get_bind(), checkfirst=True)
    
    # Add the role column with default value
    op.add_column('users',
        sa.Column('role',
            sa.Enum(UserRole),
            nullable=False,
            server_default="USER"  # Changed from UserRole.USER.value to "USER"
        )
    )

def downgrade():
    op.drop_column('users', 'role')
    sa.Enum(name='userrole').drop(op.get_bind())
