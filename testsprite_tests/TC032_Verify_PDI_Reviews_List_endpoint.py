import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
PDI_REVIEWS_URL = f"{BASE_URL}/rest/v1/pdi_reviews"
EMAIL = "admin@mxperformance.com.br"
PASSWORD = "Mx#2026!"
TIMEOUT = 30


def test_tc032_verify_pdi_reviews_list_endpoint():
    # Step 1: Authenticate to get Bearer token
    auth_payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    try:
        auth_response = requests.post(AUTH_URL, json=auth_payload, timeout=TIMEOUT)
        auth_response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Authentication request failed: {e}"
    auth_json = auth_response.json()
    access_token = auth_json.get("access_token")
    assert access_token, "No access_token received from auth"

    # Step 2: Perform GET on /rest/v1/pdi_reviews with authorization
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    try:
        response = requests.get(PDI_REVIEWS_URL, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"GET /rest/v1/pdi_reviews request failed: {e}"

    # Step 3: Validate response status code and content-type
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type, f"Expected JSON response, got {content_type}"

    # Step 4: Validate the response body is a JSON array (list)
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(data, list), f"Expected response to be a list, got {type(data)}"

    # Optionally, check if the list has dict entries with expected keys (since schema is not detailed)
    if data:
        assert isinstance(data[0], dict), f"Expected items in list to be dict, got {type(data[0])}"

    print("TC032: Verify PDI Reviews List endpoint passed.")


test_tc032_verify_pdi_reviews_list_endpoint()
