const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = '/Users/pedroguilherme/Desktop/CONTEUDO MX GESTÃO PREDITIVA/POS_ALTERACAO';

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

const baseUrl = 'https://autogestao.vercel.app';

(async () => {
  console.log('📸 Iniciando Validação Visual Pós-Alteração...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Realizando login...');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@autogestao.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel');

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const safeFilename = route.replace(/\//g, '_').replace(/^_/, '');
    const paddedIndex = String(i + 1).padStart(2, '0');
    const filePath = path.join(TARGET_DIR, `${paddedIndex}_VAL_${safeFilename}.png`);

    console.log(`[${paddedIndex}/${routes.length}] Validando ${route}...`);
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Injetar script para garantir captura full page sem travas de overflow
      await page.evaluate(() => {
        document.documentElement.style.height = 'auto';
        document.body.style.height = 'auto';
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            el.style.overflow = 'visible';
            el.style.height = 'auto';
          }
        });
      });

      await page.waitForTimeout(2000);
      await page.screenshot({ path: filePath, fullPage: true });
    } catch (e) {
      console.log(`❌ Erro em ${route}: ${e.message}`);
    }
  }

  console.log('✅ Validação concluída. Fotos salvas em:', TARGET_DIR);
  await browser.close();
})();