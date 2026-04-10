import { chromium } from 'playwright';

const users = [
  { email: 'danieljsvendas@gmail.com', pass: 'WKDTVGWN', name: 'DANIEL JS' },
  { email: 'luzdirecaoconsultoria@gmail.com', pass: 'R5K2B4AZ', name: 'JOSE ROBERTO' },
  { email: 'davidgundam081@gmail.com', pass: 'BKAP23', name: 'DAVID' },
  { email: 'caiio.ce@hotmail.com', pass: 'B9C2KDT8', name: 'CAIO' }
];

async function testAccess() {
  const browser = await chromium.launch();
  
  for (const user of users) {
    console.log(`\nIniciando teste para: ${user.name} (${user.email})...`);
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    
    try {
      await page.goto('https://mxperformance.vercel.app/login', { waitUntil: 'networkidle' });
      
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.pass);
      await page.click('button:has-text("ENTRAR")');
      
      await page.waitForTimeout(5000);
      
      const errorMsg = await page.textContent('.text-red-500, .toast, [role="alert"]').catch(() => null);
      if (errorMsg) console.log(`   [DEBUG] Erro na tela para ${user.name}: ${errorMsg.trim()}`);

      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        console.log(`❌ FALHA: ${user.name} parou no login.`);
      } else {
        console.log(`✅ SUCESSO: ${user.name} logado em ${currentUrl}`);
        await page.screenshot({ path: `test-login-${user.name.replace(' ', '-')}.png` });
      }
    } catch (e) {
      console.log(`❌ ERRO no teste de ${user.name}: ${e.message}`);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
}

testAccess();
