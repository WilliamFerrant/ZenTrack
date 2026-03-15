"""Timesheet endpoints — weekly submission / approval workflow."""

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.timesheet import Timesheet, TimesheetStatus
from app.models.user import User, UserRole
from app.schemas.timesheet import TimesheetCreate, TimesheetResponse, TimesheetReview, TimesheetSubmit

router = APIRouter()


def _get_week_bounds(dt: datetime):
    """Return (monday, sunday) for the week containing dt."""
    monday = dt - timedelta(days=dt.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return monday, sunday


@router.get("", response_model=List[TimesheetResponse])
def list_timesheets(
    user_id: Optional[int] = None,
    status_filter: Optional[TimesheetStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List timesheets. Managers/admins see all; members see own."""
    if not current_user.organization_id:
        return []

    q = db.query(Timesheet).filter(Timesheet.organization_id == current_user.organization_id)

    if not current_user.can_manage_organization():
        q = q.filter(Timesheet.user_id == current_user.id)
    elif user_id:
        q = q.filter(Timesheet.user_id == user_id)

    if status_filter:
        q = q.filter(Timesheet.status == status_filter)

    return q.order_by(Timesheet.week_start.desc()).all()


@router.post("", response_model=TimesheetResponse, status_code=status.HTTP_201_CREATED)
def create_timesheet(
    data: TimesheetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a draft timesheet for the given week."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    # Check for duplicate
    existing = db.query(Timesheet).filter(
        Timesheet.user_id == current_user.id,
        Timesheet.week_start == data.week_start,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Timesheet already exists for this week")

    ts = Timesheet(
        week_start=data.week_start,
        week_end=data.week_end,
        notes=data.notes,
        user_id=current_user.id,
        organization_id=current_user.organization_id,
    )
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@router.get("/current", response_model=TimesheetResponse)
def get_current_week_timesheet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get or auto-create the timesheet for the current week."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    monday, sunday = _get_week_bounds(datetime.utcnow())
    ts = db.query(Timesheet).filter(
        Timesheet.user_id == current_user.id,
        Timesheet.week_start == monday,
    ).first()

    if not ts:
        ts = Timesheet(
            week_start=monday,
            week_end=sunday,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
        )
        db.add(ts)
        db.commit()
        db.refresh(ts)

    return ts


@router.get("/{timesheet_id}", response_model=TimesheetResponse)
def get_timesheet(
    timesheet_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ts = db.query(Timesheet).filter(
        Timesheet.id == timesheet_id,
        Timesheet.organization_id == current_user.organization_id,
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if not current_user.can_manage_organization() and ts.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return ts


@router.post("/{timesheet_id}/submit", response_model=TimesheetResponse)
def submit_timesheet(
    timesheet_id: int,
    data: TimesheetSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a draft timesheet for review."""
    ts = db.query(Timesheet).filter(
        Timesheet.id == timesheet_id,
        Timesheet.user_id == current_user.id,
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if ts.status not in (TimesheetStatus.DRAFT, TimesheetStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Only draft or rejected timesheets can be submitted")

    if data.notes:
        ts.notes = data.notes
    ts.submit()
    db.commit()
    db.refresh(ts)
    return ts


@router.post("/{timesheet_id}/approve", response_model=TimesheetResponse)
def approve_timesheet(
    timesheet_id: int,
    data: TimesheetReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve a submitted timesheet (manager/admin only)."""
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    ts = db.query(Timesheet).filter(
        Timesheet.id == timesheet_id,
        Timesheet.organization_id == current_user.organization_id,
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if ts.status != TimesheetStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted timesheets can be approved")

    ts.approve(reviewer_id=current_user.id, notes=data.reviewer_notes)
    db.commit()
    db.refresh(ts)
    return ts


@router.post("/{timesheet_id}/reject", response_model=TimesheetResponse)
def reject_timesheet(
    timesheet_id: int,
    data: TimesheetReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a submitted timesheet (manager/admin only)."""
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    ts = db.query(Timesheet).filter(
        Timesheet.id == timesheet_id,
        Timesheet.organization_id == current_user.organization_id,
    ).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    if ts.status != TimesheetStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted timesheets can be rejected")

    ts.reject(reviewer_id=current_user.id, notes=data.reviewer_notes)
    db.commit()
    db.refresh(ts)
    return ts
