import requests

def test_verify_meta_rules_list_unauthorized():
    base_url = "http://localhost:3000"
    endpoint = "/rest/v1/store_meta_rules"
    url = base_url + endpoint
    headers = {}  # No Authorization header for unauthorized test
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    # Optionally check response body for a typical unauthorized message or structure
    try:
        json_body = response.json()
        # Typical structure might be an error message or detail field
        assert any(k in json_body for k in ["error", "message", "detail"]), "Response JSON missing error message"
    except ValueError:
        # If not valid JSON, still pass since main assertion is status code
        pass

test_verify_meta_rules_list_unauthorized()