"""Task model."""

import enum
from datetime import date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class TaskStatus(str, enum.Enum):
    """Task status enum."""

    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    CANCELLED = "CANCELLED"


class TaskPriority(str, enum.Enum):
    """Task priority enum."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Task(Base, TimestampMixin):
    """Task model for time tracking granular organization."""

    __tablename__ = "tasks"

    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    is_billable = Column(Boolean, default=True)
    estimated_hours = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)

    # Foreign keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
    time_entries = relationship("TimeEntry", back_populates="task", cascade="all, delete-orphan")
    timers = relationship("Timer", back_populates="task", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation."""
        return f"<Task(id={self.id}, name='{self.name}', status='{self.status}')>"