"""API v1 router configuration."""

from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, timers, time_entries, projects, dashboard, clients, tasks, team, timesheets, organizations, teams

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(tasks.router, prefix="/projects", tags=["Tasks"])
api_router.include_router(timers.router, prefix="/timers", tags=["Timers"])
api_router.include_router(time_entries.router, prefix="/time-entries", tags=["Time Entries"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(team.router, prefix="/team", tags=["Team"])
api_router.include_router(timesheets.router, prefix="/timesheets", tags=["Timesheets"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])