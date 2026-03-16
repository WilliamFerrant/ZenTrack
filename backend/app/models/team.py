"""Team model."""

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Team(Base, TimestampMixin):
    __tablename__ = "teams"

    name            = Column(String(100), nullable=False)
    description     = Column(Text, nullable=True)
    color           = Column(String(7), nullable=True, default="#3B82F6")
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    organization = relationship("Organization", back_populates="teams")
    memberships  = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
