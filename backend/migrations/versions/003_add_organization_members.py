"""Add organization_members join table for multi-org membership.

Revision ID: 003
Revises: 354492b1a5cb
Create Date: 2026-03-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "354492b1a5cb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            postgresql.ENUM("ADMIN", "MANAGER", "MEMBER", "VIEWER", name="userrole", create_type=False),
            nullable=False,
            server_default="MEMBER",
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("user_id", "organization_id", name="uq_org_member"),
    )
    op.create_index("idx_org_members_org", "organization_members", ["organization_id"])
    op.create_index("idx_org_members_user", "organization_members", ["user_id"])

    # Back-fill: create a membership row for every user already in an org
    op.execute("""
        INSERT INTO organization_members (user_id, organization_id, role, joined_at)
        SELECT id, organization_id, role, created_at
        FROM users
        WHERE organization_id IS NOT NULL
        ON CONFLICT (user_id, organization_id) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_index("idx_org_members_user", table_name="organization_members")
    op.drop_index("idx_org_members_org", table_name="organization_members")
    op.drop_table("organization_members")
