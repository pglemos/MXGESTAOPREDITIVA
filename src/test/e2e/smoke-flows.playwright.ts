import { test, expect } from '@playwright/test';

/**
 * SMOKE TESTS: MX Performance Core Flows
 * Objetivo: Validar que os fluxos principais estão operacionais após a refatoração.
 */

test.describe('Smoke Flows: Authenticated Experience', () => {

  test('Admin Login Bypass & Dashboard Navigation', async ({ page }) => {
    // 1. Acesso à página de login
    await page.goto('/login');
    
    // 2. Preenchimento via E2E Bypass (conforme src/pages/Login.tsx)
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    
    // 3. Submissão
    await page.click('button[type="submit"]');

    // 4. Validação de redirecionamento para o Painel do Consultor
    await expect(page).toHaveURL(/.*painel/);
    await expect(page.locator('h1')).toContainText(/PAINEL DO CONSULTOR/i);
    
    // Smoke Snapshot: Dashboard Principal
    await page.screenshot({ path: 'test-results/smoke-admin-dashboard.png' });

    // 5. Navegação para Lojas (Admin Flow)
    await page.click('a[href="/lojas"]');
    await expect(page.locator('h1')).toContainText(/GESTÃO DE LOJAS/i);
    
    // Validação de elemento crítico: Tabela de Unidades
    await expect(page.locator('table')).toBeVisible();
    await page.screenshot({ path: 'test-results/smoke-admin-lojas.png' });

    console.log('✅ Admin Smoke Test: Login, Navigation & UI OK.');
  });

  test('Vendedor/Manager Route Resilience', async ({ page }) => {
    // Validamos que rotas protegidas redirecionam corretamente para login
    const protectedRoutes = ['/checkin', '/equipe', '/perfil', '/ranking'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
    
    console.log('✅ Route Resilience: Protected routes redirecting to login.');
  });
});
