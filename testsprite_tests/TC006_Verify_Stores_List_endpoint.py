import requests

BASE_URL = "http://localhost:3000"
USERNAME = "admin@mxperformance.com.br"
PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_TC006_verify_stores_list_endpoint():
    # Step 1: Authenticate to get access token
    try:
        auth_response = requests.post(
            f"{BASE_URL}/auth/v1/token?grant_type=password",
            json={"email": USERNAME, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert auth_response.status_code == 200, f"Authentication failed with status {auth_response.status_code}"
        auth_json = auth_response.json()
        assert "access_token" in auth_json, "access_token missing in authentication response"
        access_token = auth_json["access_token"]
    except requests.RequestException as e:
        assert False, f"Exception during authentication request: {e}"

    # Step 2: GET /rest/v1/stores with Authorization Bearer token
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    try:
        stores_response = requests.get(
            f"{BASE_URL}/rest/v1/stores",
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Exception during GET stores request: {e}"

    # Step 3: Validate response
    assert stores_response.status_code == 200, f"Expected 200 OK, got {stores_response.status_code}"
    try:
        stores_list = stores_response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that response is a list (array)
    assert isinstance(stores_list, list), f"Expected response to be a list, got {type(stores_list)}"

    # Optional: Validate fields of stores if present
    # We expect each store to be dict and contain at least id or name fields (based on common store attributes)
    if len(stores_list) > 0:
        first_store = stores_list[0]
        assert isinstance(first_store, dict), "Each item in stores list should be a dict"
        # If known store attributes from PRD are present, verify some keys (e.g., id, name)
        assert any(key in first_store for key in ["id", "store_id", "name", "store_name"]), "Store object missing expected keys"

test_TC006_verify_stores_list_endpoint()
