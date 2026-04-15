import { Page } from '@playwright/test';

export const VIEWPORTS = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

const AUTH_EMAIL =
  process.env.E2E_AUTH_EMAIL || 'admin@mxperformance.com.br';
const AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD || '';

export async function authenticate(page: Page): Promise<void> {
  if (!AUTH_PASSWORD) {
    throw new Error(
      'E2E_AUTH_PASSWORD env var is required for authenticated visual tests. ' +
        'Set it before running visual regression suites.',
    );
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', AUTH_EMAIL);
  await page.fill('input[type="password"]', AUTH_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 15000 });
  await waitForStable(page);
}

export async function waitForStable(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}
