import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
META_RULES_URL = f"{BASE_URL}/rest/v1/store_meta_rules"
ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"


def test_TC024_verify_meta_rules_list_endpoint():
    timeout = 30
    # Authenticate as admin to get access token
    auth_payload = {"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    try:
        auth_resp = requests.post(
            AUTH_URL,
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=timeout,
        )
        assert auth_resp.status_code == 200, f"Auth failed with status {auth_resp.status_code}"
        auth_data = auth_resp.json()
        access_token = auth_data.get("access_token")
        assert access_token, "No access_token in auth response"
    except requests.RequestException as e:
        raise AssertionError(f"Authentication request failed: {e}")

    headers = {"Authorization": f"Bearer {access_token}"}

    # Perform GET on /rest/v1/store_meta_rules
    try:
        resp = requests.get(META_RULES_URL, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        raise AssertionError(f"GET request to store_meta_rules failed: {e}")

    # Validate response
    assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}"

    try:
        data = resp.json()
        assert isinstance(data, list), "Response JSON is not a list"
        # Optionally validate structure of meta rules if list not empty
        if data:
            item = data[0]
            # Check for expected keys, example keys based on PRD (e.g. monthly_goal, include_venda_loja_in_store_total)
            expected_keys = ["monthly_goal", "include_venda_loja_in_store_total"]
            for key in expected_keys:
                assert key in item, f"Key '{key}' missing in meta rule item"
    except ValueError:
        raise AssertionError("Response content is not valid JSON")


test_TC024_verify_meta_rules_list_endpoint()