import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
      console.error(`[BROWSER ERROR] ${err.message}`);
  });

  try {
      console.log('Navigating to login...');
      await page.goto('http://127.0.0.1:3000/login');
      
      console.log('Filling form...');
      await page.fill('input[type="email"]', 'admin@autogestao.com.br');
      await page.fill('input[type="password"]', 'Jose20161@');
      
      console.log('Clicking submit...');
      await page.click('button[type="submit"]');
      
      console.log('Waiting for URL change or timeout...');
      await page.waitForTimeout(10000); // Wait 10 seconds to observe
      
      console.log('Final URL:', page.url());
      const html = await page.content();
      console.log('Found spinner?', html.includes('animate-spin'));
      console.log('Found h-screen spinner?', html.includes('h-screen flex items-center'));
      console.log('Found btn spinner?', html.includes('w-5 h-5 border-2'));
  } catch (e) {
      console.error(e);
  } finally {
      await browser.close();
  }
})();
