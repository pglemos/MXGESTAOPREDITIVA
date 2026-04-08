import requests

def test_verify_sellers_list_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/rest/v1/store_sellers"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected status 401 Unauthorized, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_verify_sellers_list_unauthorized()