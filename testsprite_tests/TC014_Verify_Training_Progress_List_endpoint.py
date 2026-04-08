import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
TRAINING_PROGRESS_URL = f"{BASE_URL}/rest/v1/training_progress"
TIMEOUT = 30

ADMIN_USERNAME = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"

def test_verify_training_progress_list_admin():
    # Step 1: Authenticate as admin to get access token
    try:
        auth_response = requests.post(
            AUTH_URL,
            data={"email": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT
        )
        auth_response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Authentication request failed: {e}"
    auth_data = auth_response.json()
    access_token = auth_data.get("access_token")
    assert access_token, "Authentication succeeded but no access_token returned"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Step 2: GET /rest/v1/training_progress as admin
    try:
        response = requests.get(
            TRAINING_PROGRESS_URL,
            headers=headers,
            timeout=TIMEOUT
        )
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"GET training_progress request failed: {e}"

    # Step 3: Validate response status code and content
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    json_data = response.json()
    assert isinstance(json_data, list), "Expected JSON response to be a list"
    # Additional RLS or role-based content validation could be here if specification provided

test_verify_training_progress_list_admin()