const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '.temp', 'audit_screenshots');
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

const urls = [
  '/painel',
  '/lojas',
  '/loja',
  '/agenda',
  '/leadops',
  '/leads',
  '/equipe',
  '/tarefas',
  '/metas',
  '/funil',
  '/lancamento-diario',
  '/historico',
  '/classificacao',
  '/relatorio-matinal',
  '/financeiro',
  '/inventory',
  '/configuracoes/comissoes',
  '/treinamentos',
  '/communication',
  '/ia-diagnostics',
  '/relatorios/performance-vendas',
  '/relatorios/performance-vendedores',
  '/relatorios/vendas-cruzados',
  '/reports/stock',
  '/activities',
  '/gamification',
  '/devolutivas',
  '/notificacoes',
  '/produtos',
  '/configuracoes',
  '/perfil'
];

const baseUrl = 'https://mxperformance.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const report = {
    totalUrls: urls.length,
    success: 0,
    errors: [],
    pages: []
  };

  const pageErrors = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()}: ${request.failure().errorText}`);
  });

  console.log('Navigating to login...');
  await page.goto(`${baseUrl}/login`);
  
  console.log('Typing credentials...');
  await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  
  console.log('Clicking login...');
  await page.click('button[type="submit"]');

  console.log('Waiting for login to complete...');
  await page.waitForURL('**/painel', { timeout: 15000 });
  
  console.log('Login successful. Starting audit of', urls.length, 'pages.');

  for (let i = 0; i < urls.length; i++) {
    const route = urls[i];
    const fullUrl = `${baseUrl}${route}`;
    console.log(`[${i+1}/${urls.length}] Auditing ${route}...`);
    
    // Clear page specific errors for this iteration
    pageErrors.length = 0;
    consoleErrors.length = 0;
    networkErrors.length = 0;

    try {
      const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'Unknown';
      
      const pageTitle = await page.title();
      
      // Look for react error boundaries or obvious error text
      const html = await page.content();
      const hasErrorBoundary = html.includes('Something went wrong') || html.includes('An unexpected error occurred');
      
      const safeFilename = route === '/' ? 'home' : route.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const screenshotPath = path.join(AUDIT_DIR, `${safeFilename}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      report.pages.push({
        route,
        status,
        title: pageTitle,
        hasErrorBoundary,
        screenshot: screenshotPath,
        pageErrors: [...pageErrors],
        consoleErrors: consoleErrors.slice(0, 5), // limit array size
        networkErrors: networkErrors.slice(0, 5)
      });
      report.success++;
      
    } catch (e) {
      console.log(`Failed to audit ${route}:`, e.message);
      report.pages.push({
        route,
        error: e.message
      });
      report.errors.push(`Failed on ${route}: ${e.message}`);
    }
  }

  const reportPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Audit complete. Report saved to ${reportPath}`);
  
  await browser.close();
})();
