const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, '.temp', 'deep_audit');
if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

const routes = [
  '/painel', '/lojas', '/loja', '/agenda', '/leadops', '/leads', '/equipe', '/tarefas', '/metas',
  '/funil', '/checkin', '/historico', '/ranking', '/relatorio-matinal', '/financeiro', '/inventory',
  '/configuracoes/comissoes', '/treinamentos', '/communication', '/ia-diagnostics',
  '/relatorios/performance-vendas', '/relatorios/performance-vendedores', '/relatorios/vendas-cruzados',
  '/reports/stock', '/activities', '/gamification', '/feedback', '/notificacoes', '/produtos',
  '/configuracoes', '/perfil'
];

const baseUrl = 'http://localhost:3000';

(async () => {
  console.log('🚀 Iniciando Deep Audit End-to-End...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${baseUrl}/login`);
  await page.fill('input[type="email"]', 'admin@mxgestaopreditiva.com.br');
  await page.fill('input[type="password"]', 'Jose20161@');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/painel', { timeout: 15000 });

  const masterReport = [];

  for (const route of routes) {
    const report = { route, buttons: 0, inputs: 0, links: 0, designTokens: {}, issues: [] };
    
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const analysis = await page.evaluate(() => {
        const issues = [];
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input, select, textarea');
        const links = document.querySelectorAll('a');
        
        links.forEach(l => {
          const href = l.getAttribute('href');
          if (!href || href === '#' || href.includes('undefined')) {
            issues.push(`Broken link found: ${l.innerText || 'no-text'}`);
          }
        });

        const bodyStyle = window.getComputedStyle(document.body);
        const h1 = document.querySelector('h1');
        const h1Style = h1 ? window.getComputedStyle(h1) : null;
        
        let primaryBtnStyle = null;
        if (buttons.length > 0) {
          primaryBtnStyle = window.getComputedStyle(buttons[0]);
        }

        const designTokens = {
          bodyFont: bodyStyle.fontFamily,
          bodyBg: bodyStyle.backgroundColor,
          h1Font: h1Style ? h1Style.fontFamily : 'N/A',
          h1Color: h1Style ? h1Style.color : 'N/A',
          primaryBtnBg: primaryBtnStyle ? primaryBtnStyle.backgroundColor : 'N/A',
          primaryBtnRadius: primaryBtnStyle ? primaryBtnStyle.borderRadius : 'N/A'
        };

        buttons.forEach(b => {
          const rect = b.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) issues.push(`Invisible button found: ${b.innerText}`);
        });

        return {
          elementCounts: { buttons: buttons.length, inputs: inputs.length, links: links.length },
          designTokens,
          issues
        };
      });

      report.buttons = analysis.elementCounts.buttons;
      report.inputs = analysis.elementCounts.inputs;
      report.links = analysis.elementCounts.links;
      report.designTokens = analysis.designTokens;
      report.issues = analysis.issues;

    } catch (e) {
      report.issues.push(`Load error: ${e.message}`);
    }

    masterReport.push(report);
  }

  const reportPath = path.join(AUDIT_DIR, 'deep_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(masterReport, null, 2));
  
  // Output summary
  console.log(`\n✅ Deep Audit concluída!`);
  
  const totalIssues = masterReport.reduce((acc, curr) => acc + curr.issues.length, 0);
  console.log(`\n📊 Resumo da Auditoria:`);
  console.log(`- Telas auditadas: ${masterReport.length}`);
  console.log(`- Total de anomalias/issues: ${totalIssues}`);
  
  const fonts = new Set(masterReport.map(r => r.designTokens.bodyFont));
  console.log(`- Consistência de Fonte Body: ${fonts.size === 1 ? '✅ Perfeita' : '❌ Inconsistente (' + Array.from(fonts).join(' | ') + ')'}`);
  
  const h1Fonts = new Set(masterReport.map(r => r.designTokens.h1Font));
  console.log(`- Consistência de Fonte H1: ${h1Fonts.size === 1 ? '✅ Perfeita' : '⚠️ Variável (' + Array.from(h1Fonts).join(' | ') + ')'}`);

  const btnRadii = new Set(masterReport.map(r => r.designTokens.primaryBtnRadius).filter(r => r !== 'N/A'));
  console.log(`- Consistência de Borda (Botões): ${btnRadii.size <= 2 ? '✅ Padronizada' : '❌ Inconsistente (' + Array.from(btnRadii).join(', ') + ')'}`);

  if (totalIssues > 0) {
    console.log(`\n⚠️ Detalhamento de Issues:`);
    masterReport.filter(r => r.issues.length > 0).forEach(r => {
      console.log(`\n[${r.route}]`);
      r.issues.forEach(i => console.log(`  - ${i}`));
    });
  }

  await browser.close();
})();
