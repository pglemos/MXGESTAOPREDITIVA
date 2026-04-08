import requests

BASE_URL = "http://localhost:3000"
ADMIN_USERNAME = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_tc034_verify_weekly_reports_list_endpoint():
    try:
        # Step 1: Authenticate admin user to obtain access token
        auth_url = f"{BASE_URL}/auth/v1/token?grant_type=password"
        auth_payload = {"email": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        auth_response = requests.post(auth_url, json=auth_payload, timeout=TIMEOUT)
        assert auth_response.status_code == 200, f"Auth failed with status {auth_response.status_code}"
        auth_json = auth_response.json()
        access_token = auth_json.get("access_token")
        assert access_token, "No access_token received"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Step 2: Perform GET on /rest/v1/weekly_feedback_reports with bearer token
        reports_url = f"{BASE_URL}/rest/v1/weekly_feedback_reports"
        reports_response = requests.get(reports_url, headers=headers, timeout=TIMEOUT)
        assert reports_response.status_code == 200, f"Expected 200 OK but got {reports_response.status_code}"

        # Validate response content is a list (RLS verified by API)
        reports_json = reports_response.json()
        assert isinstance(reports_json, list), "Response is not a list"
        # Optionally, for non-empty response, check a sample structure if present
        if reports_json:
            first_report = reports_json[0]
            assert isinstance(first_report, dict), "Report item is not an object"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_tc034_verify_weekly_reports_list_endpoint()
