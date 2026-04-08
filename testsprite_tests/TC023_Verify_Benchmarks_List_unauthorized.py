import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_verify_benchmarks_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/store_benchmarks"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401 Unauthorized, got {response.status_code}"

test_verify_benchmarks_list_unauthorized()