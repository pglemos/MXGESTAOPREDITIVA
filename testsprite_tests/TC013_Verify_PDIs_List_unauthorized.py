import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_TC013_verify_pdis_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/pdis"
    headers = {
        'Accept': 'application/json'
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_TC013_verify_pdis_list_unauthorized()
