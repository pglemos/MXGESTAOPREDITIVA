import { chromium } from 'playwright';

async function testCustomRange() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('--- TEST CUSTOM RANGE START ---');
  
  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@performance.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    await page.goto('http://localhost:5173/painel');
    await page.waitForTimeout(5000);

    // Click "Personalizado"
    await page.click('button:has-text("Personalizado")');
    await page.waitForTimeout(1000);

    // Fill dates
    await page.fill('input[type="date"]:near(label:has-text("Início"))', '2026-04-01');
    await page.fill('input[type="date"]:near(label:has-text("Fim"))', '2026-04-30');
    
    // Click "Aplicar Período"
    await page.click('button:has-text("Aplicar Período")');
    await page.waitForTimeout(5000);

    const painelText = await page.innerText('body');
    // For April 2026, Espindola should have 3 sales
    console.log('Painel with Custom Range (April 2026):');
    console.log('Has ESPINDOLA:', painelText.includes('ESPINDOLA AUTOMOVEIS'));
    
    await page.screenshot({ path: 'test_custom_range_result.png', fullPage: true });

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    console.log('--- TEST CUSTOM RANGE END ---');
  }
}

testCustomRange();
