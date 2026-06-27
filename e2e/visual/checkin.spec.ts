import { test, expect } from '@playwright/test';
import { authenticate, waitForStable } from './helpers';

test.describe('Checkin Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, { role: 'vendedor' });
    await page.goto('/lancamento-diario');
    await waitForStable(page);
  });

  test('default state', async ({ page }) => {
    await expect(page).toHaveScreenshot('checkin-default.png');
  });

  test('form with data entered', async ({ page }) => {
    const inputs = page.locator('input[type="number"]:not([disabled]), input[type="text"]:not([disabled])').filter({ visible: true });
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await inputs.nth(i).fill('10');
    }
    await waitForStable(page);
    await expect(page).toHaveScreenshot('checkin-filled.png');
  });
});
