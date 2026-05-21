"""seed bracelets category

Revision ID: d86c074fc045
Revises: 3683627542ed
Create Date: 2026-05-21 07:52:38.283715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd86c074fc045'
down_revision: Union[str, Sequence[str], None] = '3683627542ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(max(id), 1)) FROM categories;")
    op.execute("INSERT INTO categories (name) VALUES ('Bracelets');")
    pass


def downgrade() -> None:
    op.execute("DELETE FROM categories WHERE name = 'Bracelets';")
    pass
