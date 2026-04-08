import requests

BASE_URL = "http://localhost:3000"
ADMIN_USERNAME = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"
TIMEOUT = 30


def test_tc008_verify_checkins_list_endpoint():
    token_url = f"{BASE_URL}/auth/v1/token?grant_type=password"
    checkins_url = f"{BASE_URL}/rest/v1/daily_checkins"

    # Obtain access token
    auth_payload = {"email": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    try:
        # Use form data, not JSON
        auth_response = requests.post(token_url, data=auth_payload, timeout=TIMEOUT)
        assert auth_response.status_code == 200, f"Login failed: {auth_response.text}"
        tokens = auth_response.json()
        access_token = tokens.get("access_token")
        assert access_token, "No access_token in login response"

        headers = {"Authorization": f"Bearer {access_token}"}

        # Perform GET on daily_checkins endpoint
        response = requests.get(checkins_url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        data = response.json()

        # For Admin, verify RLS by checking response is a list/array
        assert isinstance(data, list), "Response should be a list of checkins"

        # Optionally check data content structure if present
        if data:
            checkin = data[0]
            # Common fields based on domain knowledge
            expected_fields = {"id", "reference_date", "submitted_at", "seller_user_id"}
            assert expected_fields.issubset(checkin.keys()), f"Missing expected fields in checkin: {checkin.keys()}"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_tc008_verify_checkins_list_endpoint()
