"""Client model."""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class Client(Base, TimestampMixin):
    """Client model — companies/people projects are billed to."""

    __tablename__ = "clients"

    name = Column(String(200), nullable=False)
    email = Column(String(254), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    # Foreign keys
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="clients")
    projects = relationship("Project", back_populates="client")

    def __repr__(self) -> str:
        return f"<Client(id={self.id}, name='{self.name}')>"
