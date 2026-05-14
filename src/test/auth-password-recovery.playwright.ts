import { expect, test } from '@playwright/test'
import {
  createE2EAdminUser,
  createPasswordRecoverySession,
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

test.describe('Password recovery login flow', () => {
  let user: E2EUser | null = null

  test.afterEach(async () => {
    if (user) {
      await deleteE2EUser(user.id)
      user = null
    }
  })

  test('forgot password request validates email and confirms a generic send message', async ({ page }) => {
    await page.route('**/auth/v1/recover*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      })
    })

    await page.goto('/login')
    await expect(page.getByRole('button', { name: /Esqueci minha senha/i })).toBeVisible()

    await page.getByRole('button', { name: /Esqueci minha senha/i }).click()
    await expect(page.getByRole('heading', { name: /Recuperar acesso/i })).toBeVisible()

    await page.getByRole('button', { name: /Enviar link/i }).click()
    await expect(page.getByText(/E-mail e obrigatorio/i)).toBeVisible()

    await page.fill('input[type="email"]', 'email-invalido')
    await page.getByRole('button', { name: /Enviar link/i }).click()
    await expect(page.getByText(/Informe um e-mail valido/i)).toBeVisible()

    await page.fill('input[type="email"]', 'pessoa@mxperformance.test')
    await page.getByRole('button', { name: /Enviar link/i }).click()
    await expect(page.getByText(/Se o e-mail estiver autorizado/i)).toBeVisible()
  })

  test('recovery link lets a user set a new password and clears must_change_password', async ({ page }, testInfo) => {
    user = await createE2EAdminUser({
      prefix: `password-recovery-${testInfo.project.name}`,
      password: E2E_DEFAULT_PASSWORD,
      mustChangePassword: true,
    })

    const recoverySession = await createPasswordRecoverySession(user.email)
    const newPassword = `Mx#${Date.now()}!`

    await page.goto(`/login?recovery=1#access_token=${recoverySession.accessToken}&refresh_token=${recoverySession.refreshToken}&expires_in=${recoverySession.expiresIn}&token_type=bearer&type=recovery`)
    await expect(page.getByRole('heading', { name: /Definir nova senha/i })).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Salvar senha/i }).click()
    await expect(page.getByText(/Nova senha e obrigatoria/i)).toBeVisible()

    await page.fill('#recovery-password', newPassword)
    await page.fill('#recovery-password-confirm', `${newPassword}x`)
    await page.getByRole('button', { name: /Salvar senha/i }).click()
    await expect(page.getByText(/As senhas nao coincidem/i)).toBeVisible()

    await page.fill('#recovery-password-confirm', newPassword)
    await page.getByRole('button', { name: /Salvar senha/i }).click()
    await expect(page.getByText(/Senha redefinida com sucesso/i)).toBeVisible({ timeout: 15000 })
    await expect.poll(() => getMustChangePassword(user!.id), { timeout: 15000 }).toBe(false)

    await login(page, user.email, E2E_DEFAULT_PASSWORD)
    await expect(page.getByText(/E-mail ou senha inválidos/i)).toBeVisible()

    await login(page, user.email, newPassword)
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 15000 })
    await expect(page).toHaveURL(/\/(painel|dashboard|home|lojas|loja)/, { timeout: 15000 })
  })
})
