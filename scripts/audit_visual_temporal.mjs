import { chromium } from 'playwright';

async function visualAudit() {
  console.log('--- INICIANDO AUDITORIA VISUAL TEMPORAL ---');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto('https://mxperformance.vercel.app/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'luzdirecaoconsultoria@gmail.com');
    await page.fill('input[type="password"]', 'R5K2B4AZ');
    await page.click('button:has-text("ENTRAR")');
    await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
    
    // Navegar para o Painel se não redirecionar
    await page.goto('https://mxperformance.vercel.app/painel', { waitUntil: 'networkidle' });

    const auditResults = [];

    // 2. Testar Filtros
    const filters = ['HOJE', 'ONTEM', 'MENSAL'];
    for (const f of filters) {
      console.log(`Testando Filtro: ${f}...`);
      await page.click(`button:has-text("${f}")`);
      await page.waitForTimeout(3000); // Aguarda cálculos do front

      // Extrair Leads e Vendas totais do topo do dashboard
      const stats = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h3'));
        // Localiza os números baseados na estrutura do PainelConsultor
        // O total de vendas geralmente é o primeiro H1 grande
        const vendaTotal = document.querySelector('main h1')?.innerText || '0';
        // Leads e outros ficam em H3 ou spans próximos
        const leads = Array.from(document.querySelectorAll('main h3')).find(el => el.nextElementSibling?.innerText.includes('LEADS'))?.innerText || '0';
        return { vendaTotal, leads };
      });

      auditResults.push({ periodo: f, visual: stats });
      await page.screenshot({ path: `audit-visual-${f}.png` });
    }

    console.log('\n--- RESULTADOS DA AUDITORIA VISUAL ---');
    console.table(auditResults);

  } catch (e) {
    console.error('Erro na auditoria:', e.message);
  } finally {
    await browser.close();
  }
}

visualAudit();
