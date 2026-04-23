const { chromium } = require('playwright');

const USERS = [
  { role: 'Admin', email: 'jose.roberto@mxperformance.com.br', pass: 'R5K2B4AZ' },
  { role: 'Vendedor', email: 'davidgundam081@gmail.com', pass: 'BKAP23' },
  { role: 'Gerente', email: 'caiio.ce@hotmail.com', pass: 'B9C2KDT8' },
  { role: 'Dono', email: 'dono@mxgestaopreditiva.com.br', pass: 'DonoPassword#2026' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  for (const u of USERS) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(`[JS] ${err.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`[Console] ${msg.text()}`);
    });
    
    console.log(`\n============================`);
    console.log(`Starting audit for ${u.role} (${u.email})...`);
    
    try {
      await page.goto('http://localhost:3001/login');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', u.email);
      
      const allInputs = await page.$$('input');
      if (allInputs.length > 1) {
         await allInputs[1].fill(u.pass);
      }
      
      await page.click('button:has-text("ENTRAR")');
      await page.waitForTimeout(5000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        console.log(`❌ Login failed for ${u.role}`);
      } else {
        console.log(`✅ Login success for ${u.role}. Redirected to: ${currentUrl}`);
        const bodyText = await page.innerText('body');
        
        // Verify rendering logic dynamically based on role expectations
        if (u.role === 'Admin' || u.role === 'Dono') {
          if (bodyText.includes('REDE OPERACIONAL') || bodyText.includes('Lojas') || bodyText.includes('Corporativo')) {
            console.log(`✅ Dashboard Corporativo rendered correctly.`);
          } else {
            console.log(`❌ Missing Expected Corporate UI Elements.`);
            errors.push('Missing Corporate Elements');
          }
        }
        
        if (u.role === 'Gerente') {
          if (bodyText.includes('Equipe') || bodyText.includes('Sincronia Média')) {
            console.log(`✅ Dashboard Loja (Gerente) rendered correctly.`);
          } else {
            console.log(`❌ Missing Manager UI Elements.`);
            errors.push('Missing Manager Elements');
          }
        }
        
        if (u.role === 'Vendedor') {
          if (bodyText.includes('Check-in') || bodyText.includes('Hoje')) {
             console.log(`✅ Home/Check-in (Vendedor) rendered correctly.`);
          } else {
             console.log(`❌ Missing Seller Check-in UI Elements.`);
             errors.push('Missing Seller Elements');
          }
        }
      }
      
      console.log(`Report for ${u.role}: ${errors.length} unexpected errors/issues found during interaction.`);
      if (errors.length > 0) {
        console.log(errors.slice(0, 5).join('\n'));
      }
    } catch (e) {
       console.log(`❌ Fatal execution error for ${u.role}: ${e.message}`);
    }
    
    await page.close();
  }
  
  await browser.close();
})();