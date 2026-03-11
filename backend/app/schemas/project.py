"""Project schemas."""

from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.project import ProjectStatus
from app.schemas.base import TimestampSchema


class ProjectBase(BaseModel):
    """Base project schema."""

    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    is_billable: bool = True
    status: ProjectStatus = ProjectStatus.ACTIVE
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    deadline: Optional[date] = None
    budget_hours: Optional[int] = None
    budget_amount: Optional[float] = None
    hourly_rate: Optional[float] = None


class ProjectCreate(ProjectBase):
    """Schema for creating a project."""

    organization_id: int
    client_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    is_billable: Optional[bool] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    deadline: Optional[date] = None
    budget_hours: Optional[int] = None
    budget_amount: Optional[float] = None
    hourly_rate: Optional[float] = None


class Project(ProjectBase, TimestampSchema):
    """Schema for project response."""

    organization_id: int
    client_id: Optional[int] = None

    class Config:
        """Pydantic configuration."""
        orm_mode = True