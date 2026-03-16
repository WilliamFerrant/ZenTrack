"""Teams management endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.api_v1.endpoints.auth import get_current_user
from app.db.database import get_db
from app.models.organization_member import OrganizationMember
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.schemas.team import TeamCreate, TeamMemberSchema, TeamResponse, TeamUpdate

router = APIRouter()


class AddMemberBody(BaseModel):
    user_id: int


def _require_org(user: User) -> int:
    if not user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization")
    return user.organization_id


def _require_team(db: Session, team_id: int, org_id: int) -> Team:
    team = db.query(Team).filter(
        Team.id == team_id,
        Team.organization_id == org_id,
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


def _build_response(team: Team, db: Session) -> TeamResponse:
    user_ids = [m.user_id for m in team.memberships]
    members = []
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        members = [
            TeamMemberSchema(
                id=u.id,
                first_name=u.first_name,
                last_name=u.last_name,
                email=u.email,
                role=u.role.value if u.role else "MEMBER",
            )
            for u in users
        ]
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        color=team.color,
        organization_id=team.organization_id,
        members=members,
    )


@router.get("", response_model=List[TeamResponse])
def list_teams(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    teams = db.query(Team).filter(Team.organization_id == org_id).order_by(Team.name).all()
    return [_build_response(t, db) for t in teams]


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    data: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Only admins and managers can create teams")
    team = Team(
        name=data.name.strip(),
        description=data.description,
        color=data.color,
        organization_id=org_id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return _build_response(team, db)


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int,
    data: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    team = _require_team(db, team_id, org_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(team, field, value)
    db.commit()
    db.refresh(team)
    return _build_response(team, db)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Only admins can delete teams")
    team = _require_team(db, team_id, org_id)
    db.delete(team)
    db.commit()


@router.post("/{team_id}/members", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def add_team_member(
    team_id: int,
    body: AddMemberBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    team = _require_team(db, team_id, org_id)

    is_org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == body.user_id,
        OrganizationMember.organization_id == org_id,
    ).first()
    if not is_org_member:
        raise HTTPException(status_code=400, detail="User is not a member of this organization")

    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already in this team")

    db.add(TeamMember(team_id=team_id, user_id=body.user_id))
    db.commit()
    db.refresh(team)
    return _build_response(team, db)


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_id = _require_org(current_user)
    if not current_user.can_manage_organization():
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    _require_team(db, team_id, org_id)

    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not in this team")
    db.delete(membership)
    db.commit()
