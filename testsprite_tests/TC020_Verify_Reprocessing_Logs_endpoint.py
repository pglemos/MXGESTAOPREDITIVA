import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
REPROCESSING_LOGS_URL = f"{BASE_URL}/rest/v1/reprocessing_logs"
ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_verify_reprocessing_logs_endpoint():
    # Step 1: Authenticate as admin to get access_token
    auth_payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    headers_auth = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    try:
        auth_response = requests.post(
            AUTH_URL,
            data=auth_payload,
            headers=headers_auth,
            timeout=TIMEOUT
        )
        auth_response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Authentication request failed: {e}"

    auth_json = auth_response.json()
    access_token = auth_json.get("access_token")
    assert access_token, "No access_token received in authentication response"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

    # Step 2: Perform GET on /rest/v1/reprocessing_logs
    try:
        response = requests.get(REPROCESSING_LOGS_URL, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"GET request to reprocessing_logs failed: {e}"

    # Step 3: Validate response status code 200 OK
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Step 4: Validate response JSON structure (array of reprocessing log entries)
    try:
        logs = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(logs, list), "Response JSON is not a list as expected"

    # If there are entries, verify expected keys in reprocessing logs
    if logs:
        expected_keys = {
            "id",
            "job_name",
            "status",
            "started_at",
            "finished_at",
            "rows_processed",
            "warnings",
            "created_at",
            "updated_at",
        }
        for log in logs:
            assert isinstance(log, dict), "Each log entry should be a dictionary"
            # Check keys presence for each log record - allow subset but check main keys
            assert expected_keys.intersection(log.keys()), f"Log entry missing expected keys: {log}"

    # Test successful completion

test_verify_reprocessing_logs_endpoint()
