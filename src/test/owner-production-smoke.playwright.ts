import { expect, test, type ConsoleMessage, type Page, type TestInfo } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL || 'dono@mxgestaopreditiva.com.br'
const OWNER_PASSWORD = process.env.E2E_ROLE_PASSWORD || process.env.E2E_AUTH_PASSWORD

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1024', width: 1024, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
] as const

type RouteDefinition = {
  key: string
  path: string
  expectedText: string[]
  cockpit: boolean
}

type RouteMetric = {
  route: string
  viewport: string
  requestedPath: string
  finalUrl: string
  status: number | null
  runtime: string
  horizontalOverflow: boolean
  ownerScope: boolean
  ownerScopeContainsSidebar: boolean
  contentFont: string
  headingFont: string
  sidebarVisible: boolean
  mobileHeaderVisible: boolean
  consoleErrors: string[]
  pageErrors: string[]
}

function ownerSectionPath(basePath: string, section?: string) {
  const url = new URL(basePath, 'https://mxperformance.com.br')
  if (section) url.searchParams.set('ownerSection', section)
  else url.searchParams.delete('ownerSection')
  return `${url.pathname}${url.search}`
}

function buildRoutes(basePath: string): RouteDefinition[] {
  return [
    { key: 'inicio', path: ownerSectionPath(basePath), expectedText: ['Previsão de Vendas Hoje', 'MX Score'], cockpit: true },
    { key: 'rotina-do-dia', path: ownerSectionPath(basePath, 'rotina'), expectedText: ['Rotina do Dia'], cockpit: true },
    { key: 'central-de-decisoes', path: ownerSectionPath(basePath, 'decisoes'), expectedText: ['Central de Decisões'], cockpit: true },
    { key: 'plano-estrategico', path: ownerSectionPath(basePath, 'planejamento'), expectedText: ['Plano Estratégico', 'Planejamento Estratégico'], cockpit: true },
    { key: 'plano-de-acao', path: ownerSectionPath(basePath, 'plano-acao'), expectedText: ['Plano de Ação'], cockpit: true },
    { key: 'consultoria', path: ownerSectionPath(basePath, 'consultoria'), expectedText: ['Consultoria'], cockpit: true },
    { key: 'departamentos', path: ownerSectionPath(basePath, 'departamentos'), expectedText: ['Departamentos'], cockpit: true },
    { key: 'departamentos-visao-geral', path: ownerSectionPath(basePath, 'departamentos-visao-geral'), expectedText: ['Visão Geral', 'Departamentos'], cockpit: true },
    { key: 'departamentos-comercial', path: ownerSectionPath(basePath, 'departamentos-comercial'), expectedText: ['Comercial'], cockpit: true },
    { key: 'departamentos-marketing', path: ownerSectionPath(basePath, 'departamentos-marketing'), expectedText: ['Marketing'], cockpit: true },
    { key: 'departamentos-produto', path: ownerSectionPath(basePath, 'departamentos-produto'), expectedText: ['Produto e Estoque', 'Produto'], cockpit: true },
    { key: 'departamentos-rh', path: ownerSectionPath(basePath, 'departamentos-rh'), expectedText: ['Pessoas — RH', 'Recursos Humanos', 'RH'], cockpit: true },
    { key: 'departamentos-financeiro', path: ownerSectionPath(basePath, 'departamentos-financeiro'), expectedText: ['Financeiro'], cockpit: true },
    { key: 'departamentos-operacional', path: ownerSectionPath(basePath, 'departamentos-operacional'), expectedText: ['Operações', 'Operacional'], cockpit: true },
    { key: 'mercado', path: ownerSectionPath(basePath, 'mercado'), expectedText: ['Mercado', 'Benchmarking'], cockpit: true },
    { key: 'universidade-mx', path: ownerSectionPath(basePath, 'universidade'), expectedText: ['Universidade MX'], cockpit: true },
    { key: 'falar-com-consultor', path: '/falar-consultor', expectedText: ['Falar com Consultor', 'Consultor MX'], cockpit: false },
  ]
}

async function loginAsOwner(page: Page) {
  if (!OWNER_PASSWORD) throw new Error('E2E_ROLE_PASSWORD ou E2E_AUTH_PASSWORD não configurado.')

  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', OWNER_EMAIL)
  await page.fill('input[type="password"]', OWNER_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 30_000 })
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
}

async function discoverOwnerBasePath(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  const startLink = page.getByRole('link', { name: 'Início', exact: true }).first()
  await expect(startLink).toBeVisible({ timeout: 20_000 })
  const href = await startLink.getAttribute('href')
  if (!href || !href.startsWith('/lojas/')) {
    throw new Error(`Rota canônica da loja não encontrada no link Início: ${href ?? 'null'}`)
  }
  return href
}

