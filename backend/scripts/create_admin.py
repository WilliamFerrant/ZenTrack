"""Script to create initial admin user."""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.models.organization import Organization


def create_admin_user():
    """Create default admin user and organization."""
    db: Session = SessionLocal()

    try:
        # Check if admin already exists
        admin_user = db.query(User).filter(User.email == "admin@zentracker.com").first()
        if admin_user:
            print("Admin user already exists!")
            return

        # Create default organization
        organization = db.query(Organization).filter(Organization.slug == "default").first()
        if not organization:
            organization = Organization(
                name="Default Organization",
                slug="default",
                description="Default organization for Zentracker",
                is_active=True,
            )
            db.add(organization)
            db.commit()
            db.refresh(organization)
            print(f"Created organization: {organization.name}")

        # Create admin user
        hashed_password = get_password_hash("admin123!")

        admin_user = User(
            email="admin@zentracker.com",
            first_name="Admin",
            last_name="User",
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True,
            role=UserRole.ADMIN,
            organization_id=organization.id,
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("=" * 50)
        print("Admin user created successfully!")
        print("=" * 50)
        print(f"Email: {admin_user.email}")
        print("Password: admin123!")
        print(f"Organization: {organization.name}")
        print("=" * 50)
        print("You can now login with these credentials.")

    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()