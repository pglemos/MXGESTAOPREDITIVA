const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Realizando login para auditoria...');
  await page.goto('https://autogestao.vercel.app/login');
  await page.fill('input[type="email"]', 'admin@autogestao.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel');
  await page.waitForTimeout(3000);

  const filePath = path.join(__dirname, 'audit_painel.png');
  await page.screenshot({ path: filePath, fullPage: true });
  console.log('📸 Screenshot do /painel salvo em:', filePath);
  
  await browser.close();
})();