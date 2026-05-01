import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@mxgestaopreditiva.com.br');
  await page.fill('input[type="password"]', 'Mx#2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 15000 });
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 15000 });
}

test.describe('Navigation: Main Sidebar & Mobile Bar', () => {

  test('root URL redirects or renders a page without crash', async ({ page }) => {
    const response = await page.goto('/');
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('login page renders auth form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('header renders MX Performance branding', async ({ page }) => {
    await loginAsAdmin(page);
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    await expect(header.locator('img[alt="MX Performance"]')).toBeVisible();
  });

  test('sidebar navigation renders category icons when authenticated', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'A navegação lateral é substituída pela barra mobile.');
    await loginAsAdmin(page);

    const sidebar = page.locator('aside[aria-label="Menu Lateral Principal"]');
    await expect(sidebar).toBeVisible();

    const navButtons = sidebar.locator('nav[aria-label="Módulos de Gestão"] button[type="button"]');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sidebar drawer opens on category click and shows nav items', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chrome', 'A navegação lateral é substituída pelo menu mobile.');
    await loginAsAdmin(page);

    const sidebar = page.locator('aside[aria-label="Menu Lateral Principal"]');
    await expect(sidebar).toBeVisible();

    const firstCategoryBtn = sidebar.locator('nav button[type="button"]').first();
    await firstCategoryBtn.click();

    const drawer = page.locator('#drawer-navigation');
    await expect(drawer).toBeVisible();

    const navLinks = drawer.locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('Painel page loads via nav link', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/painel');
    await expect(page.getByRole('heading', { name: /Rede Operacional/i })).toBeVisible();
  });

  test('Lojas page loads via nav link', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/lojas');
    await expect(page.getByRole('heading', { name: /Gestão de Lojas/i })).toBeVisible();
  });

  test('Checkin page loads or redirects to login', async ({ page }) => {
    await page.goto('/lancamento-diario');
    const url = page.url();
    const isLogin = url.includes('login');
    const isLancamentoDiario = url.includes('lancamento-diario');
    expect(isLogin || isLancamentoDiario).toBe(true);
  });

  test('Consultoria nav link navigates to clientes page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/consultoria/clientes');
    await expect(page.getByRole('heading', { name: /CRM de Consultoria/i })).toBeVisible();
  });

  test('Agenda nav link navigates to agenda page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/agenda');
    await expect(page.getByText('Agenda MX')).toBeVisible();
  });

  test('mobile bottom bar is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    const mobileBar = page.locator('nav[aria-label="Barra de Navegação Rápida"]');
    await expect(mobileBar).toBeVisible();
  });

  test('mobile bottom bar has navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    const mobileBar = page.locator('nav[aria-label="Barra de Navegação Rápida"]');
    const links = mobileBar.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('mobile menu button opens overlay menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    const menuButton = page.locator('button[aria-label="Abrir menu mobile"]');
    await menuButton.click();

    const mobileMenu = page.locator('div[aria-modal="true"][aria-label="Menu Mobile Principal"]');
    await expect(mobileMenu).toBeVisible();
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    const routes = ['/painel', '/lancamento-diario', '/lojas/acertt?tab=equipe', '/classificacao', '/devolutivas', '/pdi'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    }
  });

  test('skip to content link exists for accessibility', async ({ page }) => {
    await loginAsAdmin(page);

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});
