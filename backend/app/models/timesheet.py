"""Timesheet model — weekly submission / approval workflow."""

import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class TimesheetStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Timesheet(Base, TimestampMixin):
    """Weekly timesheet submitted by a user for manager approval."""

    __tablename__ = "timesheets"

    # The ISO week start date (Monday), stored as date string YYYY-MM-DD
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)

    status = Column(Enum(TimesheetStatus), default=TimesheetStatus.DRAFT, nullable=False)
    notes = Column(Text, nullable=True)          # submitter's note
    reviewer_notes = Column(Text, nullable=True) # reviewer's feedback

    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # FK
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relations
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    organization = relationship("Organization")

    def submit(self):
        self.status = TimesheetStatus.SUBMITTED
        self.submitted_at = datetime.utcnow()

    def approve(self, reviewer_id: int, notes: str = None):
        self.status = TimesheetStatus.APPROVED
        self.reviewer_id = reviewer_id
        self.reviewer_notes = notes
        self.reviewed_at = datetime.utcnow()

    def reject(self, reviewer_id: int, notes: str = None):
        self.status = TimesheetStatus.REJECTED
        self.reviewer_id = reviewer_id
        self.reviewer_notes = notes
        self.reviewed_at = datetime.utcnow()
