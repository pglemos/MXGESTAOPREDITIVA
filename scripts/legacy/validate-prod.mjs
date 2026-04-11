import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const url = 'https://mxperformance.vercel.app/login';
  console.log(`Navigating to ${url}...`);
  await page.goto(url);

  console.log('Logging in...');
  await page.fill('input[type="email"]', 'jose.roberto@mxperformance.com.br');
  await page.fill('input[type="password"]', 'R5K2B4AZ');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/painel', { timeout: 15000 });
  console.log('Login successful.');

  // Test Hover Tooltip Z-index
  const firstButton = page.locator('button[aria-label^="Abrir módulo"]').first();
  await firstButton.hover();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'PROVA-TOOLTIP-ZINDEX.png' });
  console.log('Tooltip screenshot taken.');

  // Test Click Drawer Fixed position & Scroll
  await firstButton.click();
  await page.waitForTimeout(500);
  
  // Check computed styles of drawer
  const drawerStyles = await page.locator('#drawer-navigation').evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      position: style.position,
      top: style.top,
      left: style.left,
      height: style.height,
      zIndex: style.zIndex
    };
  });
  console.log('Drawer Production Styles:', drawerStyles);

  // Scroll and take screenshot
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'PROVA-DRAWER-FIXED-SCROLL.png' });
  console.log('Scroll validation screenshot taken.');

  await browser.close();
})();
