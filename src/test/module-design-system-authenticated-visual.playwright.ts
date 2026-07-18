import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const VISUAL_STORE_ID = '11111111-1111-4111-8111-111111111111'

const profiles = [
  {
    key: 'gerente',
    email: 'visual-gerente@mxgestaopreditiva.com.br',
    role: 'gerente',
    path: '/gerente/ranking',
    moduleLabel: 'Módulo Gerencial',
    roleLabel: 'Gerente',
    storeId: VISUAL_STORE_ID,
  },
  {
    key: 'dono',
    email: 'visual-dono@mxgestaopreditiva.com.br',
    role: 'dono',
    path: '/lojas',
    moduleLabel: 'Módulo Executivo',
    roleLabel: 'Dono',
    storeId: VISUAL_STORE_ID,
  },
  {
    key: 'administrador-geral',
    email: 'visual-administrador-geral@mxgestaopreditiva.com.br',
    role: 'administrador_geral',
    path: '/painel',
    moduleLabel: 'Módulo Administrativo',
    roleLabel: 'Administrador geral',
  },
  {
    key: 'administrador-mx',
    email: 'visual-administrador-mx@mxgestaopreditiva.com.br',
    role: 'administrador_mx',
    path: '/painel',
    moduleLabel: 'Módulo Admin MX',
    roleLabel: 'Administrador MX',
  },
  {
    key: 'consultor-mx',
    email: 'visual-consultor-mx@mxgestaopreditiva.com.br',
    role: 'consultor_mx',
    path: '/consultoria/clientes',
    moduleLabel: 'Módulo Consultoria',
    roleLabel: 'Consultor MX',
  },
] as const

type VisualProfile = (typeof profiles)[number]

type ShellMetrics = {
  profile: string
  viewport: string
  sidebar: {
    width: number
    backgroundColor: string
    borderRightWidth: string
    borderRightColor: string
    boxShadow: string
  } | null
  mobileHeader: {
    height: number
    backgroundColor: string
    borderBottomWidth: string
  } | null
  content: {
    backgroundColor: string
    paddingLeft: string
    fontFamily: string
  }
  logo: { width: number; height: number } | null
  moduleLabel: {
    text: string
    color: string
    fontSize: string
    fontWeight: string
    letterSpacing: string
  }
  pageHeader: {
    backgroundColor: string
    borderRadius: string
    borderColor: string
    boxShadow: string
  } | null
  activeNavigationItems: number
  forbiddenLegacyNodes: number
  horizontalOverflow: boolean
}

async function installLocalVisualProfile(page: Page, profile: VisualProfile) {
  await page.addInitScript(
    ({ visualProfile, storageKey }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          id: `visual-${visualProfile.key}`,
          name: visualProfile.roleLabel,
          email: visualProfile.email,
          role: visualProfile.role,
          store_id: 'storeId' in visualProfile ? visualProfile.storeId : undefined,
          active: true,
          created_at: '2026-07-18T00:00:00.000Z',
        }),
      )
    },
    { visualProfile: profile, storageKey: 'mx_auth_profile' },
  )
}

async function visibleModuleLabel(page: Page) {
  return page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll<HTMLElement>('p, span'))
      .filter((node) => /^Módulo /.test(node.textContent?.trim() || ''))
    return labels.find((node) => node.getBoundingClientRect().width > 0)?.textContent?.trim() || ''
  })
}

