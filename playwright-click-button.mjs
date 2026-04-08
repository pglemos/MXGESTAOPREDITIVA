import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Log errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://127.0.0.1:3000/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/painel', { timeout: 10000 });
    
    // Locate the 'Rituais MX' button
    const ritualBtn = page.getByRole('button', { name: /Rituais MX/i });
    console.log('Button found?', await ritualBtn.count());
    
    await ritualBtn.click();
    console.log('Clicked Rituais MX');
    await page.waitForTimeout(2000);
    console.log('Current URL:', page.url());
    
    await browser.close();
})();
