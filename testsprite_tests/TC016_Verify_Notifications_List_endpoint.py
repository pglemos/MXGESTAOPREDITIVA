import requests

BASE_URL = "http://localhost:3000"
AUTH_TOKEN_ENDPOINT = "/auth/v1/token?grant_type=password"
NOTIFICATIONS_ENDPOINT = "/rest/v1/notifications"

USERNAME = "admin@mxperformance.com.br"
PASSWORD = "Mx#2026!"

def test_TC016_verify_notifications_list_endpoint():
    # Obtain bearer token for admin user
    auth_url = BASE_URL + AUTH_TOKEN_ENDPOINT
    auth_payload = {
        "email": USERNAME,
        "password": PASSWORD
    }
    try:
        # Send form-encoded data instead of JSON
        resp_auth = requests.post(auth_url, data=auth_payload, timeout=30)
        assert resp_auth.status_code == 200, f"Auth failed with status {resp_auth.status_code}"
        auth_data = resp_auth.json()
        access_token = auth_data.get("access_token")
        assert access_token, "Access token not found in auth response"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        notifications_url = BASE_URL + NOTIFICATIONS_ENDPOINT
        resp = requests.get(notifications_url, headers=headers, timeout=30)
        assert resp.status_code == 200, f"Expected 200 OK for notifications list, got {resp.status_code}"

        notifications = resp.json()
        assert isinstance(notifications, list), "Notifications response is not a list"

        for notification in notifications:
            assert isinstance(notification, dict), "Notification item is not an object"
            # PRD does not specify notification field names, so only ensure dict type

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_TC016_verify_notifications_list_endpoint()
