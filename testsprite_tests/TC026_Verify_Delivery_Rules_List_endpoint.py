import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/auth/v1/token?grant_type=password"
DELIVERY_RULES_URL = f"{BASE_URL}/rest/v1/store_delivery_rules"
ADMIN_EMAIL = "admin@mxperformance.com.br"
ADMIN_PASSWORD = "Mx#2026!"
TIMEOUT = 30

def test_TC026_verify_delivery_rules_list_endpoint():
    try:
        # Step 1: Authenticate to get Bearer token
        auth_response = requests.post(
            LOGIN_URL,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=TIMEOUT
        )
        assert auth_response.status_code == 200, f"Login failed: {auth_response.text}"
        token_data = auth_response.json()
        access_token = token_data.get("access_token")
        assert access_token, "No access_token found in login response"

        headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Step 2: Perform GET on /rest/v1/store_delivery_rules
        delivery_response = requests.get(
            DELIVERY_RULES_URL,
            headers=headers,
            timeout=TIMEOUT
        )
        assert delivery_response.status_code == 200, f"Expected 200 OK but got {delivery_response.status_code}: {delivery_response.text}"
        
        delivery_data = delivery_response.json()
        # Validate response structure: expecting a list (possibly empty) of delivery rules with keys like matinal_recipients and whatsapp_group_ref
        assert isinstance(delivery_data, list), "Response is not a list"
        for item in delivery_data:
            # Each item should be a dict including keys related to delivery rules as per the PRD
            assert isinstance(item, dict), "Delivery rule item is not a dict"
            # Typical keys from PRD for delivery rules: matinal_recipients, whatsapp_group_ref maybe others
            assert "matinal_recipients" in item or "whatsapp_group_ref" in item, "Expected keys missing in delivery rule item"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_TC026_verify_delivery_rules_list_endpoint()