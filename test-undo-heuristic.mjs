import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Iniciando Auditoria Heurística 1.1 (Controle e Liberdade)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navegar para o Login
    console.log('Navegando para o Login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // 2. Realizar Login
    console.log('Realizando Login...');
    await page.fill('input[type="email"]', 'admin@autogestao.com.br');
    await page.fill('input[type="password"]', 'Jose20161@');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/painel', { timeout: 15000 });
    console.log('✅ Login realizado com sucesso!');

    // 3. Navegar para Tarefas
    console.log('Navegando para /tarefas...');
    await page.goto('http://localhost:3000/tarefas', { waitUntil: 'networkidle' });

    // 4. Identificar uma tarefa e capturar o nome
    const taskTitle = await page.locator('h4').first().textContent();
    console.log(`Alvo detectado: "${taskTitle}"`);

    // 5. Clicar no botão de deletar (Trash2 icon)
    // No código: <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id) }} ...><Trash2 ... /></button>
    // Precisamos de hover para o botão aparecer (opacity-0 group-hover:opacity-100)
    await page.locator('.mx-card').first().hover();
    await page.locator('button:has(svg.lucide-trash2)').first().click();
    console.log('🗑️ Comando de deleção disparado.');

    // 6. Validar presença do Toast de "Removendo"
    await page.waitForSelector('text=Removendo:', { timeout: 5000 });
    console.log('🔔 Toast de remoção detectado.');

    // 7. Simular Ctrl+Z
    console.log('⌨️ Disparando atalho Ctrl+Z...');
    await page.keyboard.press('Control+Z');

    // 8. Validar Toast de "Preservada"
    await page.waitForSelector('text=preservada!', { timeout: 5000 });
    console.log('✅ Reversão confirmada via atalho de teclado!');

    // 9. Verificar se a tarefa ainda existe na tela
    const isStillThere = await page.locator(`text=${taskTitle}`).isVisible();
    if (isStillThere) {
      console.log('🏆 Heurística 1.1 VALIDADA: Missão preservada após Ctrl+Z.');
    } else {
      throw new Error('Falha: A tarefa foi removida mesmo após Ctrl+Z.');
    }

  } catch (error) {
    console.error(`❌ Erro na auditoria: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
