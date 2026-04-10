import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Iniciando E2E Audit com Mock de Perfil (Zero Dependência Supabase)');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Injetar perfil de admin no localStorage antes de carregar a página
  const mockProfile = {
    id: '167f189c-a4dd-43d1-9b0f-388c85935719',
    email: 'admin@mxperformance.com.br',
    role: 'admin',
    name: 'Admin MX'
  };

  await page.addInitScript((profile) => {
    localStorage.setItem('mx_auth_profile', JSON.stringify(profile));
  }, mockProfile);

  try {
    console.log('Navegando direto para /checkin com perfil injetado...');
    await page.goto('http://localhost:3000/checkin', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-results/e2e-injected-checkin.png', fullPage: true });
    
    // Validar se os componentes de check-in apareceram
    const hasHeader = await page.isVisible('text=Retrospectiva MX');
    console.log(`Página carregada com sucesso: ${hasHeader}`);

  } catch (e) {
    console.error('Falha:', e.message);
  } finally {
    await browser.close();
  }
})();
