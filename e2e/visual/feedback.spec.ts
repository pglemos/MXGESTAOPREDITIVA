import { test, expect } from '@playwright/test';
import { authenticate, waitForStable } from './helpers';

test.describe('Feedback Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto('/feedback');
    await waitForStable(page);
  });

  test('default state', async ({ page }) => {
    await expect(page).toHaveScreenshot('feedback-default.png');
  });

  test('new feedback form', async ({ page }) => {
    const newButton = page.locator('button', { hasText: /novo|criar|adicionar/i }).first();
    if (await newButton.isVisible()) {
      await newButton.click();
      await waitForStable(page);
      await expect(page).toHaveScreenshot('feedback-form.png');
    }
  });
});
