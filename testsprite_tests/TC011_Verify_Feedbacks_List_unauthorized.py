import requests

def test_verify_feedbacks_list_unauthorized():
    base_url = "http://localhost:3000"
    url = f"{base_url}/rest/v1/feedbacks"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"

test_verify_feedbacks_list_unauthorized()