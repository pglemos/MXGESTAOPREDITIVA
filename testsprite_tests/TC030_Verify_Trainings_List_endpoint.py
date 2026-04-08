import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
TRAININGS_URL = f"{BASE_URL}/rest/v1/trainings"
ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"

def test_verify_trainings_list_endpoint():
    try:
        # Step 1: Authenticate and get access token
        login_payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=30)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"

        token_data = login_response.json()
        access_token = token_data.get("access_token")
        assert access_token, "Access token not found in login response"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Step 2: Perform GET on /rest/v1/trainings endpoint
        trainings_response = requests.get(TRAININGS_URL, headers=headers, timeout=30)
        assert trainings_response.status_code == 200, f"Trainings list failed with status {trainings_response.status_code}"

        trainings_data = trainings_response.json()
        assert isinstance(trainings_data, list), "Trainings response is not a list"

        # Optionally additional checks: each training entry has expected fields
        for training in trainings_data:
            assert isinstance(training, dict), "Training item is not a dict"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_verify_trainings_list_endpoint()
