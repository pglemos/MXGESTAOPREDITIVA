import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_checkins_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/daily_checkins"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        json_data = None
    # It's typical for 401 error to have error message; if present, check it
    if json_data and isinstance(json_data, dict):
        assert "error" in json_data or "message" in json_data, "Expected error message in response body"

test_verify_checkins_list_unauthorized()