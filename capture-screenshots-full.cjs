const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_DIR = '/Users/pedroguilherme/Desktop/CONTEUDO MX GESTÃO PREDITIVA';

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
  console.log('📸 Iniciando captura RIGOROSA de screenshots Full Page...');
  const browser = await chromium.launch({ headless: true });
  // Set a large height initially to help trigger lazy loading if any
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  console.log('Capturando tela de Login...');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: path.join(TARGET_DIR, '00_login.png'), fullPage: true });

  console.log('Realizando login...');
  await page.fill('input[type="email"]', 'admin@autogestao.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel', { timeout: 15000 });

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const safeFilename = route.replace(/\//g, '_').replace(/^_/, '');
    const paddedIndex = String(i + 1).padStart(2, '0');
    const fileName = `${paddedIndex}_${safeFilename}.png`;
    const filePath = path.join(TARGET_DIR, fileName);

    console.log(`[${paddedIndex}/${routes.length}] Expandindo e Capturando ${route}...`);
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000); // Wait for animations/data
      
      // CRITICAL: SPA (Single Page Apps) usually lock the body height and use internal scrolling (overflow-y-auto).
      // We must inject CSS to force the internal scrollable containers to expand to their true full height,
      // breaking the 'h-screen' locks, so Playwright's fullPage screenshot works correctly.
      await page.evaluate(() => {
        // 1. Unlock root wrappers
        document.documentElement.style.height = 'auto';
        document.documentElement.style.overflow = 'visible';
        document.body.style.height = 'auto';
        document.body.style.overflow = 'visible';
        
        const root = document.getElementById('root');
        if (root) {
          root.style.height = 'auto';
          root.style.overflow = 'visible';
        }

        // 2. Find all elements that might be restricting height and scrolling internally
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          // If the element has internal scrolling, release it
          if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll' || style.overflow === 'hidden') {
            el.style.overflow = 'visible';
            el.style.overflowY = 'visible';
            el.style.maxHeight = 'none';
            // Only force height to auto if it was restricted
            if (style.height !== 'auto' && style.height.includes('px')) {
              el.style.height = 'auto';
            }
          }
          // Remove tailwind h-screen limitations dynamically
          if (el.classList.contains('h-screen') || el.classList.contains('max-h-screen')) {
            el.classList.remove('h-screen', 'max-h-screen');
            el.style.height = 'auto';
            el.style.maxHeight = 'none';
          }
        }
        
        // Ensure main content tag is explicitly expanded
        const main = document.querySelector('main');
        if (main) {
          main.style.height = 'auto';
          main.style.overflow = 'visible';
        }
      });

      // Small wait to allow the browser to reflow the layout with the new unrestricted heights
      await page.waitForTimeout(1000); 

      await page.screenshot({ path: filePath, fullPage: true });
    } catch (e) {
      console.log(`❌ Erro ao capturar ${route}: ${e.message}`);
    }
  }

  console.log('✅ Re-Captura de screenshots (Full Page Verdadeiro) concluída!');
  await browser.close();
})();