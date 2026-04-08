import requests

def test_TC019_verify_memberships_list_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/rest/v1/memberships"
    headers = {}  # No Authorization header to simulate unauthorized access
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_TC019_verify_memberships_list_unauthorized()