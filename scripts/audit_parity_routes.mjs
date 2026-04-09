import { chromium } from 'playwright';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('--- AUDIT PARITY START ---');
  
  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@performance.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('Login attempt completed');

    await page.goto('http://localhost:5173/painel');
    await page.waitForTimeout(5000);
    const painelText = await page.innerText('body');
    console.log('Painel Content (has ESPINDOLA):', painelText.includes('ESPINDOLA AUTOMOVEIS'));
    await page.screenshot({ path: 'audit_painel_admin.png', fullPage: true });

    await page.goto('http://localhost:5173/rotina');
    await page.waitForTimeout(5000);
    const rotinaText = await page.innerText('body');
    console.log('Rotina Text (prefix):', rotinaText.substring(0, 100));
    await page.screenshot({ path: 'audit_rotina_admin.png', fullPage: true });

    await page.goto('http://localhost:5173/home');
    await page.waitForTimeout(5000);
    const homeText = await page.innerText('body');
    console.log('Home Text (prefix):', homeText.substring(0, 100));
    await page.screenshot({ path: 'audit_vendedor_home.png', fullPage: true });

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await browser.close();
    console.log('--- AUDIT PARITY END ---');
  }
}

runAudit();
