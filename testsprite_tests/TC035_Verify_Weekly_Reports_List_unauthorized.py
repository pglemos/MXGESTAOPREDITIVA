import requests

BASE_URL = "http://localhost:3000"

def test_TC035_verify_weekly_reports_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/weekly_feedback_reports"
    headers = {
        # Intentionally no Authorization header to simulate unauthorized access
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

test_TC035_verify_weekly_reports_list_unauthorized()