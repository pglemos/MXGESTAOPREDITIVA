import requests

BASE_URL = "http://localhost:3000"


def test_TC021_verify_reprocessing_logs_unauthorized():
    url = f"{BASE_URL}/rest/v1/reprocessing_logs"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401 Unauthorized, got {response.status_code}"


test_TC021_verify_reprocessing_logs_unauthorized()