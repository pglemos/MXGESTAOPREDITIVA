import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
PDIS_URL = f"{BASE_URL}/rest/v1/pdis"
TIMEOUT = 30

def test_TC012_verify_pdis_list_endpoint():
    # Login to get access token
    credentials = {
        "username": "admin@mxperformance.com.br",
        "password": "Mx#2026!"
    }
    try:
        login_response = requests.post(
            LOGIN_URL,
            json={"email": credentials["username"], "password": credentials["password"]},
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"

    token_data = login_response.json()
    access_token = token_data.get("access_token")
    assert access_token, "Access token missing in login response"

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Perform GET on /rest/v1/pdis
    try:
        response = requests.get(PDIS_URL, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"GET /rest/v1/pdis request failed: {e}"

    # Validate response
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"

    try:
        pdis_list = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(pdis_list, list), "Response JSON is not a list"

    # Optionally check elements have expected keys if any PDI exists
    if pdis_list:
        pdi = pdis_list[0]
        # Based on typical PDI records, check for some expected keys presence
        expected_keys = ["id", "seller_user_id", "goal", "actions", "review_date"]
        missing_keys = [k for k in expected_keys if k not in pdi]
        assert not missing_keys, f"Missing expected keys in PDI item: {missing_keys}"

test_TC012_verify_pdis_list_endpoint()