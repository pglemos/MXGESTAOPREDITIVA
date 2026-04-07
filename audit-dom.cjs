const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Auditando DOM de /equipe...');
  await page.goto('https://mxgestaopreditiva.vercel.app/login');
  await page.fill('input[type="email"]', 'admin@mxgestaopreditiva.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/painel');
  await page.goto('https://mxgestaopreditiva.vercel.app/equipe');
  await page.waitForTimeout(5000);

  // Verificar se o grid de stats existe
  const statsExist = await page.evaluate(() => {
    const grid = document.querySelector('.grid-cols-2.md\\:grid-cols-4');
    return grid ? { 
      visible: grid.offsetHeight > 0,
      childCount: grid.children.length,
      html: grid.outerHTML.substring(0, 500)
    } : null;
  });

  console.log('ESTADO DO GRID:', JSON.stringify(statsExist, null, 2));
  
  const filePath = path.join(__dirname, 'audit_equipe_debug.png');
  await page.screenshot({ path: filePath, fullPage: true });
  
  await browser.close();
})();
