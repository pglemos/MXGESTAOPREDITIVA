const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = '/Users/pedroguilherme/Desktop/CONTEUDO MX GESTÃO PREDITIVA';

// Ensure the target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const routes = [
  '/painel', '/lojas', '/loja', '/agenda', '/leadops', '/leads', '/equipe', '/tarefas', '/metas',
  '/funil', '/checkin', '/historico', '/ranking', '/relatorio-matinal', '/financeiro', '/inventory',
  '/configuracoes/comissoes', '/treinamentos', '/communication', '/ia-diagnostics',
  '/relatorios/performance-vendas', '/relatorios/performance-vendedores', '/relatorios/vendas-cruzados',
  '/reports/stock', '/activities', '/gamification', '/feedback', '/notificacoes', '/produtos',
  '/configuracoes', '/perfil'
];

const baseUrl = 'https://mxperformance.vercel.app';

(async () => {
  console.log('📸 Iniciando captura de screenshots Full Page...');
  const browser = await chromium.launch({ headless: true });
  // Using a standard desktop viewport. Wait for network idle might make the page longer if more content loads
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Screenshot of the Login page
  console.log('Capturando tela de Login...');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: path.join(TARGET_DIR, '00_login.png'), fullPage: true });

  // Login action
  console.log('Realizando login...');
  await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel', { timeout: 15000 });

  // 2. Screenshot of all internal routes
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const safeFilename = route.replace(/\//g, '_').replace(/^_/, ''); // e.g., "configuracoes_comissoes"
    const paddedIndex = String(i + 1).padStart(2, '0'); // 01, 02, 03...
    const fileName = `${paddedIndex}_${safeFilename}.png`;
    const filePath = path.join(TARGET_DIR, fileName);

    console.log(`[${paddedIndex}/${routes.length}] Capturando ${route}... -> ${fileName}`);
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      // Small delay to allow any animations or lazy-loaded components to settle
      await page.waitForTimeout(1000); 
      await page.screenshot({ path: filePath, fullPage: true });
    } catch (e) {
      console.log(`❌ Erro ao capturar ${route}: ${e.message}`);
    }
  }

  console.log('✅ Captura de screenshots concluída! Arquivos salvos em:', TARGET_DIR);
  await browser.close();
})();