async function auditRoute(
  page: Page,
  testInfo: TestInfo,
  viewport: (typeof viewports)[number],
  route: RouteDefinition,
): Promise<RouteMetric> {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const onConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const onPageError = (error: Error) => pageErrors.push(error.message)

  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)

  const metric = await page.evaluate(
    ({ routeKey, viewportName, requestedPath, collectedConsoleErrors, collectedPageErrors }) => {
      const main = document.querySelector<HTMLElement>('main#main-content')
      if (!main) throw new Error('main#main-content não encontrado.')

      const ownerScope = document.querySelector<HTMLElement>('.owner-base44-scope')
      const heading = ownerScope?.querySelector<HTMLElement>('h1, h2, h3') || main.querySelector<HTMLElement>('h1, h2, h3')
      const sidebar = document.querySelector<HTMLElement>('aside[aria-label^="Menu principal"]')
      const mobileHeader = document.querySelector<HTMLElement>('header.md\\:hidden')

      return {
        route: routeKey,
        viewport: viewportName,
        requestedPath,
        finalUrl: window.location.href,
        runtime: document.documentElement.dataset.mxRuntime || '',
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        ownerScope: Boolean(ownerScope),
        ownerScopeContainsSidebar: Boolean(ownerScope && sidebar && ownerScope.contains(sidebar)),
        contentFont: ownerScope ? getComputedStyle(ownerScope).fontFamily : getComputedStyle(main).fontFamily,
        headingFont: heading ? getComputedStyle(heading).fontFamily : '',
        sidebarVisible: Boolean(sidebar && sidebar.getBoundingClientRect().width > 0),
        mobileHeaderVisible: Boolean(mobileHeader && mobileHeader.getBoundingClientRect().height > 0),
        consoleErrors: collectedConsoleErrors,
        pageErrors: collectedPageErrors,
        visibleText: main.innerText,
      }
    },
    {
      routeKey: route.key,
      viewportName: viewport.name,
      requestedPath: route.path,
      collectedConsoleErrors: consoleErrors,
      collectedPageErrors: pageErrors,
    },
  )

  const output: RouteMetric = {
    route: metric.route,
    viewport: metric.viewport,
    requestedPath: metric.requestedPath,
    finalUrl: metric.finalUrl,
    status: response?.status() ?? null,
    runtime: metric.runtime,
    horizontalOverflow: metric.horizontalOverflow,
    ownerScope: metric.ownerScope,
    ownerScopeContainsSidebar: metric.ownerScopeContainsSidebar,
    contentFont: metric.contentFont,
    headingFont: metric.headingFont,
    sidebarVisible: metric.sidebarVisible,
    mobileHeaderVisible: metric.mobileHeaderVisible,
    consoleErrors: metric.consoleErrors,
    pageErrors: metric.pageErrors,
  }

  writeFileSync(
    testInfo.outputPath(`${viewport.name}-${route.key}.json`),
    JSON.stringify(output, null, 2),
  )
  await page.screenshot({
    path: testInfo.outputPath(`${viewport.name}-${route.key}.png`),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })

  expect.soft(output.status, `${viewport.name}/${route.key}: status HTTP`).not.toBeNull()
  expect.soft(output.status ?? 500, `${viewport.name}/${route.key}: status HTTP`).toBeLessThan(400)
  expect.soft(output.runtime, `${viewport.name}/${route.key}: runtime`).toBe('universal-shell-v2')
  expect.soft(output.horizontalOverflow, `${viewport.name}/${route.key}: overflow horizontal`).toBe(false)
  expect.soft(output.ownerScopeContainsSidebar, `${viewport.name}/${route.key}: sidebar fora do escopo Base44`).toBe(false)
  expect.soft(output.consoleErrors, `${viewport.name}/${route.key}: console errors`).toEqual([])
  expect.soft(output.pageErrors, `${viewport.name}/${route.key}: page errors`).toEqual([])
  expect.soft(
    route.expectedText.some((text) => metric.visibleText.includes(text)),
    `${viewport.name}/${route.key}: conteúdo esperado (${route.expectedText.join(' | ')})`,
  ).toBe(true)

  if (route.cockpit) {
    expect.soft(output.ownerScope, `${viewport.name}/${route.key}: escopo Base44`).toBe(true)
    expect.soft(output.contentFont.toLowerCase(), `${viewport.name}/${route.key}: Lexend`).toContain('lexend')
    expect.soft(output.headingFont.toLowerCase(), `${viewport.name}/${route.key}: Outfit`).toContain('outfit')
  }

  if (viewport.width >= 768) {
    expect.soft(output.sidebarVisible, `${viewport.name}/${route.key}: sidebar desktop/tablet`).toBe(true)
  } else {
    expect.soft(output.mobileHeaderVisible, `${viewport.name}/${route.key}: cabeçalho mobile`).toBe(true)
  }

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  return output
}

test.describe('produção do módulo Dono Base44', () => {
  test.describe.configure({ timeout: 900_000 })

  test('valida todas as rotas em 1440, 1024, 768 e 390 px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsOwner(page)
    const basePath = await discoverOwnerBasePath(page)
    const routes = buildRoutes(basePath)
    const metrics: RouteMetric[] = []

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const route of routes) {
        metrics.push(await auditRoute(page, testInfo, viewport, route))
      }
    }

    writeFileSync(testInfo.outputPath('owner-production-matrix.json'), JSON.stringify(metrics, null, 2))
  })
})
