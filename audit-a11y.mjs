import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');

  console.log('Filling login form...');
  await page.fill('input[type="email"]', 'jose.roberto@mxperformance.com.br');
  await page.fill('input[type="password"]', 'R5K2B4AZ');
  
  console.log('Clicking login button...');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/painel', { timeout: 10000 });

  console.log('Running Global Page Checks...');
  const globalChecks = await page.evaluate(() => ({
    lang: document.documentElement.lang || 'MISSING - Screen readers need this for pronunciation',
    title: document.title || 'MISSING - Required for context',
    viewport: document.querySelector('meta[name="viewport"]')?.content || 'MISSING - Check for user-scalable=no (bad practice)',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Enabled' : 'Disabled',
  }));
  console.log('Global Checks Result:', JSON.stringify(globalChecks, null, 2));

  console.log('Finding Orphaned Form Inputs...');
  const orphanedInputs = await page.evaluate(() => 
    Array.from(document.querySelectorAll('input, select, textarea'))
      .filter(i => {
        const hasId = i.id && document.querySelector(`label[for="${i.id}"]`);
        const hasAria = i.getAttribute('aria-label') || i.getAttribute('aria-labelledby');
        return !hasId && !hasAria && !i.closest('label');
      })
      .map(i => ({
        tag: i.tagName,
        id: i.id,
        name: i.name,
        placeholder: i.placeholder,
      }))
  );
  console.log('Orphaned Inputs:', JSON.stringify(orphanedInputs, null, 2));

  await browser.close();
})();
