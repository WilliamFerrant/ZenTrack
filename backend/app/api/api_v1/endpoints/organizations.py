"""Organizations management endpoints — multi-org support."""

import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User, UserRole

router = APIRouter()


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    # The current user's role in this org (injected at query time)
    my_role: Optional[str] = None

    class Config:
        from_attributes = True


class CreateOrganizationRequest(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


def _make_slug(name: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower().strip()).strip("-") or "org"
    slug, i = base, 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


def _org_with_role(org: Organization, role: Optional[UserRole]) -> OrganizationResponse:
    return OrganizationResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        description=org.description,
        website=org.website,
        is_active=org.is_active,
        my_role=role.value if role else None,
    )


# ── List all orgs the current user belongs to ─────────────────────────────────

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_superuser:
        orgs = db.query(Organization).filter(Organization.is_active == True).all()
        return [_org_with_role(o, None) for o in orgs]

    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    )
    if not memberships:
        return []

    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(
        Organization.id.in_(org_ids),
        Organization.is_active == True,
    ).all()

    role_map = {m.organization_id: m.role for m in memberships}
    return [_org_with_role(o, role_map.get(o.id)) for o in orgs]


# ── Create a new organization ──────────────────────────────────────────────────

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    data: CreateOrganizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org = Organization(
        name=data.name.strip(),
        slug=_make_slug(data.name, db),
        description=data.description,
        website=data.website,
    )
    db.add(org)
    db.flush()  # get org.id

    # Add the creator as ADMIN member
    membership = OrganizationMember(
        user_id=current_user.id,
        organization_id=org.id,
        role=UserRole.ADMIN,
    )
    db.add(membership)

    # Switch the creator's active org to the new one
    current_user.organization_id = org.id
    current_user.role = UserRole.ADMIN

    db.commit()
    db.refresh(org)
    return _org_with_role(org, UserRole.ADMIN)


# ── Get current active org ─────────────────────────────────────────────────────

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="No active organization")
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.organization_id == org.id,
    ).first()
    return _org_with_role(org, membership.role if membership else current_user.role)


# ── Update current active org (admin only) ────────────────────────────────────

@router.put("/current", response_model=OrganizationResponse)
def update_current_organization(
    data: CreateOrganizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="No active organization")
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.name = data.name.strip()
    if data.description is not None:
        org.description = data.description
    if data.website is not None:
        org.website = data.website
    db.commit()
    db.refresh(org)
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.organization_id == org.id,
    ).first()
    return _org_with_role(org, membership.role if membership else current_user.role)


# ── Switch active organization ─────────────────────────────────────────────────

@router.post("/{org_id}/switch", response_model=OrganizationResponse)
def switch_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.organization_id == org_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org or not org.is_active:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update active context on the user row
    current_user.organization_id = org_id
    current_user.role = membership.role
    db.commit()

    return _org_with_role(org, membership.role)
