"""TimeEntry schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.base import TimestampSchema


class TimeEntryBase(BaseModel):
    """Base time entry schema."""

    description: Optional[str] = None
    is_billable: bool = True
    hourly_rate: Optional[float] = None


class TimeEntryCreate(TimeEntryBase):
    """Schema for creating a time entry."""

    start_time: datetime
    end_time: datetime
    project_id: int
    task_id: Optional[int] = None


class TimeEntryUpdate(BaseModel):
    """Schema for updating a time entry."""

    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_billable: Optional[bool] = None
    hourly_rate: Optional[float] = None


class TimeEntry(TimeEntryBase, TimestampSchema):
    """Schema for time entry response."""

    start_time: datetime
    end_time: datetime
    duration: int  # duration in seconds
    duration_hours: float
    duration_formatted: str  # HH:MM:SS format
    user_id: int
    project_id: int
    task_id: Optional[int] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class TimeEntryListResponse(BaseModel):
    """Schema for time entry list response."""

    entries: list[TimeEntry]
    total_duration: int  # total duration in seconds
    total_hours: float  # total duration in hours

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class DailyTimeAggregation(BaseModel):
    """Schema for daily time aggregation."""

    date: str  # YYYY-MM-DD format
    total_duration: int  # total duration in seconds
    total_hours: float  # total duration in hours
    entries_count: int  # number of entries


class ProjectTimeAggregation(BaseModel):
    """Schema for project time aggregation."""

    project_id: int
    project_name: str
    total_duration: int  # total duration in seconds
    total_hours: float  # total duration in hours
    entries_count: int  # number of entries


class DashboardTimeAggregation(BaseModel):
    """Schema for dashboard time aggregation response."""

    period_start: str  # YYYY-MM-DD format
    period_end: str  # YYYY-MM-DD format
    daily_totals: list[DailyTimeAggregation]
    project_totals: list[ProjectTimeAggregation]
    total_duration: int  # total duration in seconds for entire period
    total_hours: float  # total duration in hours for entire period
