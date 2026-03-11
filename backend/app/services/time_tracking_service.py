"""Time tracking service for business logic."""

from datetime import datetime, date, timedelta
from typing import List, Optional, Dict
from collections import defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from app.models.timer import Timer
from app.models.time_entry import TimeEntry
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.timer import TimerCreate, TimerStop
from app.schemas.time_entry import TimeEntryCreate, TimeEntryUpdate


class TimeTrackingService:
    """Service for time tracking operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db

    def start_timer(self, user_id: int, timer_data: TimerCreate) -> Timer:
        """Start a new timer, stopping any existing running timer."""
        # Stop any existing running timer
        existing_timer = self.get_active_timer(user_id)
        if existing_timer:
            self.stop_timer(user_id, existing_timer.id)

        # Validate project exists and user has access
        project = self.db.query(Project).filter(Project.id == timer_data.project_id).first()
        if not project:
            raise ValueError("Project not found")

        # Validate task if provided
        if timer_data.task_id:
            task = self.db.query(Task).filter(
                and_(
                    Task.id == timer_data.task_id,
                    Task.project_id == timer_data.project_id
                )
            ).first()
            if not task:
                raise ValueError("Task not found or does not belong to project")

        # Create new timer
        timer = Timer(
            description=timer_data.description,
            start_time=datetime.utcnow(),
            is_running=True,
            user_id=user_id,
            project_id=timer_data.project_id,
            task_id=timer_data.task_id,
        )

        self.db.add(timer)
        self.db.commit()
        self.db.refresh(timer)

        return timer

    def stop_timer(self, user_id: int, timer_id: Optional[int] = None, stop_data: Optional[TimerStop] = None) -> TimeEntry:
        """Stop a timer and create a time entry."""
        # If timer_id not provided, get the active timer
        if timer_id is None:
            timer = self.get_active_timer(user_id)
            if not timer:
                raise ValueError("No active timer found")
        else:
            timer = self.db.query(Timer).filter(
                and_(Timer.id == timer_id, Timer.user_id == user_id)
            ).first()
            if not timer:
                raise ValueError("Timer not found")

        if not timer.is_running:
            raise ValueError("Timer is not running")

        # Stop the timer
        end_time = datetime.utcnow()
        duration = timer.stop()

        # Create time entry
        description = stop_data.description if stop_data and stop_data.description else timer.description
        time_entry = TimeEntry.from_timer(timer, end_time, description)

        # Get project hourly rate if not set
        if not time_entry.hourly_rate:
            project = self.db.query(Project).filter(Project.id == timer.project_id).first()
            if project and project.hourly_rate:
                time_entry.hourly_rate = project.hourly_rate

        self.db.add(time_entry)
        self.db.delete(timer)  # Remove the timer after creating time entry
        self.db.commit()
        self.db.refresh(time_entry)

        return time_entry

    def get_active_timer(self, user_id: int) -> Optional[Timer]:
        """Get the currently active timer for a user."""
        return self.db.query(Timer).filter(
            and_(Timer.user_id == user_id, Timer.is_running == True)
        ).first()

    def get_user_timers(self, user_id: int) -> List[Timer]:
        """Get all timers for a user (active and inactive)."""
        return self.db.query(Timer).filter(Timer.user_id == user_id).order_by(desc(Timer.created_at)).all()

    def get_time_entries(
        self,
        user_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        project_id: Optional[int] = None,
        limit: int = 100
    ) -> List[TimeEntry]:
        """Get time entries for a user with optional filters."""
        query = self.db.query(TimeEntry).filter(TimeEntry.user_id == user_id)

        if start_date:
            query = query.filter(TimeEntry.start_time >= start_date)

        if end_date:
            query = query.filter(TimeEntry.start_time <= end_date)

        if project_id:
            query = query.filter(TimeEntry.project_id == project_id)

        return query.order_by(desc(TimeEntry.start_time)).limit(limit).all()

    def get_time_entries_for_day(self, user_id: int, target_date: date = None) -> List[TimeEntry]:
        """Get time entries for a specific day."""
        if target_date is None:
            target_date = date.today()

        start_time = datetime.combine(target_date, datetime.min.time())
        end_time = datetime.combine(target_date, datetime.max.time())

        return self.db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_time,
                TimeEntry.start_time <= end_time
            )
        ).order_by(desc(TimeEntry.start_time)).all()

    def get_time_entries_for_week(self, user_id: int, target_date: date = None) -> List[TimeEntry]:
        """Get time entries for the week containing the target date."""
        if target_date is None:
            target_date = date.today()

        # Find the start of the week (Monday)
        days_since_monday = target_date.weekday()
        week_start = target_date - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)

        start_time = datetime.combine(week_start, datetime.min.time())
        end_time = datetime.combine(week_end, datetime.max.time())

        return self.db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_time,
                TimeEntry.start_time <= end_time
            )
        ).order_by(desc(TimeEntry.start_time)).all()

    def create_time_entry(self, user_id: int, entry_data: TimeEntryCreate) -> TimeEntry:
        """Create a manual time entry."""
        # Validate project exists
        project = self.db.query(Project).filter(Project.id == entry_data.project_id).first()
        if not project:
            raise ValueError("Project not found")

        # Validate task if provided
        if entry_data.task_id:
            task = self.db.query(Task).filter(
                and_(
                    Task.id == entry_data.task_id,
                    Task.project_id == entry_data.project_id
                )
            ).first()
            if not task:
                raise ValueError("Task not found or does not belong to project")

        # Calculate duration
        duration = int((entry_data.end_time - entry_data.start_time).total_seconds())
        if duration <= 0:
            raise ValueError("End time must be after start time")

        # Create time entry
        time_entry = TimeEntry(
            description=entry_data.description,
            start_time=entry_data.start_time,
            end_time=entry_data.end_time,
            duration=duration,
            is_billable=entry_data.is_billable,
            hourly_rate=entry_data.hourly_rate,
            user_id=user_id,
            project_id=entry_data.project_id,
            task_id=entry_data.task_id,
        )

        # Set hourly rate from project if not provided
        if not time_entry.hourly_rate and project.hourly_rate:
            time_entry.hourly_rate = project.hourly_rate

        self.db.add(time_entry)
        self.db.commit()
        self.db.refresh(time_entry)

        return time_entry

    def update_time_entry(self, user_id: int, entry_id: int, entry_data: TimeEntryUpdate) -> Optional[TimeEntry]:
        """Update a time entry."""
        time_entry = self.db.query(TimeEntry).filter(
            and_(TimeEntry.id == entry_id, TimeEntry.user_id == user_id)
        ).first()

        if not time_entry:
            return None

        # Update fields
        if entry_data.description is not None:
            time_entry.description = entry_data.description

        if entry_data.start_time is not None:
            time_entry.start_time = entry_data.start_time

        if entry_data.end_time is not None:
            time_entry.end_time = entry_data.end_time

        if entry_data.is_billable is not None:
            time_entry.is_billable = entry_data.is_billable

        if entry_data.hourly_rate is not None:
            time_entry.hourly_rate = entry_data.hourly_rate

        # Recalculate duration if times changed
        if entry_data.start_time is not None or entry_data.end_time is not None:
            duration = int((time_entry.end_time - time_entry.start_time).total_seconds())
            if duration <= 0:
                raise ValueError("End time must be after start time")
            time_entry.duration = duration

        self.db.commit()
        self.db.refresh(time_entry)

        return time_entry

    def delete_time_entry(self, user_id: int, entry_id: int) -> bool:
        """Delete a time entry."""
        time_entry = self.db.query(TimeEntry).filter(
            and_(TimeEntry.id == entry_id, TimeEntry.user_id == user_id)
        ).first()

        if not time_entry:
            return False

        self.db.delete(time_entry)
        self.db.commit()

        return True

    def calculate_total_duration(self, time_entries: List[TimeEntry]) -> int:
        """Calculate total duration in seconds for a list of time entries."""
        return sum(entry.duration for entry in time_entries)

    def get_daily_aggregation(self, user_id: int, start_date: date, end_date: date) -> Dict[str, Dict]:
        """Get daily time aggregation for a date range."""
        # Query for time entries in the date range
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())

        time_entries = self.db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_datetime,
                TimeEntry.start_time <= end_datetime
            )
        ).all()

        # Group by date
        daily_data = defaultdict(lambda: {'total_duration': 0, 'entries_count': 0})

        for entry in time_entries:
            entry_date = entry.start_time.date().isoformat()
            daily_data[entry_date]['total_duration'] += entry.duration
            daily_data[entry_date]['entries_count'] += 1

        # Ensure all dates in range are represented (even with zero data)
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.isoformat()
            if date_str not in daily_data:
                daily_data[date_str] = {'total_duration': 0, 'entries_count': 0}
            current_date += timedelta(days=1)

        return daily_data

    def get_project_aggregation(self, user_id: int, start_date: date, end_date: date) -> Dict[int, Dict]:
        """Get project time aggregation for a date range."""
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())

        # Query with join to get project names
        results = self.db.query(
            TimeEntry.project_id,
            Project.name,
            func.sum(TimeEntry.duration).label('total_duration'),
            func.count(TimeEntry.id).label('entries_count')
        ).join(Project).filter(
            and_(
                TimeEntry.user_id == user_id,
                TimeEntry.start_time >= start_datetime,
                TimeEntry.start_time <= end_datetime
            )
        ).group_by(TimeEntry.project_id, Project.name).all()

        # Convert to dictionary format
        project_data = {}
        for result in results:
            project_data[result.project_id] = {
                'project_name': result.name,
                'total_duration': int(result.total_duration),
                'entries_count': int(result.entries_count)
            }

        return project_data

    def get_dashboard_aggregation(self, user_id: int, start_date: date, end_date: date) -> Dict:
        """Get complete dashboard aggregation for a date range."""
        # Get daily and project aggregations
        daily_data = self.get_daily_aggregation(user_id, start_date, end_date)
        project_data = self.get_project_aggregation(user_id, start_date, end_date)

        # Prepare daily totals (sorted by date)
        daily_totals = []
        for date_str in sorted(daily_data.keys()):
            data = daily_data[date_str]
            daily_totals.append({
                'date': date_str,
                'total_duration': data['total_duration'],
                'total_hours': round(data['total_duration'] / 3600, 2),
                'entries_count': data['entries_count']
            })

        # Prepare project totals (sorted by total hours descending)
        project_totals = []
        for project_id, data in project_data.items():
            project_totals.append({
                'project_id': project_id,
                'project_name': data['project_name'],
                'total_duration': data['total_duration'],
                'total_hours': round(data['total_duration'] / 3600, 2),
                'entries_count': data['entries_count']
            })

        # Sort by total hours descending
        project_totals.sort(key=lambda x: x['total_hours'], reverse=True)

        # Calculate overall totals
        total_duration = sum(data['total_duration'] for data in daily_data.values())

        return {
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'daily_totals': daily_totals,
            'project_totals': project_totals,
            'total_duration': total_duration,
            'total_hours': round(total_duration / 3600, 2)
        }