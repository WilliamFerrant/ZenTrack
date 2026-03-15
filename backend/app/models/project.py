"""Project model."""

import enum
from datetime import date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ProjectStatus(str, enum.Enum):
    """Project status enum."""

    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class Project(Base, TimestampMixin):
    """Project model for time tracking organization."""

    __tablename__ = "projects"

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code
    is_active = Column(Boolean, default=True)
    is_billable = Column(Boolean, default=True)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.ACTIVE)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    budget_hours = Column(Integer, nullable=True)
    budget_amount = Column(Numeric(12, 2), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)

    # Foreign keys
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    client = relationship("Client", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="project", cascade="all, delete-orphan")
    timers = relationship("Timer", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"