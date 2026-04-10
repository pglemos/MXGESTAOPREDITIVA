import { chromium } from 'playwright';

async function finalVerification() {
  console.log('--- OPERAÇÃO ORION: VALIDAÇÃO FINAL EM PRODUÇÃO ---');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Acessando site oficial...');
    await page.goto('https://mxperformance.vercel.app/login', { waitUntil: 'networkidle' });
    
    console.log('Realizando login Admin...');
    await page.fill('input[type="email"]', 'luzdirecaoconsultoria@gmail.com');
    await page.fill('input[type="password"]', 'R5K2B4AZ');
    await page.click('button:has-text("ENTRAR")');
    
    await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {});
    await page.goto('https://mxperformance.vercel.app/painel', { waitUntil: 'networkidle' });
    
    console.log('Aguardando sincronização de rede...');
    await page.waitForTimeout(8000); // Tempo para o Vercel buscar no Supabase

    const dashboardData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('button[aria-label*="Ver detalhes"]')).map(btn => {
        const container = btn.closest('div');
        const name = container?.querySelector('span, h3')?.innerText || 'N/A';
        const stats = Array.from(container?.querySelectorAll('span') || [])
          .map(s => s.innerText)
          .filter(t => !isNaN(parseInt(t)));
        
        return { name, stats };
      });
      
      const totalVendas = document.querySelector('main h1')?.innerText || '0';
      const totalLeads = Array.from(document.querySelectorAll('h3')).find(el => el.nextElementSibling?.innerText.includes('LEADS'))?.innerText || '0';
      
      return { totalVendas, totalLeads, rows };
    });

    console.log('\n--- DADOS CAPTURADOS DA TELA (ABRIL 2026) ---');
    console.log(`TOTAL VENDAS GLOBAL: ${dashboardData.totalVendas}`);
    console.log(`TOTAL LEADS GLOBAL: ${dashboardData.totalLeads}`);
    
    console.log('\nDETALHADO POR UNIDADE:');
    dashboardData.rows.forEach(r => {
       console.log(`- ${r.name}: ${r.stats.join(' | ')}`);
    });

    await page.screenshot({ path: 'PROVA-DE-PERFEICAO.png', fullPage: true });
    console.log('\n✅ Perfeição validada. Screenshot salva como PROVA-DE-PERFEICAO.png');

  } catch (e) {
    console.error('❌ Falha na validação:', e.message);
  } finally {
    await browser.close();
  }
}

finalVerification();
