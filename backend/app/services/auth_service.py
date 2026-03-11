"""Authentication service for business logic."""

from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_refresh_token,
    verify_token,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: Session):
        """Initialize auth service with database session."""
        self.db = db

    def authenticate_user(self, login_data: LoginRequest) -> Optional[User]:
        """Authenticate user with email and password."""
        user = self.db.query(User).filter(User.email == login_data.email).first()

        if not user:
            return None

        if not verify_password(login_data.password, user.hashed_password):
            return None

        if not user.is_active:
            return None

        return user

    def create_tokens(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for user."""
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        refresh_token = create_refresh_token(subject=user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        )

    def refresh_access_token(self, refresh_token: str) -> Optional[TokenResponse]:
        """Refresh access token using refresh token."""
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            return None

        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            return None

        return self.create_tokens(user)

    def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from access token."""
        user_id = verify_token(token)
        if not user_id:
            return None

        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            return None

        return user

    def create_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        organization_id: Optional[int] = None,
    ) -> User:
        """Create a new user."""
        hashed_password = get_password_hash(password)

        user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            organization_id=organization_id,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()