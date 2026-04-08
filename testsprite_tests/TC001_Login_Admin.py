import requests
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/auth/login"
CREDENTIALS = {
    "email": "admin@mxperformance.com.br",
    "password": "Mx#2026!"
}
HEADERS = {
    "Content-Type": "application/json"
}
# List of routes for navigation tests
ROUTES = [
    "/painel",
    "/lojas",
    "/configuracoes",
    "/auditoria",
    "/legacy",
    "/legacy/treinamentos",
    "/legacy/usuarios",
    "/legacy/settings",
    "/legacy/analytics",
    "/legacy/reports",
    "/legacy/notifications",
    "/legacy/membership",
    "/legacy/trainings",
    "/legacy/feedbacks",
    "/legacy/pdis",
    "/legacy/checkins",
    "/legacy/dashboards",
]

def test_login_admin_and_navigate_modules():
    # 1) Verify login via backend API to obtain token (using REST API from PRD)
    token = None
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/v1/token?grant_type=password",
            json={"email": CREDENTIALS["email"], "password": CREDENTIALS["password"]},
            timeout=30
        )
        assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
        data = resp.json()
        assert "access_token" in data, "No access_token found in response"
        token = data["access_token"]
    except Exception as e:
        assert False, f"Login API request failed or invalid response: {e}"

    assert token is not None, "Failed to obtain access token"

    # 2) Use Playwright to login in frontend UI and navigate modules, verifying unique element visibility at each page
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Go to login page
        page.goto(f"{BASE_URL}/auth/login", timeout=30000)
        # Fill login form with credentials
        page.fill("input[name='email']", CREDENTIALS["email"])
        page.fill("input[name='password']", CREDENTIALS["password"])
        # Submit login form
        page.click("button[type='submit']")

        # Wait for navigation after login and verify something from "/painel" as landing default page
        try:
            page.wait_for_url(f"{BASE_URL}/painel", timeout=30000)
        except PlaywrightTimeoutError:
            # If redirect to /painel does not happen, check if URL starts with BASE_URL and contains any route
            current_url = page.url
            assert any(r in current_url for r in ROUTES), f"Post-login URL {current_url} unexpected."

        # Define selectors unique to each module page for validation
        unique_selectors = {
            "/painel": "data-testid=painel-unique-element, text=Dashboard",
            "/lojas": "data-testid=lojas-unique-element, text=Lojas",
            "/configuracoes": "data-testid=configuracoes-unique-element, text=Configurações",
            "/auditoria": "data-testid=auditoria-unique-element, text=Auditoria",
            "/legacy": "data-testid=legacy-dashboard-unique, text=Legacy Dashboard",
            "/legacy/treinamentos": "data-testid=legacy-treinamentos-unique, text=Treinamentos",
            "/legacy/usuarios": "data-testid=legacy-usuarios-unique, text=Usuários",
            "/legacy/settings": "data-testid=legacy-settings-unique, text=Settings",
            "/legacy/analytics": "data-testid=legacy-analytics-unique, text=Analytics",
            "/legacy/reports": "data-testid=legacy-reports-unique, text=Reports",
            "/legacy/notifications": "data-testid=legacy-notifications-unique, text=Notifications",
            "/legacy/membership": "data-testid=legacy-membership-unique, text=Membership",
            "/legacy/trainings": "data-testid=legacy-trainings-unique, text=Trainings",
            "/legacy/feedbacks": "data-testid=legacy-feedbacks-unique, text=Feedbacks",
            "/legacy/pdis": "data-testid=legacy-pdis-unique, text=PDI",
            "/legacy/checkins": "data-testid=legacy-checkins-unique, text=Check-ins",
            "/legacy/dashboards": "data-testid=legacy-dashboards-unique, text=Dashboards",
        }

        # Normalize selectors into dict with either CSS or text selector for Playwright
        # For example, if comma used, split and try both selectors.
        def is_element_visible(selector):
            try:
                # Split by comma to accept multiple options separated by ','
                options = [opt.strip() for opt in selector.split(',')]
                for opt in options:
                    # Check if element is visible for each option
                    if opt.startswith("data-testid="):
                        testid = opt[len("data-testid="):]
                        el = page.query_selector(f"[data-testid='{testid}']")
                        if el and el.is_visible():
                            return True
                    elif opt.startswith("text="):
                        text_val = opt[len("text="):]
                        els = page.locator(f"text={text_val}")
                        if els.count() > 0:
                            for i in range(els.count()):
                                if els.nth(i).is_visible():
                                    return True
                    else:
                        # Generic CSS selector fallback
                        el = page.query_selector(opt)
                        if el and el.is_visible():
                            return True
                return False
            except Exception:
                return False

        # Navigate each route and verify unique element presence and correct page loaded
        visited_routes = 0
        for route in ROUTES:
            target_url = f"{BASE_URL}{route}"
            try:
                page.goto(target_url, timeout=30000)
            except PlaywrightTimeoutError:
                assert False, f"Timeout loading page {target_url}"

            # Wait for network idle or load
            try:
                page.wait_for_load_state("networkidle", timeout=10000)
            except PlaywrightTimeoutError:
                # Proceed even if networkidle not reached but page is loaded at least partially
                pass

            # Determine selector for this path
            selector = None
            # Try exact match first
            if route in unique_selectors:
                selector = unique_selectors[route]
            else:
                # Check if route is prefix of keys in unique_selectors (like /legacy matching)
                for k in unique_selectors.keys():
                    if route.startswith(k):
                        selector = unique_selectors[k]
                        break

            assert selector is not None, f"No selector defined for route {route}"

            visible = is_element_visible(selector)
            assert visible, f"Unique identifying element(s) not visible on {route}"

            visited_routes += 1

        # Verify that all required 35 frontend UI tests routes were visited (minimum from provided routes)
        assert visited_routes >= 15, f"Expected at least 15 module routes tested, got {visited_routes}"

        browser.close()

test_login_admin_and_navigate_modules()