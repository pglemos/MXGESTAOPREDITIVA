import { expect, test, type Page } from '@playwright/test'
import {
  createE2EPassword,
  createE2EAdminUser,
  deleteE2EUser,
  type E2EUser,
} from './e2e-helpers/supabase-admin'
import { getE2ERolePassword } from './e2e-helpers/auth'

const STORE_SLUG = 'mx-consultoria'
const PASSWORD = getE2ERolePassword()

const STORE_USERS = {
  dono: { email: 'dono@mxgestaopreditiva.com.br', password: PASSWORD },
  gerente: { email: 'gerente@mxgestaopreditiva.com.br', password: PASSWORD },
  vendedor: { email: 'vendedor@mxgestaopreditiva.com.br', password: PASSWORD },
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 20000 })
}

async function expectRoute(page: Page, path: string, expectedPath: RegExp) {
  await page.goto(path)
  await expect(page).toHaveURL(expectedPath, { timeout: 20000 })
  await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 20000 })
}

test.describe('MX Consultoria release gate - authenticated role smoke', () => {
  let adminMaster: E2EUser | null = null

  test.afterEach(async () => {
    if (!adminMaster) return
    await deleteE2EUser(adminMaster.id)
    adminMaster = null
  })

  test('admin master can access PMR consultation surfaces', async ({ page }) => {
    const adminPassword = createE2EPassword('MxConsultoria')
    adminMaster = await createE2EAdminUser({
      prefix: 'e2e-admin-master-mx-cons-dev',
      role: 'administrador_geral',
      name: 'E2E Admin Master MX Consultoria',
      password: adminPassword,
    })

    await login(page, adminMaster.email, adminMaster.password)
    await expectRoute(page, '/painel', /\/painel/)
    await expectRoute(page, '/agenda', /\/agenda/)
    await expectRoute(page, '/consultoria\/clientes', /\/consultoria\/clientes/)
    await expect(page.locator('main#main-content').getByText(/CRM de Consultoria|Consultoria/i).first()).toBeVisible({ timeout: 20000 })
  })

  test('store roles land on their allowed operating surfaces', async ({ page }) => {
    await login(page, STORE_USERS.dono.email, STORE_USERS.dono.password)
    await expectRoute(page, '/lojas', /\/lojas/)
    await expectRoute(page, `/lojas/${STORE_SLUG}`, new RegExp(`/lojas/${STORE_SLUG}`))

    await page.context().clearCookies()
    await page.evaluate(() => window.localStorage.clear())

    await login(page, STORE_USERS.gerente.email, STORE_USERS.gerente.password)
    await expectRoute(page, `/lojas/${STORE_SLUG}`, new RegExp(`/lojas/${STORE_SLUG}`))
    await expectRoute(page, '/rotina', /\/rotina/)

    await page.context().clearCookies()
    await page.evaluate(() => window.localStorage.clear())

    await login(page, STORE_USERS.vendedor.email, STORE_USERS.vendedor.password)
    await expectRoute(page, '/home', /\/home/)
    await expectRoute(page, '/lancamento-diario', /\/lancamento-diario/)
    await expectRoute(page, '/treinamentos', /\/treinamentos/)
  })

  test('store roles are redirected away from internal consultation routes', async ({ page }) => {
    await login(page, STORE_USERS.dono.email, STORE_USERS.dono.password)
    await page.goto('/consultoria/clientes')
    await expect(page).toHaveURL(/\/lojas/, { timeout: 20000 })

    await page.context().clearCookies()
    await page.evaluate(() => window.localStorage.clear())

    await login(page, STORE_USERS.gerente.email, STORE_USERS.gerente.password)
    await page.goto('/consultoria/clientes')
    await expect(page).toHaveURL(new RegExp(`/lojas/${STORE_SLUG}|/lojas`), { timeout: 20000 })

    await page.context().clearCookies()
    await page.evaluate(() => window.localStorage.clear())

    await login(page, STORE_USERS.vendedor.email, STORE_USERS.vendedor.password)
    await page.goto('/consultoria/clientes')
    await expect(page).toHaveURL(/\/home/, { timeout: 20000 })
  })
})
