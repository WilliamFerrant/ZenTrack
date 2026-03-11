"""Project endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.project import Project as ProjectModel
from app.schemas.project import Project, ProjectCreate

router = APIRouter()


@router.get("/", response_model=List[Project])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all active projects for the user's organization.

    Returns list of projects that the user can track time against.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization"
        )

    projects = db.query(ProjectModel).filter(
        ProjectModel.organization_id == current_user.organization_id,
        ProjectModel.is_active == True
    ).all()

    return projects


@router.post("/", response_model=Project)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new project.

    - **name**: Project name (required)
    - **description**: Optional project description
    - **color**: Optional hex color code for the project
    - **is_billable**: Whether time tracked on this project is billable (default: true)
    - **hourly_rate**: Optional default hourly rate for the project

    Creates a new project in the user's organization.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization"
        )

    # Set organization_id from current user
    project_data.organization_id = current_user.organization_id

    project = ProjectModel(
        name=project_data.name,
        description=project_data.description,
        color=project_data.color,
        is_active=project_data.is_active,
        is_billable=project_data.is_billable,
        status=project_data.status,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        deadline=project_data.deadline,
        budget_hours=project_data.budget_hours,
        budget_amount=project_data.budget_amount,
        hourly_rate=project_data.hourly_rate,
        organization_id=project_data.organization_id,
        client_id=project_data.client_id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("/{project_id}", response_model=Project)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific project by ID.

    - **project_id**: ID of the project to retrieve

    Returns the project details if it belongs to the user's organization.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization"
        )

    project = db.query(ProjectModel).filter(
        ProjectModel.id == project_id,
        ProjectModel.organization_id == current_user.organization_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return project