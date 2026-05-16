import { test, expect } from '@playwright/test';
import { getE2EInternalCredentials } from '../e2e-helpers/auth';

/**
 * SMOKE TESTS: MX Performance Core Flows
 * Objetivo: Validar que os fluxos principais estão operacionais após a refatoração.
 */

test.describe('Smoke Flows: Authenticated Experience', () => {

  test('Admin Login Bypass & Dashboard Navigation', async ({ page }, testInfo) => {
    const { email, password } = getE2EInternalCredentials();

    // 1. Acesso à página de login
    await page.goto('/login');

    // 2. Preenchimento com conta interna MX configurada para E2E.
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // 3. Submissão
    await page.click('button[type="submit"]');

    // 4. Validação de redirecionamento para o Painel MX
    await expect(page).toHaveURL(/.*painel/);
    await expect(page.getByRole('heading', { name: /Rede Operacional/i })).toBeVisible();
    
    // Smoke Snapshot: Dashboard Principal
    await page.screenshot({ path: 'test-results/smoke-admin-dashboard.png' });

    // 5. Navegação para Lojas (Admin Flow)
    await page.click('a[href="/lojas"]');
    await expect(page.getByRole('heading', { name: /Gestão de Lojas/i })).toBeVisible();
    
    // Validação de elemento crítico: a malha existe; no mobile a tabela fica oculta por responsividade.
    const tabelaLojas = page.locator('table').first();
    if (testInfo.project.name === 'mobile-chrome') {
      await expect(tabelaLojas).toBeAttached();
    } else {
      await expect(tabelaLojas).toBeVisible();
    }
    await page.screenshot({ path: 'test-results/smoke-admin-lojas.png' });

    console.log('✅ Admin Smoke Test: Login, Navigation & UI OK.');
  });

  test('Vendedor/Manager Route Resilience', async ({ page }) => {
    // Validamos que rotas protegidas redirecionam corretamente para login
    const protectedRoutes = ['/lancamento-diario', '/lojas/acertt?tab=equipe', '/perfil', '/classificacao'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
    
    console.log('✅ Route Resilience: Protected routes redirecting to login.');
  });
});
