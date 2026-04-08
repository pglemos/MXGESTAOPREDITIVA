import requests

def test_verify_delivery_rules_list_unauthorized():
    base_url = "http://localhost:3000"
    endpoint = "/rest/v1/store_delivery_rules"
    url = base_url + endpoint
    headers = {}  # No Authorization header to simulate unauthorized
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    
    assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"
    
test_verify_delivery_rules_list_unauthorized()