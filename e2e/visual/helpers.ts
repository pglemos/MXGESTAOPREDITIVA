import { Page } from '@playwright/test';

export const VIEWPORTS = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

const AUTH_EMAIL =
  process.env.E2E_AUTH_EMAIL || 'admin@mxgestaopreditiva.com.br';
const DEV_BYPASS_STORAGE_KEY = 'mx_auth_profile';
const VISUAL_STORE_ID = '11111111-1111-4111-8111-111111111111';
const VISUAL_USER_ID = '22222222-2222-4222-8222-222222222222';

type VisualAuthRole = 'admin_master' | 'dono' | 'gerente' | 'vendedor';

interface AuthenticateOptions {
  role?: VisualAuthRole;
}

export function getVisualAuthPassword(): string {
  const password = process.env.E2E_AUTH_PASSWORD;
  if (!password) {
    throw new Error(
      'E2E_AUTH_PASSWORD env var is required for authenticated visual tests. ' +
        'Configure the secret before running visual regression suites.',
    );
  }
  return password;
}

export async function authenticate(page: Page, options: AuthenticateOptions = {}): Promise<void> {
  const role = options.role || 'admin_master';

  if (role !== 'admin_master') {
    await page.addInitScript(
      ({ storageKey, authRole, storeId, userId }) => {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            id: userId,
            name: authRole === 'vendedor' ? 'Visual Vendedor' : 'Visual Usuario',
            email: `visual-${authRole}@mxgestaopreditiva.com.br`,
            role: authRole,
            store_id: storeId,
            created_at: '2026-05-06T12:00:00.000Z',
          }),
        );
      },
      { storageKey: DEV_BYPASS_STORAGE_KEY, authRole: role, storeId: VISUAL_STORE_ID, userId: VISUAL_USER_ID },
    );
    await page.goto('/home');
    await waitForStable(page);
    return;
  }

  const password = getVisualAuthPassword();
  await page.goto('/login');
  await page.fill('input[type="email"]', AUTH_EMAIL);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(painel|home|loja|lojas)/, { timeout: 15000 });
  await waitForStable(page);
}

export async function waitForStable(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}
