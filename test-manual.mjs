import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false }); // Wait, running headless false on a remote might fail or stay open
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[ERROR] ${err.message}`));

  try {
      await page.goto('http://127.0.0.1:3000/login');
      await page.fill('input[type="email"]', 'admin@mxgestaopreditiva.com.br');
      await page.fill('input[type="password"]', 'Jose20161@');
      await page.click('button[type="submit"]');
      
      // Wait to see if it redirects
      await page.waitForTimeout(5000);
      
      console.log('Final URL:', page.url());
      
      console.log('--- Logs ---');
      console.log(consoleLogs.join('\n'));
      
      const content = await page.content();
      if (content.includes('Dashboard Global')) {
          console.log('SUCCESS: "Dashboard Global" found in DOM');
      } else if (content.includes('MX Gestão Preditiva')) {
          console.log('STILL ON LOGIN. HTML snippet:');
          console.log(content.substring(0, 500));
      } else {
          console.log('UNKNOWN STATE');
      }
  } catch (e) {
      console.error('Playwright exception:', e);
  } finally {
      await browser.close();
  }
})();
