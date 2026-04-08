import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
SELLERS_URL = f"{BASE_URL}/rest/v1/store_sellers"
TIMEOUT = 30

ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"

def test_verify_sellers_list_endpoint():
    try:
        # Step 1: Obtain access token by login
        auth_response = requests.post(
            AUTH_URL,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=TIMEOUT
        )
        assert auth_response.status_code == 200, f"Auth failed with status {auth_response.status_code}"
        auth_json = auth_response.json()
        assert "access_token" in auth_json, "access_token missing in auth response"
        access_token = auth_json["access_token"]

        # Step 2: Perform GET on /rest/v1/store_sellers with token
        headers = {"Authorization": f"Bearer {access_token}"}
        sellers_response = requests.get(SELLERS_URL, headers=headers, timeout=TIMEOUT)

        # Step 3: Validate response
        assert sellers_response.status_code == 200, f"Expected 200 OK, got {sellers_response.status_code}"
        sellers_list = sellers_response.json()
        assert isinstance(sellers_list, list), "Response is not a list"

        # Check presence of keys typical to sellers: id (or user_id), name (or seller_name), and store_id
        if sellers_list:
            for seller in sellers_list:
                assert isinstance(seller, dict), "Seller entry is not a dict"
                assert "id" in seller or "user_id" in seller, "Seller id/user_id key missing"
                assert "name" in seller or "seller_name" in seller, "Seller name key missing"
                assert "store_id" in seller, "store_id key missing"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_verify_sellers_list_endpoint()