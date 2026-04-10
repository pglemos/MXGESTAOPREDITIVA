import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Debugging E2E Login - MX Performance');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Abrindo a página de login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/debug-01-login-loaded.png' });

    console.log('2. Preenchendo credenciais...');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Jose20161@');
    await page.screenshot({ path: 'test-results/debug-02-credentials-filled.png' });

    console.log('3. Clicando em Entrar...');
    await page.click('button[type="submit"]');

    // Aguardar ou falha ou sucesso
    try {
      await page.waitForURL('**/painel', { timeout: 10000 });
      console.log('✅ SUCESSO: Login redirecionado para /painel');
    } catch (e) {
      console.log('❌ FALHA: Redirecionamento para /painel falhou com Jose20161@');
      console.log('URL Atual:', page.url());
      await page.screenshot({ path: 'test-results/debug-03-login-error-1.png' });

      console.log('4. Tentando senha alternativa: Mx#2026!...');
      await page.fill('input[type="password"]', 'Mx#2026!');
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL('**/painel', { timeout: 10000 });
        console.log('✅ SUCESSO: Login redirecionado para /painel com Mx#2026!');
      } catch (e2) {
        console.log('❌ FALHA TOTAL: Nenhum dos segredos conhecidos funcionou.');
        await page.screenshot({ path: 'test-results/debug-04-login-error-final.png' });
      }
    }

  } catch (error) {
    console.error('Erro fatal no script:', error);
  } finally {
    await browser.close();
  }
})();