async function collectMetrics(page: Page, profile: string, viewport: string): Promise<ShellMetrics> {
  return page.evaluate(({ profile, viewport }) => {
    const desktopSidebar = document.querySelector<HTMLElement>('aside[aria-label^="Menu principal"]')
    const mobileDrawer = document.querySelector<HTMLElement>('[role="dialog"][aria-label^="Menu principal"]')
    const navigationSurface = viewport === 'mobile' ? mobileDrawer : desktopSidebar
    const mobileHeader = document.querySelector<HTMLElement>('header.md\\:hidden')
    const content = document.querySelector<HTMLElement>('main#main-content')
    const visibleLogo = Array.from(document.querySelectorAll<HTMLImageElement>('img[alt="MX"]'))
      .find((node) => node.getBoundingClientRect().width > 0)
    const labels = Array.from(document.querySelectorAll<HTMLElement>('p, span'))
      .filter((node) => /^Módulo /.test(node.textContent?.trim() || ''))
    const visibleModuleLabel = labels.find((node) => node.getBoundingClientRect().width > 0)
    const visualScope = document.querySelector<HTMLElement>('[data-mx-visual-system="manager"]')
    const pageHeader = visualScope
      ? Array.from(visualScope.querySelectorAll<HTMLElement>('header'))
          .find((node) => node.getBoundingClientRect().width > 300)
      : null

    if (!content || !visibleModuleLabel) throw new Error('Shell universal não encontrado no DOM.')

    const contentStyle = getComputedStyle(content)
    const moduleStyle = getComputedStyle(visibleModuleLabel)
    const navigationStyle = navigationSurface ? getComputedStyle(navigationSurface) : null
    const mobileHeaderStyle = mobileHeader ? getComputedStyle(mobileHeader) : null
    const pageHeaderStyle = pageHeader ? getComputedStyle(pageHeader) : null
    const activeNavigationItems = navigationSurface
      ? Array.from(navigationSurface.querySelectorAll<HTMLElement>('a')).filter(
          (node) => getComputedStyle(node).backgroundColor === 'rgb(5, 150, 105)',
        ).length
      : 0

    return {
      profile,
      viewport,
      sidebar: navigationSurface && navigationSurface.getBoundingClientRect().width > 0 && navigationStyle
        ? {
            width: Math.round(navigationSurface.getBoundingClientRect().width),
            backgroundColor: navigationStyle.backgroundColor,
            borderRightWidth: navigationStyle.borderRightWidth,
            borderRightColor: navigationStyle.borderRightColor,
            boxShadow: navigationStyle.boxShadow,
          }
        : null,
      mobileHeader: mobileHeader && mobileHeader.getBoundingClientRect().height > 0 && mobileHeaderStyle
        ? {
            height: Math.round(mobileHeader.getBoundingClientRect().height),
            backgroundColor: mobileHeaderStyle.backgroundColor,
            borderBottomWidth: mobileHeaderStyle.borderBottomWidth,
          }
        : null,
      content: {
        backgroundColor: contentStyle.backgroundColor,
        paddingLeft: contentStyle.paddingLeft,
        fontFamily: contentStyle.fontFamily,
      },
      logo: visibleLogo
        ? {
            width: Math.round(visibleLogo.getBoundingClientRect().width),
            height: Math.round(visibleLogo.getBoundingClientRect().height),
          }
        : null,
      moduleLabel: {
        text: visibleModuleLabel.textContent?.trim() || '',
        color: moduleStyle.color,
        fontSize: moduleStyle.fontSize,
        fontWeight: moduleStyle.fontWeight,
        letterSpacing: moduleStyle.letterSpacing,
      },
      pageHeader: pageHeader && pageHeaderStyle
        ? {
            backgroundColor: pageHeaderStyle.backgroundColor,
            borderRadius: pageHeaderStyle.borderRadius,
            borderColor: pageHeaderStyle.borderColor,
            boxShadow: pageHeaderStyle.boxShadow,
          }
        : null,
      activeNavigationItems,
      forbiddenLegacyNodes: document.querySelectorAll(
        '.mxds-page-frame, .mx-internal-workspace, [class*="mxds-"]',
      ).length,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  }, { profile, viewport })
}

async function auditProfile(
  page: Page,
  testInfo: TestInfo,
  profile: VisualProfile,
  viewport: { width: number; height: number; name: string },
) {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await installLocalVisualProfile(page, profile)
  await page.goto(profile.path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 30_000 })

  if (viewport.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menu principal' }).click()
    await expect(
      page.getByRole('dialog', { name: `Menu principal do ${profile.roleLabel}` }),
    ).toBeVisible()
  }

  await expect.poll(() => visibleModuleLabel(page), { timeout: 20_000 }).toBe(profile.moduleLabel)
  await page.waitForTimeout(500)

  const metrics = await collectMetrics(page, profile.key, viewport.name)

  expect(metrics.moduleLabel.text).toBe(profile.moduleLabel)
  expect(metrics.forbiddenLegacyNodes).toBe(0)
  expect(metrics.horizontalOverflow).toBe(false)
  expect(metrics.logo).not.toBeNull()
  expect(metrics.activeNavigationItems).toBe(1)
  expect(metrics.pageHeader).toMatchObject({
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: '16px',
    borderColor: 'rgb(243, 244, 246)',
  })
  expect(metrics.pageHeader?.boxShadow).not.toBe('none')
  expect(pageErrors, `Erros de página em ${profile.key}/${viewport.name}`).toEqual([])

  if (viewport.name === 'desktop') {
    expect(metrics.sidebar).not.toBeNull()
    expect(metrics.sidebar?.width).toBe(224)
    expect(metrics.sidebar?.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(metrics.content.paddingLeft).toBe('224px')
  } else {
    expect(metrics.sidebar).not.toBeNull()
    expect(metrics.mobileHeader).not.toBeNull()
    expect(metrics.mobileHeader?.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(metrics.content.paddingLeft).toBe('0px')
  }

  writeFileSync(
    testInfo.outputPath(`${profile.key}-${viewport.name}-metrics.json`),
    JSON.stringify(metrics, null, 2),
  )
  await page.screenshot({
    path: testInfo.outputPath(`${profile.key}-${viewport.name}.png`),
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
  })

  return metrics
}

test.describe('paridade visual isolada dos módulos MX', () => {
  test.describe.configure({ timeout: 240_000 })

  test('desktop usa a mesma anatomia visual do Gerente', async ({ browser }, testInfo) => {
    const results: ShellMetrics[] = []
    for (const profile of profiles) {
      const context = await browser.newContext()
      const page = await context.newPage()
      results.push(await auditProfile(page, testInfo, profile, { width: 1440, height: 900, name: 'desktop' }))
      await context.close()
    }

    const reference = results.find((item) => item.profile === 'gerente')
    expect(reference?.sidebar).not.toBeNull()
    for (const result of results.filter((item) => item.profile !== 'gerente')) {
      expect(result.sidebar).toEqual(reference?.sidebar)
      expect(result.logo).toEqual(reference?.logo)
      expect({ ...result.moduleLabel, text: reference?.moduleLabel.text }).toEqual(reference?.moduleLabel)
      expect(result.content.backgroundColor).toBe(reference?.content.backgroundColor)
      expect(result.content.fontFamily).toBe(reference?.content.fontFamily)
    }
  })

  test('mobile usa a mesma anatomia visual do Gerente', async ({ browser }, testInfo) => {
    const results: ShellMetrics[] = []
    for (const profile of profiles) {
      const context = await browser.newContext()
      const page = await context.newPage()
      results.push(await auditProfile(page, testInfo, profile, { width: 390, height: 844, name: 'mobile' }))
      await context.close()
    }

    const reference = results.find((item) => item.profile === 'gerente')
    expect(reference?.mobileHeader).not.toBeNull()
    for (const result of results.filter((item) => item.profile !== 'gerente')) {
      expect(result.mobileHeader).toEqual(reference?.mobileHeader)
      expect(result.sidebar).toEqual(reference?.sidebar)
      expect(result.logo).toEqual(reference?.logo)
      expect({ ...result.moduleLabel, text: reference?.moduleLabel.text }).toEqual(reference?.moduleLabel)
      expect(result.content.backgroundColor).toBe(reference?.content.backgroundColor)
      expect(result.content.fontFamily).toBe(reference?.content.fontFamily)
    }
  })
})
