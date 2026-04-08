import requests

BASE_URL = "http://localhost:3000"

def test_TC031_verify_trainings_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/trainings"
    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Optionally check response body for unauthorized info
    # Usually response JSON may have {"code": "...", "message": "..."}
    try:
        json_resp = response.json()
        assert 'error' in json_resp or 'message' in json_resp or 'code' in json_resp, f"Response JSON missing error info: {json_resp}"
    except ValueError:
        # Not a JSON response, acceptable but warn
        pass

test_TC031_verify_trainings_list_unauthorized()