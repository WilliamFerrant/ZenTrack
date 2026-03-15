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
    is_paused = Column(Boolean, default=False)
    paused_at = Column(DateTime, nullable=True)       # when current pause started
    paused_duration = Column(Integer, default=0)      # cumulative paused seconds

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
        """Get current active duration in seconds (excludes paused time)."""
        total = int((datetime.utcnow() - self.start_time).total_seconds())
        paused = self.paused_duration or 0
        if self.is_paused and self.paused_at:
            paused += int((datetime.utcnow() - self.paused_at).total_seconds())
        return max(0, total - paused)

    def pause(self) -> None:
        """Pause the timer."""
        if self.is_running and not self.is_paused:
            self.is_paused = True
            self.paused_at = datetime.utcnow()

    def resume(self) -> None:
        """Resume a paused timer."""
        if self.is_paused and self.paused_at:
            self.paused_duration = (self.paused_duration or 0) + int(
                (datetime.utcnow() - self.paused_at).total_seconds()
            )
            self.is_paused = False
            self.paused_at = None

    def stop(self) -> int:
        """Stop the timer and return active duration in seconds."""
        if self.is_paused:
            self.resume()
        duration = self.current_duration
        self.is_running = False
        return duration

    def __repr__(self) -> str:
        """String representation."""
        status = "running" if self.is_running else "stopped"
        return f"<Timer(id={self.id}, user_id={self.user_id}, project_id={self.project_id}, {status})>"