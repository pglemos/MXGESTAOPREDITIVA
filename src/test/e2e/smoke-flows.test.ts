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
    
    // 5. Navegação para Lojas (Admin Flow)
    await page.goto('/lojas');
    await expect(page.locator('h1')).toContainText(/GESTÃO DE LOJAS/i);

    console.log('✅ Admin Smoke Test: Login & Navigation OK.');
  });

  test('Vendedor/Manager Basic Navigation', async ({ page }) => {
    // Como não temos bypass para vendedor no momento, vamos testar apenas o carregamento das rotas
    // em um cenário onde o login pudesse ser injetado via storageState.
    // Para este smoke test, validamos apenas a existência das páginas públicas.
    await page.goto('/login');
    await expect(page.locator('text=MX PERFORMANCE')).toBeVisible();
  });

  test('Checkin & Ranking Routes Accessibility', async ({ page }) => {
    // Tentativa de acesso direto (deve redirecionar se não logado, mas validamos o fluxo)
    await page.goto('/ranking');
    await expect(page).toHaveURL(/.*login/); // Redirecionamento esperado por falta de auth
  });
});
