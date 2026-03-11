"""Authentication schemas for API validation."""

from pydantic import BaseModel, EmailStr

from app.schemas.base import BaseResponse
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class LoginResponse(BaseResponse):
    """Schema for login response."""

    data: TokenResponse
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""

    refresh_token: str


class UserProfile(UserResponse):
    """Schema for user profile (current user)."""

    pass


class LogoutResponse(BaseResponse):
    """Schema for logout response."""

    pass