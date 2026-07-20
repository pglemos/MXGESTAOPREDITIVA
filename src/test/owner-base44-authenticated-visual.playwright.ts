import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { getVisualAuthPassword } from '../../e2e/visual/helpers'

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || 'dono@mxgestaopreditiva.com.br'
const PASSWORD = process.env.E2E_ROLE_PASSWORD || getVisualAuthPassword()
const OWNER_BASE_PATH = '/lojas/mx-consultoria'

const routes = [
  { key: 'inicio', path: OWNER_BASE_PATH },
  { key: 'rotina', path: `${OWNER_BASE_PATH}/rotina` },
  { key: 'decisoes', path: `${OWNER_BASE_PATH}/decisoes` },
  { key: 'plano-estrategico', path: `${OWNER_BASE_PATH}/plano-estrategico` },
  { key: 'plano-acao', path: `${OWNER_BASE_PATH}/plano-acao` },
  { key: 'consultoria', path: `${OWNER_BASE_PATH}/consultoria` },
  { key: 'departamentos', path: `${OWNER_BASE_PATH}/departamentos` },
  { key: 'visao-geral', path: `${OWNER_BASE_PATH}/departamentos/visao-geral` },
  { key: 'comercial', path: `${OWNER_BASE_PATH}/departamentos/comercial` },
  { key: 'marketing', path: `${OWNER_BASE_PATH}/departamentos/marketing` },
  { key: 'produto', path: `${OWNER_BASE_PATH}/departamentos/produto` },
  { key: 'rh', path: `${OWNER_BASE_PATH}/departamentos/rh` },
  { key: 'financeiro', path: `${OWNER_BASE_PATH}/departamentos/financeiro` },
  { key: 'operacional', path: `${OWNER_BASE_PATH}/departamentos/operacional` },
  { key: 'mercado', path: `${OWNER_BASE_PATH}/mercado` },
  { key: 'universidade', path: `${OWNER_BASE_PATH}/universidade` },
  { key: 'consultor', path: `${OWNER_BASE_PATH}/consultor` },
] as const

const viewports = [
  { key: 'desktop-1440', width: 1440, height: 900, mobile: false },
  { key: 'desktop-1280', width: 1280, height: 800, mobile: false },
  { key: 'tablet-landscape', width: 1024, height: 768, mobile: false },
  { key: 'tablet-portrait', width: 768, height: 1024, mobile: true },
  { key: 'mobile-390', width: 390, height: 844, mobile: true },
  { key: 'mobile-360', width: 360, height: 800, mobile: true },
] as const

type RouteMetric = {
  route: string
  viewport: string
  finalPath: string
  ownerRoot: boolean
  ownerMain: boolean
  universalMain: boolean
  universalSidebar: boolean
  ownerSidebarWidth: number
  ownerTopbarHeight: number
  activeNavigationItems: number
  horizontalOverflow: boolean
  pageErrors: string[]
}

async function loginAsOwner(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', OWNER_EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(lojas|home|painel)/, { timeout: 30_000 })
}

async function openOwnerRoute(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' })
  await expect(page.locator('.owner-base44-exact')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('main#owner-main-content')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('main#main-content')).toHaveCount(0)
}

async function auditRoute(
  page: Page,
  testInfo: TestInfo,
  route: (typeof routes)[number],
  viewport: (typeof viewports)[number],
): Promise<RouteMetric> {
  const pageErrors: string[] = []
  const onPageError = (error: Error) => pageErrors.push(error.message)
  page.on('pageerror', onPageError)

  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await openOwnerRoute(page, route.path)

  const sidebar = page.getByRole('complementary', { name: 'Menu principal do Dono' })
  if (viewport.mobile) {
    await expect(sidebar).not.toBeVisible()
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(sidebar).toBeVisible()
  } else {
    await expect(sidebar).toBeVisible()
  }

  const metric = await page.evaluate(
    ({ routeKey, viewportKey, collectedErrors }) => {
      const ownerRoot = document.querySelector<HTMLElement>('.owner-base44-exact')
      const ownerMain = document.querySelector<HTMLElement>('main#owner-main-content')
      const universalMain = document.querySelector<HTMLElement>('main#main-content')
      const ownerSidebar = document.querySelector<HTMLElement>('aside[aria-label="Menu principal do Dono"]')
      const ownerTopbar = document.querySelector<HTMLElement>('.owner-base44-exact__topbar')
      const universalSidebar = Array.from(document.querySelectorAll<HTMLElement>('aside[aria-label^="Menu principal"]'))
        .some((node) => node !== ownerSidebar && node.getBoundingClientRect().width > 0)

      return {
        route: routeKey,
        viewport: viewportKey,
        finalPath: window.location.pathname + window.location.search,
        ownerRoot: Boolean(ownerRoot),
        ownerMain: Boolean(ownerMain),
        universalMain: Boolean(universalMain),
        universalSidebar,
        ownerSidebarWidth: ownerSidebar ? Math.round(ownerSidebar.getBoundingClientRect().width) : 0,
        ownerTopbarHeight: ownerTopbar ? Math.round(ownerTopbar.getBoundingClientRect().height) : 0,
        activeNavigationItems: ownerSidebar?.querySelectorAll('a[aria-current="page"]').length || 0,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        pageErrors: collectedErrors,
      }
    },
    { routeKey: route.key, viewportKey: viewport.key, collectedErrors: pageErrors },
  )

  expect.soft(metric.ownerRoot, `${route.key}/${viewport.key}: escopo dedicado`).toBe(true)
  expect.soft(metric.ownerMain, `${route.key}/${viewport.key}: main dedicado`).toBe(true)
  expect.soft(metric.universalMain, `${route.key}/${viewport.key}: main universal`).toBe(false)
  expect.soft(metric.universalSidebar, `${route.key}/${viewport.key}: sidebar universal`).toBe(false)
  expect.soft(metric.horizontalOverflow, `${route.key}/${viewport.key}: overflow horizontal`).toBe(false)
  expect.soft(metric.activeNavigationItems, `${route.key}/${viewport.key}: item ativo`).toBe(1)
  expect.soft(metric.ownerTopbarHeight, `${route.key}/${viewport.key}: topbar`).toBeGreaterThanOrEqual(70)
  expect.soft(metric.ownerSidebarWidth, `${route.key}/${viewport.key}: sidebar`).toBe(viewport.mobile ? Math.min(320, viewport.width - 48) : 264)
  expect.soft(metric.pageErrors, `${route.key}/${viewport.key}: erros de página`).toEqual([])

  writeFileSync(
    testInfo.outputPath(`owner-${route.key}-${viewport.key}-metrics.json`),
    JSON.stringify(metric, null, 2),
  )

  await page.screenshot({
    path: testInfo.outputPath(`owner-${route.key}-${viewport.key}.png`),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })

  page.off('pageerror', onPageError)
  return metric
}

test.describe('módulo Dono Base44 com shell dedicado', () => {
  test.describe.configure({ timeout: 900_000 })

  test('percorre todas as superfícies e viewports sem retornar ao shell universal', async ({ browser }, testInfo) => {
    const results: RouteMetric[] = []

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
      const page = await context.newPage()
      await loginAsOwner(page)

      for (const route of routes) {
        results.push(await auditRoute(page, testInfo, route, viewport))
      }

      await context.close()
    }

    writeFileSync(testInfo.outputPath('owner-base44-route-matrix.json'), JSON.stringify(results, null, 2))
    expect(results).toHaveLength(routes.length * viewports.length)
  })
})
