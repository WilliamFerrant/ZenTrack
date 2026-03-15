"""Client endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.client import Client as ClientModel
from app.models.user import User
from app.schemas.client import Client, ClientCreate, ClientUpdate

router = APIRouter()


@router.get("", response_model=List[Client])
def get_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.organization_id:
        return []
    return db.query(ClientModel).filter(
        ClientModel.organization_id == current_user.organization_id,
        ClientModel.is_active == True,
    ).order_by(ClientModel.name).all()


@router.post("", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    client = ClientModel(
        **client_data.model_dump(),
        organization_id=current_user.organization_id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=Client)
def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = db.query(ClientModel).filter(
        ClientModel.id == client_id,
        ClientModel.organization_id == current_user.organization_id,
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}", response_model=Client)
def update_client(
    client_id: int,
    updates: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = db.query(ClientModel).filter(
        ClientModel.id == client_id,
        ClientModel.organization_id == current_user.organization_id,
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = db.query(ClientModel).filter(
        ClientModel.id == client_id,
        ClientModel.organization_id == current_user.organization_id,
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Soft delete — detach projects, mark inactive
    for project in client.projects:
        project.client_id = None
    client.is_active = False
    db.commit()
