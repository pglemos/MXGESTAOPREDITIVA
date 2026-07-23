import { expect, test } from '@playwright/test'
import { loginAsOwner } from './e2e-helpers/owner-auth'

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL

test.describe('Dono — fluxos atuais não mutáveis', () => {
  test.describe.configure({ timeout: 180_000 })

  test('período, refresh, alertas, benchmarking, notificações e rotas usam dados reais', async ({ page }) => {
    test.skip(!OWNER_EMAIL, 'E2E_OWNER_EMAIL é obrigatório')

    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    const requests: Array<{ url: string; method: string; body: string | null }> = []
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('request', request => {
      if (request.url().includes('/rest/v1/') || request.url().includes('/rpc/')) {
        requests.push({ url: request.url(), method: request.method(), body: request.postData() })
      }
    })

    await loginAsOwner(page, { email: OWNER_EMAIL })
    await page.goto('/dono', { waitUntil: 'networkidle' })
    await expect(page.getByText('Estoque (Unid.)')).toBeVisible()
    await expect(page.getByText('Dados indisponíveis')).toHaveCount(0)

    const period = page.getByLabel('Período')
    requests.length = 0
    await period.selectOption('quarter')
    await expect(period).toHaveValue('quarter')
    await expect(page.getByLabel('Conteúdo do módulo Dono').getByText('Trimestre atual', { exact: true })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(requests.some(request =>
      request.url.includes('reference_date=gte.') ||
      (request.url.includes('/rpc/get_lancamentos_por_loja_periodo') && request.body?.includes('"p_start_date"')),
    ), JSON.stringify(requests)).toBe(true)

    requests.length = 0
    await period.selectOption('custom')
    await page.getByLabel('Início do período personalizado').fill('2026-07-05')
    await page.getByLabel('Fim do período personalizado').fill('2026-07-10')
    await expect(page.getByText('05/07/2026 — 10/07/2026', { exact: true }).first()).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(requests.some(request =>
      request.url.includes('reference_date=gte.2026-07-05') || request.body?.includes('"p_start_date":"2026-07-05"'),
    )).toBe(true)
    expect(requests.some(request =>
      request.url.includes('reference_date=lte.2026-07-10') || request.body?.includes('"p_end_date":"2026-07-10"'),
    )).toBe(true)

    await page.getByLabel('Atualizar dados').click()
    await expect(page.getByText('Performance sincronizada!')).toBeVisible({ timeout: 30_000 })

    await page.goto('/dono/alertas', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Alertas Inteligentes' })).toBeVisible()
    await page.getByLabel('Filtrar status dos alertas').selectOption('danger')
    await page.getByPlaceholder('Buscar alerta...').fill('texto sem correspondência')
    await expect(page.getByText('Nenhum alerta corresponde aos filtros.')).toBeVisible()

    await page.goto('/dono/benchmarking', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Benchmarking' })).toBeVisible()
    requests.length = 0
    await page.getByLabel('Grupo de comparação do benchmarking').selectOption('regiao')
    await page.waitForLoadState('networkidle')
    const benchmarkRequests = requests.filter(request => request.url.includes('/rpc/get_benchmark'))
    expect(benchmarkRequests.length).toBeGreaterThanOrEqual(3)
    expect(benchmarkRequests.every(request => request.body?.includes('"p_peer_group":"regiao"'))).toBe(true)

    await page.goto('/dono', { waitUntil: 'networkidle' })
    await page.getByLabel('Notificações').click()
    await expect(page).toHaveURL(/\/dono\/alertas$/)

    for (const route of ['/dono/agenda', '/dono/resultados', '/dono/benchmarking']) {
      await page.goto(route, { waitUntil: 'networkidle' })
      await expect(page).toHaveURL(new RegExp(`${route}$`))
    }
    await expect(page.getByRole('heading', { name: 'Benchmarking' })).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})
