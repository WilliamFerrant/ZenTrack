"""Base model with common fields."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer

from app.db.database import Base


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )