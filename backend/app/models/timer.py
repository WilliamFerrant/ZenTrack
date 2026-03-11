"""Timer model."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Timer(Base, TimestampMixin):
    """Timer model for active time tracking sessions."""

    __tablename__ = "timers"

    description = Column(Text, nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_running = Column(Boolean, default=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="timers")
    project = relationship("Project", back_populates="timers")
    task = relationship("Task", back_populates="timers")

    @property
    def current_duration(self) -> int:
        """Get current duration in seconds."""
        if self.is_running:
            return int((datetime.utcnow() - self.start_time).total_seconds())
        return 0

    def stop(self) -> int:
        """Stop the timer and return duration in seconds."""
        if self.is_running:
            duration = int((datetime.utcnow() - self.start_time).total_seconds())
            self.is_running = False
            return duration
        return 0

    def __repr__(self) -> str:
        """String representation."""
        status = "running" if self.is_running else "stopped"
        return f"<Timer(id={self.id}, user_id={self.user_id}, project_id={self.project_id}, {status})>"