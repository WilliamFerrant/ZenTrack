"""Timer endpoints."""

from typing import List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.timer import Timer, TimerCreate, TimerStop
from app.schemas.time_entry import TimeEntry
from app.services.time_tracking_service import TimeTrackingService

router = APIRouter()


def get_time_tracking_service(db: Session = Depends(get_db)) -> TimeTrackingService:
    """Get time tracking service dependency."""
    return TimeTrackingService(db)


@router.post("/start", response_model=Timer)
def start_timer(
    timer_data: TimerCreate,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Start a new timer for the current user.

    - **project_id**: ID of the project to track time for
    - **task_id**: Optional ID of the task to track time for
    - **description**: Optional description of what you're working on

    This will automatically stop any existing running timer before starting the new one.
    """
    try:
        timer = service.start_timer(current_user.id, timer_data)
        return timer
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/stop", response_model=TimeEntry)
def stop_timer(
    stop_data: TimerStop = None,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Stop the current running timer and create a time entry.

    - **description**: Optional description to override the timer's description

    Returns the created time entry.
    """
    try:
        time_entry = service.stop_timer(current_user.id, stop_data=stop_data)
        return time_entry
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{timer_id}/stop", response_model=TimeEntry)
def stop_specific_timer(
    timer_id: int,
    stop_data: TimerStop = None,
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Stop a specific timer and create a time entry.

    - **timer_id**: ID of the timer to stop
    - **description**: Optional description to override the timer's description

    Returns the created time entry.
    """
    try:
        time_entry = service.stop_timer(current_user.id, timer_id, stop_data)
        return time_entry
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/active", response_model=Optional[Timer])
def get_active_timer(
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get the currently active timer for the current user.

    Returns None if no timer is currently running.
    """
    timer = service.get_active_timer(current_user.id)
    return timer


@router.get("/", response_model=List[Timer])
def get_user_timers(
    current_user: User = Depends(get_current_user),
    service: TimeTrackingService = Depends(get_time_tracking_service),
):
    """
    Get all timers for the current user (active and inactive).

    Returns timers ordered by creation date (most recent first).
    """
    timers = service.get_user_timers(current_user.id)
    return timers