"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserProfile,
)
from app.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Get auth service dependency."""
    return AuthService(db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get current authenticated user."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = auth_service.get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    register_data: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Register a new user account.

    - **full_name**: User full name
    - **email**: User email address
    - **password**: Password (min 8 characters)
    """
    existing = auth_service.get_user_by_email(register_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    name_parts = register_data.full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user = auth_service.create_user(
        email=register_data.email,
        password=register_data.password,
        first_name=first_name,
        last_name=last_name,
    )

    return RegisterResponse(message="Account created successfully", user=user)


@router.post("/login", response_model=LoginResponse)
def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Authenticate user and return access token.

    - **email**: User email address
    - **password**: User password

    Returns access token, refresh token, and user information.
    """
    user = auth_service.authenticate_user(login_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = auth_service.create_tokens(user)

    return LoginResponse(
        message="Login successful",
        data=tokens,
        user=user,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Refresh access token using refresh token.

    - **refresh_token**: Valid refresh token

    Returns new access token and refresh token.
    """
    tokens = auth_service.refresh_access_token(refresh_data.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return tokens


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile.

    Requires valid access token in Authorization header.
    """
    return current_user


@router.post("/logout", response_model=LogoutResponse)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.

    Note: In a stateless JWT implementation, logout is handled client-side
    by removing the tokens from storage. This endpoint exists for consistency
    and can be extended for token blacklisting in the future.
    """
    return LogoutResponse(message="Logout successful")


@router.get("/check", response_model=UserProfile)
def check_auth_status(current_user: User = Depends(get_current_user)):
    """
    Check authentication status.

    Returns current user information if authenticated.
    """
    return current_user