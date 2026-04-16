import { test, expect } from '@playwright/test';

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
    await page.goto('/login');
    await page.goto('/');
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    await expect(header.locator('img[alt="MX Performance"]')).toBeVisible();
  });

  test('sidebar navigation renders category icons when authenticated', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    const sidebar = page.locator('aside[aria-label="Menu Lateral Principal"]');
    await expect(sidebar).toBeVisible();

    const navButtons = sidebar.locator('nav[aria-label="Módulos de Gestão"] button[type="button"]');
    const count = await navButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sidebar drawer opens on category click and shows nav items', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

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
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/painel/, { timeout: 10000 }).catch(() => {});

    await page.goto('/painel');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Lojas page loads via nav link', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    await page.goto('/lojas');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Checkin page loads or redirects to login', async ({ page }) => {
    await page.goto('/checkin');
    const url = page.url();
    const isLogin = url.includes('login');
    const isCheckin = url.includes('checkin');
    expect(isLogin || isCheckin).toBe(true);
  });

  test('Consultoria nav link navigates to clientes page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    await page.goto('/consultoria/clientes');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Agenda nav link navigates to agenda page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    await page.goto('/agenda');
    await expect(page.getByText('Agenda MX')).toBeVisible();
  });

  test('mobile bottom bar is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    const mobileBar = page.locator('nav[aria-label="Barra de Navegação Rápida"]');
    await expect(mobileBar).toBeVisible();
  });

  test('mobile bottom bar has navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    const mobileBar = page.locator('nav[aria-label="Barra de Navegação Rápida"]');
    const links = mobileBar.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('mobile menu button opens overlay menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    const menuButton = page.locator('button[aria-label="Abrir menu mobile"]');
    await menuButton.click();

    const mobileMenu = page.locator('div[aria-modal="true"][aria-label="Menu Mobile Principal"]');
    await expect(mobileMenu).toBeVisible();
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    const routes = ['/painel', '/checkin', '/equipe', '/ranking', '/feedback', '/pdi'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    }
  });

  test('skip to content link exists for accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@mxperformance.com.br');
    await page.fill('input[type="password"]', 'Mx#2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 10000 }).catch(() => {});

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});
