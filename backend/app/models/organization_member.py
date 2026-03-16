"""OrganizationMember join table — links users to organizations with a per-org role."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import UserRole


class OrganizationMember(Base):
    """A user's membership in an organization, with their role in that org."""

    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("user_id", "organization_id", name="uq_org_member"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MEMBER)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="org_memberships")
    organization = relationship("Organization", back_populates="members")
