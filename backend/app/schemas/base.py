"""Base schemas for common fields."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TimestampSchema(BaseModel):
    """Schema with timestamp fields."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic configuration."""
        from_attributes = True


class BaseResponse(BaseModel):
    """Base response schema."""

    success: bool = True
    message: Optional[str] = None

    class Config:
        """Pydantic configuration."""
        from_attributes = True
