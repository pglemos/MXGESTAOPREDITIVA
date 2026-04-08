import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_tc015_verify_training_progress_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/training_progress"
    headers = {
        # No Authorization header included
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Expect 401 Unauthorized
    assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"

test_tc015_verify_training_progress_list_unauthorized()