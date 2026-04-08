import requests

def test_verify_notifications_list_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/rest/v1/notifications"
    headers = {}
    timeout = 30

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Optionally check error message or content type if API returns JSON error details
    try:
        json_data = response.json()
        # Could assert error key or message presence if known, but PRD doesn't specify
    except ValueError:
        # Response body is not JSON, so ignore
        pass

test_verify_notifications_list_unauthorized()