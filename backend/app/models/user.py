"""User model."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User roles enum."""

    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class User(Base, TimestampMixin):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    timezone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.MEMBER)
    hourly_rate = Column(Numeric(10, 2), nullable=True)

    # Foreign keys
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    org_memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", back_populates="assignee")
    timers = relationship("Timer", back_populates="user", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="user", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"

    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role == UserRole.ADMIN or self.is_superuser

    def can_manage_organization(self) -> bool:
        """Check if user can manage organization."""
        return self.role in (UserRole.ADMIN, UserRole.MANAGER) or self.is_superuser