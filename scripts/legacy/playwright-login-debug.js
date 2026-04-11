const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  page.on('requestfailed', request =>
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText)
  );

  console.log('Navigating to login...');
  await page.goto('http://127.0.0.1:3000/login');
  
  console.log('Typing credentials...');
  await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  console.log('Waiting up to 15 seconds to see what happens...');
  await page.waitForTimeout(15000);
  
  const url = page.url();
  console.log('FINAL URL:', url);
  
  await browser.close();
})();
