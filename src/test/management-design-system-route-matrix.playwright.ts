import { test, expect, type Browser, type Page, type TestInfo } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { managementRouteManifest } from '@/design-system/management/managementRouteManifest.js'

const VISUAL_STORE_ID = '11111111-1111-4111-8111-111111111111'

const roleProfiles = {
  administrador_geral: {
    key: 'administrador-geral',
    email: 'visual-administrador-geral@mxgestaopreditiva.com.br',
    role: 'administrador_geral',
    roleLabel: 'Administrador geral',
    moduleLabel: 'Módulo Administrativo',
  },
  administrador_mx: {
    key: 'administrador-mx',
    email: 'visual-administrador-mx@mxgestaopreditiva.com.br',
    role: 'administrador_mx',
    roleLabel: 'Administrador MX',
    moduleLabel: 'Módulo Admin MX',
  },
  consultor_mx: {
    key: 'consultor-mx',
    email: 'visual-consultor-mx@mxgestaopreditiva.com.br',
    role: 'consultor_mx',
    roleLabel: 'Consultor MX',
    moduleLabel: 'Módulo Consultoria',
  },
  dono: {
    key: 'dono',
    email: 'visual-dono@mxgestaopreditiva.com.br',
    role: 'dono',
    roleLabel: 'Dono',
    moduleLabel: 'Módulo Executivo',
  },
} as const

type ManagementRole = keyof typeof roleProfiles
type ViewportName = 'desktop' | 'mobile'

const viewportMatrix = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const

function representativeRole(roles: readonly string[]): ManagementRole {
  for (const role of ['administrador_mx', 'consultor_mx', 'dono', 'administrador_geral'] as const) {
    if (roles.includes(role)) return role
  }
  throw new Error(`Rota sem perfil representativo: ${roles.join(', ')}`)
}

function isForbiddenLegacyClass(token: string) {
  if (token === 'mx-auto' || token === 'mx-manager-scope') return false
  return (
    token.includes('-mx-') ||
    token.startsWith('rounded-mx-') ||
    token.startsWith('shadow-mx-') ||
    token.startsWith('text-text-') ||
    token.startsWith('bg-surface-') ||
    token.startsWith('border-border-') ||
    token.includes('brand-primary') ||
    token.includes('brand-secondary') ||
    token.includes('pure-black') ||
    token.includes('status-success') ||
    token.includes('status-warning') ||
    token.includes('status-error') ||
    token.includes('status-info') ||
    token.startsWith('mxds-') ||
    token.startsWith('mx-internal-')
  )
}

async function installProfile(page: Page, role: ManagementRole) {
  const profile = roleProfiles[role]
  await page.addInitScript(
    ({ visualProfile, storeId }) => {
      window.localStorage.setItem(
        'mx_auth_profile',
        JSON.stringify({
          id: `visual-${visualProfile.key}`,
          name: visualProfile.roleLabel,
          email: visualProfile.email,
          role: visualProfile.role,
          store_id: storeId,
          active: true,
          created_at: '2026-07-18T00:00:00.000Z',
        }),
      )
    },
    { visualProfile: profile, storeId: VISUAL_STORE_ID },
  )
}

async function installSyntheticSupabaseMocks(page: Page) {
  await page.route(/https:\/\/[^/]+\.supabase\.co\/rest\/v1\/.*/, async (route) => {
    const request = route.request()
    const accept = request.headers()['accept'] || ''
    const expectsObject = accept.includes('application/vnd.pgrst.object+json')
    const isHead = request.method() === 'HEAD'

    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-range': '0-0/0',
      },
      body: isHead ? '' : expectsObject ? '{}' : '[]',
    })
  })

  await page.route(/https:\/\/[^/]+\.supabase\.co\/functions\/v1\/.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })
}

