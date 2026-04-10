import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');

  console.log('Filling login form...');
  await page.fill('input[type="email"]', 'jose.roberto@mxperformance.com.br');
  await page.fill('input[type="password"]', 'R5K2B4AZ');
  
  console.log('Clicking login button...');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/painel', { timeout: 10000 });

  const firstCategoryButton = page.locator('button[aria-label^="Abrir módulo"]').first();
  await firstCategoryButton.click();
  await page.waitForTimeout(1000);

  console.log('Inspecting drawer...');
  const drawer = page.locator('#drawer-navigation');
  const boundingBox = await drawer.boundingBox();
  console.log('Drawer Bounding Box:', boundingBox);

  const computedStyles = await drawer.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      left: style.left,
      position: style.position,
      zIndex: style.zIndex,
      width: style.width
    };
  });
  console.log('Drawer Computed Styles:', computedStyles);

  const aside = page.locator('aside').first();
  const asideBox = await aside.boundingBox();
  console.log('Aside Bounding Box:', asideBox);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'sidebar-verify.png', fullPage: true });

  await browser.close();
  console.log('Done.');
})();
