import { test, expect } from '@playwright/test';
import { authenticate, waitForStable } from './helpers';

test.describe('PDI Wizard - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto('/pdi');
    await waitForStable(page);
  });

  test('default state', async ({ page }) => {
    await expect(page).toHaveScreenshot('pdi-default.png');
  });

  test('wizard step content', async ({ page }) => {
    const nextButton = page.locator('button', { hasText: /pr[oó]xim|avan[cç]ar|next/i }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForStable(page);
      await expect(page).toHaveScreenshot('pdi-step2.png');
    }
  });
});
