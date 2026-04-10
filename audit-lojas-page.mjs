import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://mxperformance.vercel.app';
const AUDIT_URL = `${BASE_URL}/lojas`;

(async () => {
  console.log(`🧪 Auditing Page: ${AUDIT_URL}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const results = {
    url: AUDIT_URL,
    timestamp: new Date().toISOString(),
    pageStatus: null,
    consoleErrors: [],
    pageErrors: [],
    networkFailures: [],
    elementsFound: {},
    screenshot: 'audit-lojas.png'
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  page.on('pageerror', err => {
    results.pageErrors.push(err.message);
  });

  page.on('requestfailed', req => {
    results.networkFailures.push({
      url: req.url(),
      error: req.failure().errorText
    });
  });

  try {
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Jose20161@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/painel', { timeout: 15000 });
    console.log('✅ Login successful.');

    console.log(`🚀 Navigating to ${AUDIT_URL}...`);
    const response = await page.goto(AUDIT_URL, { waitUntil: 'networkidle' });
    results.pageStatus = response.status();
    console.log(`✅ Status: ${results.pageStatus}`);

    // Check for key elements
    const storesList = page.locator('table, .grid, .list-container');
    results.elementsFound.storesContainer = await storesList.count() > 0;
    
    const storeItems = page.locator('tr, .store-card, [role="row"]');
    results.elementsFound.storeItemsCount = await storeItems.count();

    const addStoreBtn = page.locator('button:has-text("Nova Loja"), button:has-text("Adicionar")');
    results.elementsFound.hasAddButton = await addStoreBtn.count() > 0;

    // Check for common error patterns in HTML
    const content = await page.content();
    results.hasErrorBoundary = content.includes('Something went wrong') || 
                               content.includes('An unexpected error occurred') ||
                               content.includes('Erro ao carregar');

    // Take screenshot
    await page.screenshot({ path: 'audit-lojas.png', fullPage: true });
    console.log('📸 Screenshot saved to audit-lojas.png');

    // Extract some data to verify if it's empty
    if (results.elementsFound.storeItemsCount === 0) {
        console.log('⚠️ No store items found on the page.');
    } else {
        console.log(`📊 Found ${results.elementsFound.storeItemsCount} potential store items.`);
    }

  } catch (error) {
    console.error(`❌ Audit failed: ${error.message}`);
    results.fatalError = error.message;
  } finally {
    fs.writeFileSync('audit-lojas-results.json', JSON.stringify(results, null, 2));
    console.log('📄 Detailed results saved to audit-lojas-results.json');
    await browser.close();
  }
})();
