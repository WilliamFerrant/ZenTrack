"""Team management endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()


class InviteMemberRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.MEMBER


class UpdateMemberRoleRequest(BaseModel):
    role: UserRole


class UpdateMemberRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


@router.get("", response_model=List[UserResponse])
def list_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all members in the current user's organization."""
    if not current_user.organization_id:
        return []
    return (
        db.query(User)
        .filter(User.organization_id == current_user.organization_id)
        .order_by(User.first_name)
        .all()
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invite a new member to the organization (creates account with temp password)."""
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Only admins and managers can invite members")
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        if existing.organization_id == current_user.organization_id:
            raise HTTPException(status_code=409, detail="User already in organization")
        # Re-assign existing user to this org
        existing.organization_id = current_user.organization_id
        existing.role = data.role
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    import secrets
    from app.services.auth_service import AuthService
    auth_service = AuthService(db)
    temp_password = secrets.token_urlsafe(12)
    new_user = auth_service.create_user(
        email=data.email,
        password=temp_password,
        first_name=data.first_name,
        last_name=data.last_name,
    )
    new_user.organization_id = current_user.organization_id
    new_user.role = data.role
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{member_id}", response_model=UserResponse)
def update_member(
    member_id: int,
    data: UpdateMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a team member's role or details."""
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    member = db.query(User).filter(
        User.id == member_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Prevent removing the last admin
    if data.role and data.role != UserRole.ADMIN and member.role == UserRole.ADMIN:
        admin_count = db.query(User).filter(
            User.organization_id == current_user.organization_id,
            User.role == UserRole.ADMIN,
            User.is_active == True,
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last admin")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the organization (soft deactivate)."""
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if member_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    member = db.query(User).filter(
        User.id == member_id,
        User.organization_id == current_user.organization_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.is_active = False
    member.organization_id = None
    db.commit()
