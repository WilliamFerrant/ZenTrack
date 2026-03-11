"""Manual test script for authentication endpoints."""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"


def test_login(email: str = "admin@zentracker.com", password: str = "admin123!") -> Optional[str]:
    """Test login endpoint and return access token."""
    print("Testing login...")

    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password}
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        data = response.json()
        access_token = data["data"]["access_token"]
        print("✅ Login successful!")
        return access_token
    else:
        print("❌ Login failed!")
        return None


def test_current_user(access_token: str):
    """Test current user endpoint."""
    print("\nTesting current user...")

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("✅ Current user retrieval successful!")
    else:
        print("❌ Current user retrieval failed!")


def test_refresh_token(refresh_token: str):
    """Test token refresh endpoint."""
    print("\nTesting token refresh...")

    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("✅ Token refresh successful!")
    else:
        print("❌ Token refresh failed!")


def test_logout(access_token: str):
    """Test logout endpoint."""
    print("\nTesting logout...")

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("✅ Logout successful!")
    else:
        print("❌ Logout failed!")


def main():
    """Run all authentication tests."""
    print("🧪 Testing Zentracker Authentication API")
    print("=" * 50)

    # Test login
    access_token = test_login()
    if not access_token:
        print("❌ Cannot continue tests without access token")
        return

    # Extract tokens from login response for full test
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@zentracker.com", "password": "admin123!"}
    )
    if response.status_code == 200:
        data = response.json()
        access_token = data["data"]["access_token"]
        refresh_token = data["data"]["refresh_token"]

        # Test other endpoints
        test_current_user(access_token)
        test_refresh_token(refresh_token)
        test_logout(access_token)

    print("\n🏁 Tests completed!")


if __name__ == "__main__":
    main()