const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_DIR = '/Users/pedroguilherme/Desktop/CONTEUDO MX GESTÃO PREDITIVA';

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const routes = [
  '/painel', '/lojas', '/loja', '/ranking', '/leadops', '/leads', '/funil', '/agenda',
  '/equipe', '/tarefas', '/metas', '/checkin', '/historico', '/relatorio-matinal',
  '/financeiro', '/inventory', '/produtos', '/configuracoes/comissoes',
  '/relatorios/performance-vendas', '/relatorios/performance-vendedores',
  '/relatorios/vendas-cruzados', '/reports/stock', '/ia-diagnostics',
  '/gamification', '/activities', '/treinamentos', '/communication',
  '/feedback', '/configuracoes', '/notificacoes', '/perfil'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('🚀 Iniciando Captura de Elite (Full Capture)...');
  
  // Login
  await page.goto('https://mxperformance.vercel.app/login');
  await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel');
  console.log('✅ Login realizado.');

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const fileName = `${(i + 1).toString().padStart(2, '0')}_${route.replace(/\//g, '_').replace(/\?/g, '_')}.png`;
    const filePath = path.join(TARGET_DIR, fileName);

    console.log(`[${i + 1}/${routes.length}] Capturando: ${route}`);

    try {
      await page.goto(`https://mxperformance.vercel.app${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(4000); // Tempo para animações estabilizarem

      // INJEÇÃO DE ELITE PARA NÃO CORTAR NADA
      await page.evaluate(() => {
        // Expandir todos os containers de scroll
        const style = document.createElement('style');
        style.innerHTML = `
          html, body, #root, [class*="h-[100dvh]"], main, aside, .overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            min-height: auto !important;
          }
          .fixed, .sticky {
            position: absolute !important;
          }
          /* Esconder barras de navegação que podem flutuar na captura */
          nav.fixed { display: none !important; }
        `;
        document.head.appendChild(style);
      });

      await page.screenshot({ path: filePath, fullPage: true });
    } catch (e) {
      console.log(`❌ Erro em ${route}: ${e.message}`);
    }
  }

  console.log('🎯 Operação Concluída. Todos os prints salvos em:', TARGET_DIR);
  await browser.close();
})();