async function auditRenderedSurface(page: Page) {
  return page.evaluate(() => {
    const isForbidden = (token: string) => {
      if (token === 'mx-auto' || token === 'mx-manager-scope') return false
      return (
        token.includes('-mx-') ||
        token.startsWith('rounded-mx-') ||
        token.startsWith('shadow-mx-') ||
        token.startsWith('text-text-') ||
        token.startsWith('bg-surface-') ||
        token.startsWith('border-border-') ||
        token.includes('brand-primary') ||
        token.includes('brand-secondary') ||
        token.includes('pure-black') ||
        token.includes('status-success') ||
        token.includes('status-warning') ||
        token.includes('status-error') ||
        token.includes('status-info') ||
        token.startsWith('mxds-') ||
        token.startsWith('mx-internal-')
      )
    }
    const legacyClasses = Array.from(document.querySelectorAll<HTMLElement>('[class]'))
      .flatMap((node) => (node.getAttribute('class') || '').split(/\s+/).filter(Boolean))
      .filter((token) => isForbidden(token))
    const visualScope = document.querySelector<HTMLElement>('[data-mx-visual-system="manager"]')
    const main = document.querySelector<HTMLElement>('main#main-content')
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))
      .filter((node) => node.getBoundingClientRect().width > 0)

    return {
      legacyClasses: [...new Set(legacyClasses)].sort(),
      hasVisualScope: Boolean(visualScope),
      contentLength: (main?.innerText || '').trim().length,
      bodyText: document.body.innerText.slice(0, 2_000),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      visibleDialogs: dialogs.length,
      rootBackground: visualScope ? getComputedStyle(visualScope).backgroundColor : '',
    }
  })
}

async function exerciseNonDestructiveInteraction(page: Page) {
  const tab = page.locator('[role="tab"]:not([aria-selected="true"]):visible').first()
  if (await tab.count()) {
    await tab.click({ timeout: 3_000 }).catch(() => undefined)
    await page.waitForTimeout(100)
  }

  const dialogTrigger = page.locator('[aria-haspopup="dialog"]:visible').first()
  if (await dialogTrigger.count()) {
    await dialogTrigger.click({ timeout: 3_000 }).catch(() => undefined)
    await page.waitForTimeout(100)
    if (await page.locator('[role="dialog"]:visible').count()) {
      await page.keyboard.press('Escape')
    }
  }
}

async function auditRoute(
  browser: Browser,
  testInfo: TestInfo,
  route: (typeof managementRouteManifest)[number],
  viewportName: ViewportName,
) {
  const role = representativeRole(route.roles)
  const profile = roleProfiles[role]
  const context = await browser.newContext({ viewport: viewportMatrix[viewportName] })
  const page = await context.newPage()
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await installSyntheticSupabaseMocks(page)
  await installProfile(page, role)
  await page.goto(route.path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[data-mx-visual-system="manager"]')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(250)
  await exerciseNonDestructiveInteraction(page)

  const audit = await auditRenderedSurface(page)
  expect(audit.hasVisualScope).toBe(true)
  expect(audit.contentLength, `Conteúdo vazio em ${route.key}`).toBeGreaterThan(0)
  expect(audit.legacyClasses, `Legado renderizado em ${route.key}/${viewportName}`).toEqual([])
  expect(audit.horizontalOverflow, `Overflow horizontal em ${route.key}/${viewportName}`).toBe(false)
  expect(audit.bodyText).not.toContain('Página não encontrada')
  expect(audit.bodyText).not.toContain('Acesso negado')
  expect(audit.bodyText).not.toContain('Rota não autorizada')
  expect(pageErrors, `pageerror em ${route.key}/${viewportName}`).toEqual([])
  const unexpectedConsoleErrors = consoleErrors.filter((message) => {
    if (message.includes('Failed to load resource')) return false
    // Perfis desta matriz são sintéticos e não possuem sessão Supabase.
    // A auditoria autenticada separada continua validando erros reais de permissão.
    if (/\b42501\b/.test(message)) return false
    return true
  })
  expect(
    unexpectedConsoleErrors,
    `console.error em ${route.key}/${viewportName}`,
  ).toEqual([])

  const artifactBase = `${route.key}-${profile.key}-${viewportName}`
  writeFileSync(
    testInfo.outputPath(`${artifactBase}.json`),
    JSON.stringify({ route, role, viewportName, audit, pageErrors, consoleErrors }, null, 2),
  )
  await page.screenshot({
    path: testInfo.outputPath(`${artifactBase}.png`),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })
  await context.close()
}

test.describe('matriz real das superfícies de gestão', () => {
  test.describe.configure({ timeout: 1_800_000, mode: 'serial' })

  for (const viewportName of ['desktop', 'mobile'] as const) {
    test(`${viewportName}: todas as rotas do manifesto estão livres do legado visual`, async ({ browser }, testInfo) => {
      for (const route of managementRouteManifest) {
        await test.step(`${route.key} ${route.path}`, async () => {
          await auditRoute(browser, testInfo, route, viewportName)
        })
      }
    })
  }
})
