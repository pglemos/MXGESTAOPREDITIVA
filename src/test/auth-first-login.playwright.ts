import { expect, test } from '@playwright/test'
import {
  createE2EAdminUser,
  deleteE2EUser,
  E2E_DEFAULT_PASSWORD,
  getMustChangePassword,
  type E2EUser,
} from './e2e-helpers/supabase-admin'

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('First login forced password change', () => {
  let user: E2EUser | null = null

  test.afterEach(async () => {
    if (user) {
      await deleteE2EUser(user.id)
      user = null
    }
  })

  test('new user logs in with 123456, is blocked by modal, changes password, and is not prompted again', async ({ page }, testInfo) => {
    user = await createE2EAdminUser({
      prefix: `first-login-${testInfo.project.name}`,
      password: E2E_DEFAULT_PASSWORD,
      mustChangePassword: true,
    })

    await login(page, user.email, E2E_DEFAULT_PASSWORD)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(/Segurança MX/i, { timeout: 15000 })
    await expect(dialog).toContainText(/Proteja sua conta/i)
    await expect(page.getByRole('link', { name: /Ranking/i })).not.toBeVisible()

    const newPassword = `Mx#${Date.now()}!`
    await dialog.locator('input[placeholder="NOVA SENHA"]').fill(newPassword)
    await dialog.locator('input[placeholder="REPETIR SENHA"]').fill(newPassword)
    await dialog.getByRole('button', { name: /SALVAR E ACESSAR/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15000 })
    await expect.poll(() => getMustChangePassword(user!.id), { timeout: 15000 }).toBe(false)

    await page.evaluate(() => window.localStorage.clear())
    await page.context().clearCookies()

    await login(page, user.email, newPassword)
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
    await expect(page).toHaveURL(/\/(painel|dashboard|home|lojas|loja)/, { timeout: 15000 })
  })
})
