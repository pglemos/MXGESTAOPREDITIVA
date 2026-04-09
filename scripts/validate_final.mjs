import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  
  console.log('Logging in...');
  await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  await page.fill('input[type="password"]', 'Mx#2026!');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for dashboard...');
  await page.waitForURL('**/painel', { timeout: 10000 });
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Wait a bit for data to load
  await page.waitForTimeout(3000);
  
  console.log('Capturing stores and data...');
  const rows = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('tbody tr')).map(tr => {
      return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).join(' | ');
    });
  });
  
  console.log('--- STORES IN DASHBOARD ---');
  rows.forEach(r => console.log(r));
  
  await page.screenshot({ path: '/tmp/final_validation.png', fullPage: true });
  console.log('Screenshot saved to /tmp/final_validation.png');
  
  await browser.close();
})();
