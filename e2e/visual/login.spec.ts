import { test, expect } from '@playwright/test';
import { waitForStable } from './helpers';

test.describe('Login Page - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForStable(page);
  });

  test('default state', async ({ page }) => {
    await expect(page).toHaveScreenshot('login-default.png');
  });

  test('with filled credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await expect(page).toHaveScreenshot('login-filled.png');
  });

  test('validation error state', async ({ page }) => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-validation-error.png');
  });
});
