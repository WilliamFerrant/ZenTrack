"""TimeEntry model."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class TimeEntry(Base, TimestampMixin):
    """TimeEntry model for completed time tracking records."""

    __tablename__ = "time_entries"

    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)  # Duration in seconds
    is_billable = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="time_entries")
    project = relationship("Project", back_populates="time_entries")
    task = relationship("Task", back_populates="time_entries")

    # Constraints
    __table_args__ = (
        CheckConstraint("duration > 0", name="ck_time_entry_positive_duration"),
        CheckConstraint("end_time > start_time", name="ck_time_entry_valid_duration"),
    )

    @classmethod
    def from_timer(cls, timer, end_time: datetime = None, description: str = None):
        """Create a TimeEntry from a Timer."""
        if end_time is None:
            end_time = datetime.utcnow()

        duration = int((end_time - timer.start_time).total_seconds())

        return cls(
            description=description or timer.description,
            start_time=timer.start_time,
            end_time=end_time,
            duration=duration,
            user_id=timer.user_id,
            project_id=timer.project_id,
            task_id=timer.task_id,
        )

    @property
    def duration_hours(self) -> float:
        """Get duration in hours."""
        return round(self.duration / 3600, 2)

    @property
    def duration_formatted(self) -> str:
        """Get formatted duration (HH:MM:SS)."""
        hours = self.duration // 3600
        minutes = (self.duration % 3600) // 60
        seconds = self.duration % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def __repr__(self) -> str:
        """String representation."""
        return f"<TimeEntry(id={self.id}, user_id={self.user_id}, project_id={self.project_id}, duration={self.duration_formatted})>"