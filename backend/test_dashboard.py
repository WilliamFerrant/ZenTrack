"""Manual test script for dashboard aggregation endpoints."""

import requests
import json
from datetime import date, timedelta
from typing import Optional

BASE_URL = "http://localhost:8000/api/v1"


def get_access_token() -> Optional[str]:
    """Get access token for testing."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@zentracker.com", "password": "admin123!"}
    )

    if response.status_code == 200:
        data = response.json()
        return data["data"]["access_token"]
    return None


def test_weekly_dashboard(access_token: str):
    """Test weekly dashboard aggregation endpoint."""
    print("Testing weekly dashboard aggregation...")

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/time-entries/dashboard/week", headers=headers)

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Weekly dashboard aggregation successful!")
        print(f"Period: {data.get('period_start')} to {data.get('period_end')}")
        print(f"Total hours: {data.get('total_hours')}")
        print(f"Daily totals: {len(data.get('daily_totals', []))} days")
        print(f"Project totals: {len(data.get('project_totals', []))} projects")
    else:
        print("❌ Weekly dashboard aggregation failed!")


def test_custom_dashboard(access_token: str):
    """Test custom date range dashboard aggregation endpoint."""
    print("\nTesting custom dashboard aggregation...")

    # Test with last 7 days
    end_date = date.today()
    start_date = end_date - timedelta(days=6)

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

    response = requests.get(
        f"{BASE_URL}/time-entries/dashboard",
        headers=headers,
        params=params
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Custom dashboard aggregation successful!")
        print(f"Period: {data.get('period_start')} to {data.get('period_end')}")
        print(f"Total hours: {data.get('total_hours')}")
        print(f"Daily totals: {len(data.get('daily_totals', []))} days")
        print(f"Project totals: {len(data.get('project_totals', []))} projects")
    else:
        print("❌ Custom dashboard aggregation failed!")


def test_invalid_date_range(access_token: str):
    """Test dashboard with invalid date range."""
    print("\nTesting invalid date range...")

    # Test with start_date > end_date
    start_date = date.today()
    end_date = start_date - timedelta(days=1)

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

    response = requests.get(
        f"{BASE_URL}/time-entries/dashboard",
        headers=headers,
        params=params
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 400:
        print("✅ Invalid date range properly rejected!")
    else:
        print("❌ Invalid date range not properly handled!")


def test_empty_data_handling(access_token: str):
    """Test dashboard with a future date range (should return empty but valid data)."""
    print("\nTesting empty data handling...")

    # Test with future dates (should have no data)
    start_date = date.today() + timedelta(days=30)
    end_date = start_date + timedelta(days=6)

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat()
    }

    response = requests.get(
        f"{BASE_URL}/time-entries/dashboard",
        headers=headers,
        params=params
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        data = response.json()
        print("✅ Empty data handling successful!")
        print(f"Total hours: {data.get('total_hours')} (should be 0)")
        print(f"Daily totals: {len(data.get('daily_totals', []))} days")
        print(f"Project totals: {len(data.get('project_totals', []))} projects")

        # Check that all daily totals have 0 duration
        all_zero = all(day['total_hours'] == 0 for day in data.get('daily_totals', []))
        if all_zero:
            print("✅ All daily totals correctly show zero!")
        else:
            print("❌ Some daily totals are non-zero for future dates!")
    else:
        print("❌ Empty data handling failed!")


def main():
    """Run all dashboard aggregation tests."""
    print("🧪 Testing Zentracker Dashboard Aggregation API")
    print("=" * 60)

    # Get access token
    access_token = get_access_token()
    if not access_token:
        print("❌ Cannot get access token for tests")
        return

    print("✅ Access token obtained")

    # Run tests
    test_weekly_dashboard(access_token)
    test_custom_dashboard(access_token)
    test_invalid_date_range(access_token)
    test_empty_data_handling(access_token)

    print("\n🏁 Dashboard aggregation tests completed!")


if __name__ == "__main__":
    main()