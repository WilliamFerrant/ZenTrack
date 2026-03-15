"""Timesheet schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.timesheet import TimesheetStatus
from app.schemas.user import UserResponse


class TimesheetBase(BaseModel):
    week_start: datetime
    week_end: datetime
    notes: Optional[str] = None


class TimesheetCreate(TimesheetBase):
    pass


class TimesheetSubmit(BaseModel):
    notes: Optional[str] = None


class TimesheetReview(BaseModel):
    reviewer_notes: Optional[str] = None


class TimesheetResponse(TimesheetBase):
    id: int
    status: TimesheetStatus
    reviewer_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    user_id: int
    organization_id: int
    reviewer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    user: Optional[UserResponse] = None
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True
