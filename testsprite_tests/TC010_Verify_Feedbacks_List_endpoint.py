import requests

BASE_URL = "http://localhost:3000"
AUTH_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
FEEDBACKS_URL = f"{BASE_URL}/rest/v1/feedbacks"
USERNAME = "admin@mxperformance.com.br"
PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_TC010_verify_feedbacks_list_endpoint():
    try:
        # Authenticate to get access token
        auth_response = requests.post(
            AUTH_URL,
            data={"email": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=TIMEOUT
        )
        assert auth_response.status_code == 200, f"Auth failed: {auth_response.text}"
        auth_data = auth_response.json()
        access_token = auth_data.get("access_token")
        assert access_token, "No access_token in auth response"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Perform GET on /rest/v1/feedbacks
        response = requests.get(FEEDBACKS_URL, headers=headers, timeout=TIMEOUT)

        # Validate response status code
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"

        # Validate response body is JSON array (list)
        feedbacks = response.json()
        assert isinstance(feedbacks, list), "Response payload is not a list"

        # Optionally validate the structure of at least one feedback entry if exists
        if feedbacks:
            first = feedbacks[0]
            assert isinstance(first, dict), "Feedback item is not an object"
            # Basic RLS validation might be role based, so check keys exist to confirm likely structure
            # As no precise schema is given for feedback, check for common keys
            required_keys = ["id", "created_at", "seller_user_id"]
            for key in required_keys:
                assert key in first, f"Key '{key}' missing from feedback item"

    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Test case TC010 failed: {e}")

test_TC010_verify_feedbacks_list_endpoint()
