import { test, expect } from '@playwright/test'
import { waitForStable } from './helpers'

/**
 * Visual baseline — MXPerformanceLanding (Story 2.1 / UX-001 piloto).
 *
 * Captura snapshots em mobile (375px) e desktop (1280px). Threshold deve
 * ser configurado no playwright.config.ts (toHaveScreenshot.maxDiffPixelRatio).
 *
 * Para atualizar baseline pré-refactor:
 *   npx playwright test e2e/visual/landing.spec.ts --update-snapshots
 *
 * Animações (vapour/particle) e cursor custom devem ser pausados via
 * `prefers-reduced-motion: reduce` para estabilizar a screenshot.
 */
test.describe('MXPerformanceLanding - Visual Regression', () => {
  test.use({ colorScheme: 'dark' })

  test.beforeEach(async ({ page }) => {
    // Estabiliza animações para snapshot determinístico.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await waitForStable(page)
  })

  test('hero @ 1280px desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await waitForStable(page)
    await expect(page).toHaveScreenshot('landing-desktop-1280.png', {
      fullPage: false,
      animations: 'disabled',
    })
  })

  test('hero @ 375px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await waitForStable(page)
    await expect(page).toHaveScreenshot('landing-mobile-375.png', {
      fullPage: false,
      animations: 'disabled',
    })
  })
})
