import requests

def test_verify_stores_list_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/rest/v1/stores"
    headers = {
        "Accept": "application/json",
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"

test_verify_stores_list_unauthorized()