import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
BENCHMARKS_URL = f"{BASE_URL}/rest/v1/store_benchmarks"
USERNAME = "admin@mxperformance.com.br"
PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_TC022_verify_benchmarks_list_endpoint():
    token = None
    try:
        # Authenticate to get access_token
        auth_payload = {
            "email": USERNAME,
            "password": PASSWORD
        }
        auth_headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        auth_resp = requests.post(AUTH_URL, data=auth_payload, headers=auth_headers, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Authentication failed: {auth_resp.text}"
        auth_data = auth_resp.json()
        assert "access_token" in auth_data, "No access_token in auth response"
        token = auth_data["access_token"]

        # Use token to GET /rest/v1/store_benchmarks
        headers = {
            "Authorization": f"Bearer {token}"
        }
        resp = requests.get(BENCHMARKS_URL, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Unexpected status code: {resp.status_code}, response: {resp.text}"

        data = resp.json()
        assert isinstance(data, list), "Response is not a list"
        # Optionally check fields if list not empty
        if data:
            sample = data[0]
            # Check presence of expected benchmark keys
            expected_keys = {"store_id", "lead_to_agend", "agend_to_visit", "visit_to_sale"}
            assert expected_keys.issubset(sample.keys()), f"Benchmark fields missing in response item: {sample.keys()}"

    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"


test_TC022_verify_benchmarks_list_endpoint()
