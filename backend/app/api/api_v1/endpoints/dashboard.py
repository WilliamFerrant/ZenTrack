"""Dashboard endpoints."""

from datetime import date, datetime, timedelta
from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.time_entry import TimeEntry
from app.models.project import Project
from app.models.user import User

router = APIRouter()


def _get_period_dates(period: str):
    today = date.today()
    if period == "day":
        return today, today
    elif period == "week":
        start = today - timedelta(days=today.weekday())
        return start, start + timedelta(days=6)
    else:  # month
        start = today.replace(day=1)
        next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        return start, next_month - timedelta(days=1)


@router.get("/summary")
def get_dashboard_summary(
    period: str = Query("day", regex="^(day|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_date, end_date = _get_period_dates(period)
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date, datetime.max.time())

    entries: List[TimeEntry] = (
        db.query(TimeEntry)
        .filter(
            TimeEntry.user_id == current_user.id,
            TimeEntry.start_time >= start_dt,
            TimeEntry.start_time <= end_dt,
        )
        .all()
    )

    # Totals
    total_time = sum(e.duration for e in entries)
    billable_time = sum(e.duration for e in entries if e.is_billable)
    active_days = len({e.start_time.date() for e in entries})

    # Daily breakdown
    daily: Dict[date, dict] = defaultdict(lambda: {"total_time": 0, "billable_time": 0, "entries_count": 0})
    for e in entries:
        d = e.start_time.date()
        daily[d]["total_time"] += e.duration
        daily[d]["billable_time"] += e.duration if e.is_billable else 0
        daily[d]["entries_count"] += 1

    daily_breakdown = [
        {"date": str(d), "total_time": v["total_time"], "billable_time": v["billable_time"], "entries_count": v["entries_count"]}
        for d, v in sorted(daily.items())
    ]

    # Project breakdown
    proj_map: Dict[int, dict] = defaultdict(lambda: {"total_time": 0, "billable_time": 0, "project": None})
    for e in entries:
        proj_map[e.project_id]["total_time"] += e.duration
        proj_map[e.project_id]["billable_time"] += e.duration if e.is_billable else 0
        if proj_map[e.project_id]["project"] is None:
            proj_map[e.project_id]["project"] = e.project

    project_breakdown = []
    for pid, v in proj_map.items():
        p = v["project"]
        if p is None:
            continue
        project_breakdown.append({
            "project": {
                "id": p.id,
                "name": p.name,
                "color": p.color or "#6366f1",
                "status": p.status.value if p.status else "ACTIVE",
                "is_billable": p.is_billable,
                "is_active": p.is_active,
            },
            "total_time": v["total_time"],
            "billable_time": v["billable_time"],
            "percentage": round(v["total_time"] / total_time * 100, 1) if total_time else 0,
        })

    # Productivity metrics
    avg_session = round(total_time / len(entries), 0) if entries else 0
    longest = max((e.duration for e in entries), default=0)
    hour_totals: Dict[int, int] = defaultdict(int)
    for e in entries:
        hour_totals[e.start_time.hour] += e.duration
    most_productive_hour = max(hour_totals, key=lambda h: hour_totals[h]) if hour_totals else 9

    return {
        "period": {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "type": period,
        },
        "totals": {
            "total_time": total_time,
            "billable_time": billable_time,
            "non_billable_time": total_time - billable_time,
            "total_entries": len(entries),
            "active_days": active_days,
        },
        "daily_breakdown": daily_breakdown,
        "project_breakdown": project_breakdown,
        "productivity_metrics": {
            "average_session_length": avg_session,
            "longest_session": longest,
            "most_productive_hour": most_productive_hour,
        },
    }
