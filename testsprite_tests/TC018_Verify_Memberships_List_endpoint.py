import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
MEMBERSHIPS_ENDPOINT = f"{BASE_URL}/rest/v1/memberships"

ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"

def test_TC018_verify_memberships_list_endpoint():
    # Authenticate as Admin to get access token
    try:
        auth_resp = requests.post(
            AUTH_URL,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        assert auth_resp.status_code == 200, f"Authentication failed: {auth_resp.status_code} {auth_resp.text}"
        auth_data = auth_resp.json()
        access_token = auth_data.get("access_token")
        assert access_token, "No access_token received in authentication response"
    except Exception as e:
        raise AssertionError(f"Failed to authenticate admin user: {e}")

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Perform GET on /rest/v1/memberships
    try:
        resp = requests.get(MEMBERSHIPS_ENDPOINT, headers=headers, timeout=30)
    except Exception as e:
        raise AssertionError(f"GET request to memberships endpoint failed: {e}")

    # Validate response status
    assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}: {resp.text}"

    # Validate response body structure and role-based access logic
    try:
        memberships = resp.json()
        assert isinstance(memberships, list), "Response is not a JSON list"
        # For an admin user, expect at least one membership with role related to admin
        assert any(
            "admin" in (m.get("role") or "").lower() or "admin" in (str(m.get("roles") or "")).lower()
            for m in memberships
        ), "No membership with admin role found in response"
    except Exception as e:
        raise AssertionError(f"Response JSON validation failed: {e}")


test_TC018_verify_memberships_list_endpoint()
