"""Initial migration

Revision ID: 001
Revises:
Create Date: 2026-03-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create organizations table
    op.create_table('organizations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('website', sa.String(length=300), nullable=True),
    sa.Column('logo_url', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('billing_email', sa.String(length=255), nullable=True),
    sa.Column('max_users', sa.Integer(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )
    op.create_index('idx_org_name', 'organizations', ['name'], unique=False)
    op.create_index('idx_org_slug_active', 'organizations', ['slug', 'is_active'], unique=False)
    op.create_index(op.f('ix_organizations_id'), 'organizations', ['id'], unique=False)

    # Create clients table
    op.create_table('clients',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=True),
    sa.Column('phone', sa.String(length=50), nullable=True),
    sa.Column('website', sa.String(length=300), nullable=True),
    sa.Column('address_line1', sa.String(length=300), nullable=True),
    sa.Column('address_line2', sa.String(length=300), nullable=True),
    sa.Column('city', sa.String(length=100), nullable=True),
    sa.Column('state', sa.String(length=100), nullable=True),
    sa.Column('postal_code', sa.String(length=20), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('company_registration', sa.String(length=100), nullable=True),
    sa.Column('tax_id', sa.String(length=100), nullable=True),
    sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('currency', sa.String(length=3), nullable=True),
    sa.Column('payment_terms', sa.String(length=100), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name', 'organization_id', name='uq_client_name_org')
    )
    op.create_index('idx_client_email', 'clients', ['email'], unique=False)
    op.create_index('idx_client_name_org', 'clients', ['name', 'organization_id'], unique=False)
    op.create_index('idx_client_org_active', 'clients', ['organization_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_clients_email'), 'clients', ['email'], unique=False)
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=False)

    # Create users table
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('first_name', sa.String(length=100), nullable=False),
    sa.Column('last_name', sa.String(length=100), nullable=False),
    sa.Column('hashed_password', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_superuser', sa.Boolean(), nullable=True),
    sa.Column('avatar_url', sa.String(length=500), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('timezone', sa.String(length=50), nullable=True),
    sa.Column('role', sa.Enum('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', name='userrole'), nullable=True),
    sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index('idx_user_name_search', 'users', ['first_name', 'last_name'], unique=False)
    op.create_index('idx_user_organization_active', 'users', ['organization_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create tags table
    op.create_table('tags',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('color', sa.String(length=7), nullable=True),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name', 'organization_id', name='uq_tag_name_org')
    )
    op.create_index('idx_tag_name_org', 'tags', ['name', 'organization_id'], unique=False)
    op.create_index('idx_tag_org_active', 'tags', ['organization_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=False)

    # Create projects table
    op.create_table('projects',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('color', sa.String(length=7), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('is_billable', sa.Boolean(), nullable=True),
    sa.Column('status', sa.Enum('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED', name='projectstatus'), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('deadline', sa.Date(), nullable=True),
    sa.Column('budget_hours', sa.Integer(), nullable=True),
    sa.Column('budget_amount', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.Column('client_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name', 'organization_id', name='uq_project_name_org')
    )
    op.create_index('idx_project_client', 'projects', ['client_id'], unique=False)
    op.create_index('idx_project_name_org', 'projects', ['name', 'organization_id'], unique=False)
    op.create_index('idx_project_org_active', 'projects', ['organization_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)

    # Create tasks table
    op.create_table('tasks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('name', sa.String(length=300), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', name='taskstatus'), nullable=True),
    sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='taskpriority'), nullable=True),
    sa.Column('is_billable', sa.Boolean(), nullable=True),
    sa.Column('estimated_hours', sa.Integer(), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('completed_date', sa.Date(), nullable=True),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('assignee_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_task_assignee_status', 'tasks', ['assignee_id', 'status'], unique=False)
    op.create_index('idx_task_billable', 'tasks', ['is_billable'], unique=False)
    op.create_index('idx_task_priority', 'tasks', ['priority'], unique=False)
    op.create_index('idx_task_project_status', 'tasks', ['project_id', 'status'], unique=False)
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)

    # Create time_entries table
    op.create_table('time_entries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('end_time', sa.DateTime(), nullable=False),
    sa.Column('duration', sa.Integer(), nullable=False),
    sa.Column('is_billable', sa.Boolean(), nullable=True),
    sa.Column('hourly_rate', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=True),
    sa.CheckConstraint('duration > 0', name='ck_time_entry_positive_duration'),
    sa.CheckConstraint('end_time > start_time', name='ck_time_entry_valid_duration'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_time_entry_billable', 'time_entries', ['is_billable'], unique=False)
    op.create_index('idx_time_entry_date_range', 'time_entries', ['start_time', 'end_time'], unique=False)
    op.create_index('idx_time_entry_project_date', 'time_entries', ['project_id', 'start_time'], unique=False)
    op.create_index('idx_time_entry_task', 'time_entries', ['task_id'], unique=False)
    op.create_index('idx_time_entry_user_date', 'time_entries', ['user_id', 'start_time'], unique=False)
    op.create_index(op.f('ix_time_entries_id'), 'time_entries', ['id'], unique=False)

    # Create timers table
    op.create_table('timers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('start_time', sa.DateTime(), nullable=False),
    sa.Column('is_running', sa.Boolean(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_timer_project_running', 'timers', ['project_id', 'is_running'], unique=False)
    op.create_index('idx_timer_start_time', 'timers', ['start_time'], unique=False)
    op.create_index('idx_timer_task', 'timers', ['task_id'], unique=False)
    op.create_index('idx_timer_user_running', 'timers', ['user_id', 'is_running'], unique=False)
    op.create_index(op.f('ix_timers_id'), 'timers', ['id'], unique=False)

    # Create association tables
    op.create_table('project_assignments',
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )

    op.create_table('project_tags',
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
    sa.PrimaryKeyConstraint('project_id', 'tag_id')
    )

    op.create_table('task_tags',
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
    sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ),
    sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    op.create_table('time_entry_tags',
    sa.Column('time_entry_id', sa.Integer(), nullable=False),
    sa.Column('tag_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
    sa.ForeignKeyConstraint(['time_entry_id'], ['time_entries.id'], ),
    sa.PrimaryKeyConstraint('time_entry_id', 'tag_id')
    )


def downgrade() -> None:
    # Drop association tables first
    op.drop_table('time_entry_tags')
    op.drop_table('task_tags')
    op.drop_table('project_tags')
    op.drop_table('project_assignments')

    # Drop tables in reverse order
    op.drop_index(op.f('ix_timers_id'), table_name='timers')
    op.drop_index('idx_timer_user_running', table_name='timers')
    op.drop_index('idx_timer_task', table_name='timers')
    op.drop_index('idx_timer_start_time', table_name='timers')
    op.drop_index('idx_timer_project_running', table_name='timers')
    op.drop_table('timers')

    op.drop_index(op.f('ix_time_entries_id'), table_name='time_entries')
    op.drop_index('idx_time_entry_user_date', table_name='time_entries')
    op.drop_index('idx_time_entry_task', table_name='time_entries')
    op.drop_index('idx_time_entry_project_date', table_name='time_entries')
    op.drop_index('idx_time_entry_date_range', table_name='time_entries')
    op.drop_index('idx_time_entry_billable', table_name='time_entries')
    op.drop_table('time_entries')

    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_index('idx_task_project_status', table_name='tasks')
    op.drop_index('idx_task_priority', table_name='tasks')
    op.drop_index('idx_task_billable', table_name='tasks')
    op.drop_index('idx_task_assignee_status', table_name='tasks')
    op.drop_table('tasks')

    op.drop_index(op.f('ix_projects_id'), table_name='projects')
    op.drop_index('idx_project_org_active', table_name='projects')
    op.drop_index('idx_project_name_org', table_name='projects')
    op.drop_index('idx_project_client', table_name='projects')
    op.drop_table('projects')

    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_index('idx_tag_org_active', table_name='tags')
    op.drop_index('idx_tag_name_org', table_name='tags')
    op.drop_table('tags')

    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index('idx_user_organization_active', table_name='users')
    op.drop_index('idx_user_name_search', table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_index(op.f('ix_clients_id'), table_name='clients')
    op.drop_index(op.f('ix_clients_email'), table_name='clients')
    op.drop_index('idx_client_org_active', table_name='clients')
    op.drop_index('idx_client_name_org', table_name='clients')
    op.drop_index('idx_client_email', table_name='clients')
    op.drop_table('clients')

    op.drop_index(op.f('ix_organizations_id'), table_name='organizations')
    op.drop_index('idx_org_slug_active', table_name='organizations')
    op.drop_index('idx_org_name', table_name='organizations')
    op.drop_table('organizations')