import requests

def test_auth_user_details():
    base_url = "http://localhost:3000"
    login_url = f"{base_url}/auth/v1/token?grant_type=password"
    user_url = f"{base_url}/auth/v1/user"
    credentials = {
        "email": "admin@mxperformance.com.br",
        "password": "Mx#2026!"
    }
    timeout = 30

    # Step 1: Obtain access token via login
    try:
        login_response = requests.post(
            login_url,
            json={"email": credentials["email"], "password": credentials["password"]},
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"

    assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
    try:
        login_data = login_response.json()
    except ValueError:
        assert False, "Login response is not valid JSON"

    access_token = login_data.get("access_token")
    assert access_token, "access_token not found in login response"

    # Step 2: Use access token to get authenticated user details
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        user_response = requests.get(user_url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Get user request failed: {e}"

    assert user_response.status_code == 200, f"Get user failed with status code {user_response.status_code}"
    try:
        user_data = user_response.json()
    except ValueError:
        assert False, "User response is not valid JSON"

    # Validate essential user profile fields are returned (e.g., email and roles)
    assert isinstance(user_data, dict), "User data is not a JSON object"
    assert user_data.get("email") == credentials["email"], "Returned user email does not match login email"
    assert "roles" in user_data, "User roles field is missing in user profile"
    assert isinstance(user_data["roles"], list), "User roles field should be a list"

test_auth_user_details()