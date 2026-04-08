import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

def test_login_gerente_and_navigate_modules():
    base_url = "http://localhost:3000"
    email = "gerente@mxperformance.com.br"
    password = "Mx#2026!"

    modules = [
        ("Painel", "/painel", "css=h1:has-text('Painel')"),
        ("Lojas", "/lojas", "css=h1:has-text('Lojas')"),
        ("Configurações", "/configuracoes", "css=h1:has-text('Configurações')"),
        ("Auditoria", "/auditoria", "css=h1:has-text('Auditoria')"),
        # Assuming some representative legacy routes and unique selectors
        ("Legacy Module 1", "/legacy/module1", "css=h1:has-text('Legacy Module 1')"),
        ("Legacy Module 2", "/legacy/module2", "css=h1:has-text('Legacy Module 2')"),
        ("Legacy Module 3", "/legacy/module3", "css=h1:has-text('Legacy Module 3')"),
        ("Legacy Module 4", "/legacy/module4", "css=h1:has-text('Legacy Module 4')"),
        ("Legacy Module 5", "/legacy/module5", "css=h1:has-text('Legacy Module 5')"),
    ]
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page.goto(f"{base_url}/login", timeout=30000)
            # Wait login form visible
            page.wait_for_selector("input[type='email']", timeout=30000)
            page.fill("input[type='email']", email)
            page.fill("input[type='password']", password)
            page.click("button[type='submit']")

            # Wait for login to complete which usually redirects or page updates
            # Detect some element that confirms login success
            # Try waiting on /painel page or a known element that appears after login
            page.wait_for_url(f"{base_url}/painel", timeout=30000)
            page.wait_for_selector("css=h1:has-text('Painel')", timeout=30000)

            # Verify login succeeded by checking url and some element present
            assert page.url.startswith(f"{base_url}/painel")

            # Now iterate navigation of modules and legacy routes, verify unique elements
            # We must attempt 35 frontend UI tests total in instructions, 
            # but for this testcase only login gerente and navigate modules with checks needed.
            # We'll visit the above modules. To reach 35 tests would be across all testcases, here we do just this one.

            for name, route, selector in modules:
                page.goto(f"{base_url}{route}", timeout=30000)
                try:
                    page.wait_for_selector(selector, timeout=30000)
                except PlaywrightTimeoutError:
                    raise AssertionError(f"Unique element '{selector}' not found in module '{name}' at route '{route}'")
                # Additional slight delay can help stabilizing UI
                time.sleep(0.5)
                # Confirm URL correct
                assert page.url == f"{base_url}{route}"

            context.close()
            browser.close()
    except Exception as e:
        raise e

# Run the test function
test_login_gerente_and_navigate_modules()