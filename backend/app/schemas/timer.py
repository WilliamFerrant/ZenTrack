"""Timer schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.base import TimestampSchema


class TimerBase(BaseModel):
    """Base timer schema."""

    description: Optional[str] = None


class TimerCreate(TimerBase):
    """Schema for creating/starting a timer."""

    project_id: int
    task_id: Optional[int] = None


class TimerUpdate(BaseModel):
    """Schema for updating a timer."""

    description: Optional[str] = None
    is_running: Optional[bool] = None


class Timer(TimerBase, TimestampSchema):
    """Schema for timer response."""

    start_time: datetime
    is_running: bool
    user_id: int
    project_id: int
    task_id: Optional[int] = None
    current_duration: int  # duration in seconds

    class Config:
        """Pydantic configuration."""
        orm_mode = True


class TimerStop(BaseModel):
    """Schema for stopping a timer."""

    description: Optional[str] = None