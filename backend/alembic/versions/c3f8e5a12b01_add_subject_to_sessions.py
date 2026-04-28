"""add_subject_to_sessions

Revision ID: c3f8e5a12b01
Revises: ba40d3717b87
Create Date: 2026-04-25 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c3f8e5a12b01'
down_revision: Union[str, None] = 'ba40d3717b87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sessions', sa.Column('subject_id', sa.Uuid(), nullable=True))
    op.add_column('sessions', sa.Column('education_level_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_sessions_subject_id', 'sessions', 'subjects',
        ['subject_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_sessions_education_level_id', 'sessions', 'education_levels',
        ['education_level_id'], ['id'], ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_sessions_education_level_id', 'sessions', type_='foreignkey')
    op.drop_constraint('fk_sessions_subject_id', 'sessions', type_='foreignkey')
    op.drop_column('sessions', 'education_level_id')
    op.drop_column('sessions', 'subject_id')
