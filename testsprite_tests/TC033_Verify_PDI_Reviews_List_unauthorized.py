import requests

BASE_URL = "http://localhost:3000"

def test_tc033_verify_pdi_reviews_list_unauthorized():
    url = f"{BASE_URL}/rest/v1/pdi_reviews"
    headers = {
        # No Authorization header to simulate unauthorized access
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"
        # Optionally check response content for error message presence
        json_response = response.json()
        assert "error" in json_response or "message" in json_response, "Response does not contain error details"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_tc033_verify_pdi_reviews_list_unauthorized()