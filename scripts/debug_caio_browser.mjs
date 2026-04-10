import { chromium } from 'playwright';

async function debugCaioLogin() {
  console.log('--- DEBUG NAVEGADOR: LOGIN DO CAIO ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Carregando página de login...');
    await page.goto('https://mxperformance.vercel.app/login', { waitUntil: 'networkidle' });
    
    console.log('2. Preenchendo credenciais...');
    await page.fill('input[type="email"]', 'caiio.ce@hotmail.com');
    await page.fill('input[type="password"]', 'B9C2KDT8');
    
    console.log('3. Clicando no botão ENTRAR...');
    await page.click('button:has-text("ENTRAR")');
    
    console.log('4. Aguardando resposta do sistema...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`   URL Atual: ${currentUrl}`);
    
    // Capturar erro visual se houver
    const errorToast = await page.locator('.sonner-toast, .toast, [role="alert"]').first().textContent().catch(() => null);
    if (errorToast) console.log(`   [ALERTA VISUAL]: ${errorToast.trim()}`);

    const bodyText = await page.innerText('body');
    if (bodyText.toLowerCase().includes('invalid') || bodyText.toLowerCase().includes('erro')) {
        console.log('   [DETECTADO]: Mensagem de erro no corpo da página.');
    }

    if (currentUrl.includes('/login')) {
      console.log('❌ O navegador FOI BARRADO na tela de login.');
      await page.screenshot({ path: 'ERRO-LOGIN-CAIO.png' });
    } else {
      console.log('✅ O navegador LOGOU com sucesso e redirecionou.');
      await page.screenshot({ path: 'SUCESSO-LOGIN-CAIO.png' });
    }

  } catch (e) {
    console.error('❌ Falha técnica no teste:', e.message);
  } finally {
    await browser.close();
  }
}

debugCaioLogin();
