import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[ERROR] ${err.message}`));

  try {
    await page.goto('http://127.0.0.1:3000/login');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Jose20161@');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(8000);

    console.log('Final URL:', page.url());

    console.log('--- Logs ---');
    console.log(consoleLogs.join('\n'));

    const bodyHTML = await page.innerHTML('body');
    console.log('BODY HTML LENGTH:', bodyHTML.length);
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
