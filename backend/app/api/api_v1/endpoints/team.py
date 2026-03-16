"""Team management endpoints — multi-org aware."""

import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.organization_member import OrganizationMember
from app.models.user import User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()


class InviteMemberRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.MEMBER


class UpdateMemberRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ── List members of the active org ────────────────────────────────────────────

@router.get("", response_model=List[UserResponse])
def list_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.organization_id:
        return []
    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == current_user.organization_id)
        .all()
    )
    user_ids = [m.user_id for m in memberships]
    if not user_ids:
        return []
    return db.query(User).filter(User.id.in_(user_ids)).order_by(User.first_name).all()


# ── Invite a member (or add an existing user) ─────────────────────────────────

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    data: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Only admins and managers can invite members")
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        already = db.query(OrganizationMember).filter(
            OrganizationMember.user_id == existing.id,
            OrganizationMember.organization_id == current_user.organization_id,
        ).first()
        if already:
            raise HTTPException(status_code=409, detail="User already in this organization")
        # Add membership without disturbing their active org
        db.add(OrganizationMember(
            user_id=existing.id,
            organization_id=current_user.organization_id,
            role=data.role,
        ))
        db.commit()
        db.refresh(existing)
        return existing

    from app.services.auth_service import AuthService
    auth_service = AuthService(db)
    temp_password = secrets.token_urlsafe(12)
    new_user = auth_service.create_user(
        email=data.email,
        password=temp_password,
        first_name=data.first_name,
        last_name=data.last_name,
    )
    # Set their active org to this one (first org they've joined)
    new_user.organization_id = current_user.organization_id
    new_user.role = data.role
    db.add(OrganizationMember(
        user_id=new_user.id,
        organization_id=current_user.organization_id,
        role=data.role,
    ))
    db.commit()
    db.refresh(new_user)
    return new_user


# ── Update a member's role or details ─────────────────────────────────────────

@router.put("/{member_id}", response_model=UserResponse)
def update_member(
    member_id: int,
    data: UpdateMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == member_id,
        OrganizationMember.organization_id == current_user.organization_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this organization")

    member = db.query(User).filter(User.id == member_id).first()

    if data.role and data.role != membership.role:
        # Prevent demoting the last admin
        if membership.role == UserRole.ADMIN:
            admin_count = db.query(OrganizationMember).filter(
                OrganizationMember.organization_id == current_user.organization_id,
                OrganizationMember.role == UserRole.ADMIN,
            ).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last admin")
        membership.role = data.role
        # Keep users.role in sync if this is their active org
        if member.organization_id == current_user.organization_id:
            member.role = data.role

    if data.first_name is not None:
        member.first_name = data.first_name
    if data.last_name is not None:
        member.last_name = data.last_name
    if data.is_active is not None:
        member.is_active = data.is_active

    db.commit()
    db.refresh(member)
    return member


# ── Remove a member from this org ─────────────────────────────────────────────

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if member_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == member_id,
        OrganizationMember.organization_id == current_user.organization_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this organization")

    db.delete(membership)

    # If this was their active org, switch them to another org (or clear it)
    member = db.query(User).filter(User.id == member_id).first()
    if member and member.organization_id == current_user.organization_id:
        other = db.query(OrganizationMember).filter(
            OrganizationMember.user_id == member_id,
            OrganizationMember.organization_id != current_user.organization_id,
        ).first()
        member.organization_id = other.organization_id if other else None
        member.role = other.role if other else UserRole.MEMBER

    db.commit()
