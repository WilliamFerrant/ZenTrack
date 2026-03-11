"""Task schemas."""

from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.task import TaskStatus, TaskPriority
from app.schemas.base import TimestampSchema


class TaskBase(BaseModel):
    """Base task schema."""

    name: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    is_billable: bool = True
    estimated_hours: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None


class TaskCreate(TaskBase):
    """Schema for creating a task."""

    project_id: int
    assignee_id: Optional[int] = None


class TaskUpdate(BaseModel):
    """Schema for updating a task."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    is_billable: Optional[bool] = None
    estimated_hours: Optional[int] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    completed_date: Optional[date] = None
    assignee_id: Optional[int] = None


class Task(TaskBase, TimestampSchema):
    """Schema for task response."""

    project_id: int
    assignee_id: Optional[int] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True
