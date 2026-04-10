import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Diagnóstico Visual da Página de Check-in');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/painel');
    
    console.log('Navegando para /checkin...');
    await page.goto('http://localhost:3000/checkin', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/checkin-visual-audit.png', fullPage: true });
    
    // Listar todos os textos de labels encontrados
    const labels = await page.locator('span, p, h1, h2, h3, div').allTextContents();
    const relevantLabels = labels.filter(t => t.includes('Leads') || t.includes('Visitas'));
    console.log('Labels detectados:', [...new Set(relevantLabels)]);

    // Listar botões
    const btnCount = await page.locator('button').count();
    console.log(`Total de botões na página: ${btnCount}`);

  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await browser.close();
  }
})();
