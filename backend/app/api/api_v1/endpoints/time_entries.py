"""Time entries endpoints."""

from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.time_entry import (
    TimeEntry,
    TimeEntryCreate,
    TimeEntryListResponse,
    TimeEntryUpdate,
    DashboardTimeAggregation
)
from app.services.time_tracking_service import TimeTrackingService

router = APIRouter()


def get_time_tracking_service(db: Session = Depends(get_db)) -> TimeTrackingService:
    """Get time tracking service dependency."""
    return TimeTrackingService(db)


@router.get("", response_model=TimeEntryListResponse)
def get_time_entries(
    start_date: Optional[date] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date filter (YYYY-MM-DD)"),
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    limit: int = Query(100, description="Maximum number of entries to return", le=1000),
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time entries for the current user with optional filters.

    - **start_date**: Filter entries starting from this date
    - **end_date**: Filter entries ending before this date
    - **project_id**: Filter entries for a specific project
    - **limit**: Maximum number of entries to return (default: 100, max: 1000)

    Returns list of time entries with total duration summary.
    """
    entries = service.get_time_entries(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        project_id=project_id,
        limit=limit
    )

    total_duration = service.calculate_total_duration(entries)
    total_hours = round(total_duration / 3600, 2)

    return TimeEntryListResponse(
        entries=entries,
        total_duration=total_duration,
        total_hours=total_hours
    )


@router.get("/today", response_model=TimeEntryListResponse)
def get_today_entries(
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time entries for today.

    Returns all time entries for the current date with total duration summary.
    """
    entries = service.get_time_entries_for_day(current_user.id)
    total_duration = service.calculate_total_duration(entries)
    total_hours = round(total_duration / 3600, 2)

    return TimeEntryListResponse(
        entries=entries,
        total_duration=total_duration,
        total_hours=total_hours
    )


@router.get("/week", response_model=TimeEntryListResponse)
def get_week_entries(
    target_date: Optional[date] = Query(None, description="Date within the target week (defaults to current week)"),
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time entries for a week.

    - **target_date**: Any date within the target week (defaults to current week)

    Returns all time entries for the week containing the target date with total duration summary.
    """
    entries = service.get_time_entries_for_week(current_user.id, target_date)
    total_duration = service.calculate_total_duration(entries)
    total_hours = round(total_duration / 3600, 2)

    return TimeEntryListResponse(
        entries=entries,
        total_duration=total_duration,
        total_hours=total_hours
    )


@router.get("/day/{target_date}", response_model=TimeEntryListResponse)
def get_day_entries(
    target_date: date,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time entries for a specific day.

    - **target_date**: Date to get entries for (YYYY-MM-DD)

    Returns all time entries for the specified date with total duration summary.
    """
    entries = service.get_time_entries_for_day(current_user.id, target_date)
    total_duration = service.calculate_total_duration(entries)
    total_hours = round(total_duration / 3600, 2)

    return TimeEntryListResponse(
        entries=entries,
        total_duration=total_duration,
        total_hours=total_hours
    )


@router.post("", response_model=TimeEntry)
def create_time_entry(
    entry_data: TimeEntryCreate,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Create a manual time entry.

    - **start_time**: When the work started (ISO datetime)
    - **end_time**: When the work ended (ISO datetime)
    - **project_id**: ID of the project
    - **task_id**: Optional ID of the task
    - **description**: Optional description of the work
    - **is_billable**: Whether this time is billable (default: true)
    - **hourly_rate**: Optional hourly rate override

    Creates a new time entry for the specified time period.
    """
    try:
        time_entry = service.create_time_entry(current_user.id, entry_data)
        return time_entry
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{entry_id}", response_model=TimeEntry)
def update_time_entry(
    entry_id: int,
    entry_data: TimeEntryUpdate,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Update a time entry.

    - **entry_id**: ID of the time entry to update
    - **start_time**: Optional new start time
    - **end_time**: Optional new end time
    - **description**: Optional new description
    - **is_billable**: Optional new billable status
    - **hourly_rate**: Optional new hourly rate

    Updates the specified time entry. Duration is automatically recalculated if times change.
    """
    try:
        time_entry = service.update_time_entry(current_user.id, entry_id, entry_data)
        if not time_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time entry not found"
            )
        return time_entry
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{entry_id}")
def delete_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Delete a time entry.

    - **entry_id**: ID of the time entry to delete

    Permanently removes the time entry.
    """
    success = service.delete_time_entry(current_user.id, entry_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time entry not found"
        )

    return {"message": "Time entry deleted successfully"}


@router.get("/dashboard", response_model=DashboardTimeAggregation)
def get_dashboard_aggregation(
    start_date: date = Query(..., description="Start date for aggregation (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date for aggregation (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time tracking aggregation for dashboard.

    - **start_date**: Start date for the aggregation period (YYYY-MM-DD)
    - **end_date**: End date for the aggregation period (YYYY-MM-DD)

    Returns daily totals and project totals for the specified date range.
    Perfect for dashboard charts and summaries.
    """
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date"
        )

    # Limit to prevent excessive queries (1 year max)
    if (end_date - start_date).days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 365 days"
        )

    aggregation_data = service.get_dashboard_aggregation(current_user.id, start_date, end_date)
    return DashboardTimeAggregation(**aggregation_data)


@router.get("/dashboard/week", response_model=DashboardTimeAggregation)
def get_weekly_dashboard_aggregation(
    target_date: Optional[date] = Query(None, description="Date within the target week (defaults to current week)"),
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get time tracking aggregation for a week.

    - **target_date**: Any date within the target week (defaults to current week)

    Returns daily totals and project totals for the week containing the target date.
    Perfect for weekly dashboard summaries.
    """
    if target_date is None:
        target_date = date.today()

    # Find the start of the week (Monday)
    days_since_monday = target_date.weekday()
    week_start = target_date - timedelta(days=days_since_monday)
    week_end = week_start + timedelta(days=6)

    aggregation_data = service.get_dashboard_aggregation(current_user.id, week_start, week_end)
    return DashboardTimeAggregation(**aggregation_data)