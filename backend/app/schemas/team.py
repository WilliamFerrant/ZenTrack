"""Team schemas."""

from typing import List, Optional

from pydantic import BaseModel

from app.schemas.base import TimestampSchema


class TeamMemberSchema(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    organization_id: int
    members: List[TeamMemberSchema] = []

    class Config:
        from_attributes = True
