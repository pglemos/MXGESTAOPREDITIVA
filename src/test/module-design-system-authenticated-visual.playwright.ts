import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { getVisualAuthPassword } from '../../e2e/visual/helpers'

const PASSWORD = process.env.E2E_ROLE_PASSWORD || getVisualAuthPassword()

const profiles = [
  {
    key: 'gerente',
    email: process.env.E2E_MANAGER_EMAIL || 'gerente@mxgestaopreditiva.com.br',
    path: '/home',
    moduleLabel: 'Módulo Gerencial',
  },
  {
    key: 'dono',
    email: process.env.E2E_OWNER_EMAIL || 'dono@mxgestaopreditiva.com.br',
    path: '/lojas',
    moduleLabel: 'Módulo Executivo',
  },
  {
    key: 'administrador-geral',
    email: process.env.E2E_ADMIN_EMAIL || 'synvollt@gmail.com',
    path: '/painel',
    moduleLabel: 'Módulo Administrativo',
  },
] as const

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
  forbiddenLegacyNodes: number
  horizontalOverflow: boolean
}

async function login(page: Page, email: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page.locator('main#main-content')).toBeVisible({ timeout: 30_000 })
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
    const mobileHeader = document.querySelector<HTMLElement>('header.md\\:hidden')
    const content = document.querySelector<HTMLElement>('main#main-content')
    const visibleLogo = Array.from(document.querySelectorAll<HTMLImageElement>('img[alt="MX"]'))
      .find((node) => node.getBoundingClientRect().width > 0)
    const labels = Array.from(document.querySelectorAll<HTMLElement>('p, span'))
      .filter((node) => /^Módulo /.test(node.textContent?.trim() || ''))
    const visibleModuleLabel = labels.find((node) => node.getBoundingClientRect().width > 0)

    if (!content || !visibleModuleLabel) throw new Error('Shell universal não encontrado no DOM.')

    const contentStyle = getComputedStyle(content)
    const moduleStyle = getComputedStyle(visibleModuleLabel)
    const sidebarStyle = desktopSidebar ? getComputedStyle(desktopSidebar) : null
    const mobileHeaderStyle = mobileHeader ? getComputedStyle(mobileHeader) : null

    return {
      profile,
      viewport,
      sidebar: desktopSidebar && desktopSidebar.getBoundingClientRect().width > 0 && sidebarStyle
        ? {
            width: Math.round(desktopSidebar.getBoundingClientRect().width),
            backgroundColor: sidebarStyle.backgroundColor,
            borderRightWidth: sidebarStyle.borderRightWidth,
            borderRightColor: sidebarStyle.borderRightColor,
            boxShadow: sidebarStyle.boxShadow,
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
  profile: (typeof profiles)[number],
  viewport: { width: number; height: number; name: string },
) {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  await login(page, profile.email)
  await page.goto(profile.path, { waitUntil: 'networkidle' })
  await expect(page.locator('main#main-content')).toBeVisible()
  await expect.poll(() => visibleModuleLabel(page), { timeout: 15_000 }).toBe(profile.moduleLabel)
  await page.waitForTimeout(700)

  const metrics = await collectMetrics(page, profile.key, viewport.name)

  expect(metrics.moduleLabel.text).toBe(profile.moduleLabel)
  expect(metrics.forbiddenLegacyNodes).toBe(0)
  expect(metrics.horizontalOverflow).toBe(false)
  expect(metrics.logo).not.toBeNull()
  expect(consoleErrors, `Erros de console em ${profile.key}/${viewport.name}`).toEqual([])

  if (viewport.name === 'desktop') {
    expect(metrics.sidebar).not.toBeNull()
    expect(metrics.sidebar?.width).toBe(264)
    expect(metrics.sidebar?.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(metrics.content.paddingLeft).toBe('264px')
  } else {
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

test.describe('paridade visual autenticada dos módulos MX', () => {
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
      expect(result.logo).toEqual(reference?.logo)
      expect({ ...result.moduleLabel, text: reference?.moduleLabel.text }).toEqual(reference?.moduleLabel)
      expect(result.content.backgroundColor).toBe(reference?.content.backgroundColor)
      expect(result.content.fontFamily).toBe(reference?.content.fontFamily)
    }
  })
})
