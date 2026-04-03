const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Tentando acessar /painel...');
  await page.goto('https://autogestao.vercel.app/login');
  await page.fill('input[type="email"]', 'admin@autogestao.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL('**/painel', { timeout: 10000 });
    await page.goto('https://autogestao.vercel.app/lojas');
    await page.waitForTimeout(3000);
    // Clicar no botão de seta do primeiro card de loja
    await page.click('a[href*="/loja?id="]');
    await page.waitForTimeout(5000);
    const filePath = path.join(__dirname, 'audit_loja_detalhe.png');
    await page.screenshot({ path: filePath, fullPage: true });
    console.log('📸 Screenshot salvo em:', filePath);
  } catch (e) {
    console.log('❌ Timeout ou Erro de Navegação:', e.message);
  }
  
  await browser.close();
})();