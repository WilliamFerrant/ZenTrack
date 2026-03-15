"""Task endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.project import Project as ProjectModel
from app.models.task import Task as TaskModel
from app.models.user import User
from app.schemas.task import Task, TaskCreate, TaskUpdate

router = APIRouter()


def _get_project(project_id: int, user: User, db: Session) -> ProjectModel:
    project = db.query(ProjectModel).filter(
        ProjectModel.id == project_id,
        ProjectModel.organization_id == user.organization_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/tasks", response_model=List[Task])
def get_tasks(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_project(project_id, current_user, db)
    return db.query(TaskModel).filter(TaskModel.project_id == project_id).order_by(TaskModel.created_at).all()


@router.post("/{project_id}/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_project(project_id, current_user, db)
    task = TaskModel(
        name=task_data.name,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        is_billable=task_data.is_billable,
        estimated_hours=task_data.estimated_hours,
        due_date=task_data.due_date,
        project_id=project_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{project_id}/tasks/{task_id}", response_model=Task)
def update_task(
    project_id: int,
    task_id: int,
    updates: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_project(project_id, current_user, db)
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id,
        TaskModel.project_id == project_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{project_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_project(project_id, current_user, db)
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id,
        TaskModel.project_id == project_id,
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
