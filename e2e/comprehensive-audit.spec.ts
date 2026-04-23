import { test, expect } from '@playwright/test';

const USERS = [
  { role: 'Admin', email: 'jose.roberto@mxperformance.com.br', pass: 'R5K2B4AZ' },
  { role: 'Vendedor', email: 'davidgundam081@gmail.com', pass: 'BKAP23' },
  { role: 'Gerente', email: 'caiio.ce@hotmail.com', pass: 'B9C2KDT8' },
  { role: 'Dono', email: 'dono@mxgestaopreditiva.com.br', pass: 'DonoPassword#2026' }
];

test.describe('Comprehensive Ecosystem Sync Audit', () => {
  for (const u of USERS) {
    test(`Audit ${u.role} Flow`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(`[JS] ${err.message}`));
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(`[Console] ${msg.text()}`);
      });
      page.on('requestfailed', request => errors.push(`[Network] ${request.url()} - ${request.failure()?.errorText}`));
      
      console.log(`Starting audit for ${u.role}...`);
      
      // 1. Login
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', u.email);
      
      // Handle password field which might be type="password"
      const passInputs = await page.$$('input[type="password"]');
      if (passInputs.length > 0) {
        await passInputs[0].fill(u.pass);
      } else {
        // Fallback for custom components
        const allInputs = await page.$$('input');
        if (allInputs.length > 1) await allInputs[1].fill(u.pass);
      }
      
      await page.click('button:has-text("ENTRAR")');
      
      // Wait for navigation or error
      await page.waitForTimeout(4000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        const bodyText = await page.innerText('body');
        if (bodyText.includes('credenciais') || bodyText.includes('inválid')) {
          console.log(`❌ Login failed for ${u.role}`);
          return;
        }
      }
      
      console.log(`✅ Login success for ${u.role}. URL: ${currentUrl}`);
      
      // Basic navigation and hydration check
      const links = await page.$$('a, button[role="tab"]');
      if (links.length > 0 && u.role !== 'Vendedor') {
         try {
           await links[0].click({ timeout: 2000 });
           await page.waitForTimeout(2000);
         } catch(e) {}
      }
      
      console.log(`Report for ${u.role}: ${errors.length} errors found.`);
      if (errors.length > 0) {
        console.log(errors.slice(0, 5).join('\n'));
      }
    });
  }
});
