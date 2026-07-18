import { expect, test } from '@playwright/test'

const routes = ['/painel', '/lojas', '/agenda', '/consultoria/clientes', '/auditoria', '/configuracoes']

for (const route of routes) {
  test(`${route} não cria overflow horizontal global`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('[data-mx-component="app-shell"]')).toBeVisible({ timeout: 20_000 })
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    expect(hasOverflow).toBe(false)
  })
}

test('menu da conta contém as quatro ações normativas', async ({ page }) => {
  await page.goto('/painel')
  await page.getByRole('button', { name: /Administrador|Consultor|MX/i }).last().click()
  for (const label of ['Meu Perfil', 'Preferências', 'Notificações', 'Sair']) {
    await expect(page.getByRole('menuitem', { name: label })).toBeVisible()
  }
})
