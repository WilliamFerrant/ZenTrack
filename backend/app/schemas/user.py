"""User schemas for API validation."""

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole
from app.schemas.base import TimestampSchema


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool = True
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    timezone: Optional[str] = None
    role: UserRole = UserRole.MEMBER
    hourly_rate: Optional[Decimal] = None


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str
    organization_id: Optional[int] = None


class UserResponse(UserBase, TimestampSchema):
    """Schema for user response."""

    organization_id: Optional[int] = None
    full_name: str

    class Config:
        """Pydantic configuration."""
        orm_mode = True


class User(UserResponse):
    """Complete user schema."""

    is_superuser: bool = False