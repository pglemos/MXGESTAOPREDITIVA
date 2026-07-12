import { expect, test } from '@playwright/test'
import { getE2ERolePassword, loginWithCredentials } from './e2e-helpers/auth'

const credentials = {
  email: 'gerente@mxgestaopreditiva.com.br',
  password: getE2ERolePassword(),
}

const routes = [
  { path: '/home', slug: 'inicio', heading: /Bom dia|Bom tarde|Bom noite/i, uniqueText: /da meta alcançada/i },
  { path: '/gerente/fechamento-diario', slug: 'fechamento', heading: 'Fechamento Diário', uniqueText: /Movimento da Equipe/i },
  { path: '/gerente/rotina-equipe', slug: 'rotina', heading: 'Rotina da Equipe', uniqueText: /Central de execução consolidada/i },
  { path: '/gerente/minha-equipe', slug: 'equipe', heading: /Equipe|Gestão de Equipe/i, uniqueText: /Performance da Equipe/i },
  { path: '/gerente/meta-loja', slug: 'meta', heading: /Meta|Metas/i, uniqueText: /Meta Mensal de Vendas/i },
  { path: '/gerente/mentor', slug: 'mentor', heading: 'Mentor Gerencial', uniqueText: /Biblioteca de orientações/i },
  { path: '/gerente/feedbacks-pdis', slug: 'desenvolvimento', heading: /Feedback|Devolutiva/i, uniqueText: /Escopo do gerente/i },
  { path: '/gerente/ranking', slug: 'ranking', heading: /Ranking|Classificação/i, uniqueText: /Critério configurado pela loja/i },
  { path: '/gerente/universidade-mx', slug: 'universidade', heading: /Universidade|Desenvolvimento/i, uniqueText: /Desenvolvimento do gerente/i },
] as const

test.describe('Módulo Gerencial canônico', () => {
  test.beforeEach(async ({ page }) => loginWithCredentials(page, credentials.email, credentials.password))

  test('exibe exatamente os nove menus e abre todas as rotas', async ({ page }) => {
    for (const label of ['Início', 'Fechamento Diário', 'Rotina da Equipe', 'Minha Equipe', 'Meta da Loja', 'Mentor Gerencial', 'Feedbacks e PDIs', 'Ranking', 'Universidade MX']) {
      await expect(page.getByRole('link', { name: label, exact: true })).toBeVisible()
    }

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '\\/')))
      await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 20000 })
      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 20000 })
    }
  })

  test('renderiza fechamento e rotina sem clipping nos viewports obrigatórios', async ({ page }) => {
    const viewports = [
      { name: 'desktop-1920', width: 1920, height: 1080 },
      { name: 'notebook-1366', width: 1366, height: 768 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-390', width: 390, height: 844 },
    ]
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const route of [
        { path: '/gerente/fechamento-diario', heading: 'Fechamento Diário' },
        { path: '/gerente/rotina-equipe', heading: 'Rotina da Equipe' },
      ]) {
        await page.goto(route.path)
        await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 20000 })
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 20000 })
        await page.screenshot({ path: `output/playwright/manager-${route.path.split('/').pop()}-${viewport.name}.png`, fullPage: true })
      }
    }
  })

  test('carrega conteúdo exclusivo das nove telas em desktop e mobile', async ({ page }) => {
    for (const viewport of [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'mobile-390', width: 390, height: 844 },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      for (const route of routes) {
        await page.goto(route.path)
        await page.reload()
        await expect(page.getByText(route.uniqueText).first()).toBeVisible({ timeout: 20000 })
        if (route.path === '/gerente/minha-equipe') {
          await expect(page.getByRole('button', { name: 'Ver perfil completo' }).first()).toBeVisible({ timeout: 20000 })
        }
        await expect(page.getByText(/403|acesso negado/i)).toHaveCount(0)
        await page.screenshot({ path: `output/playwright/manager-design/final/${route.slug}-${viewport.name}.png`, fullPage: true })
      }
    }
  })

  test('mantém os fluxos funcionais centrais do contrato gerencial', async ({ page }) => {
    await page.goto('/gerente/fechamento-diario')
    await page.getByRole('button', { name: 'Ver Agenda D+1' }).click()
    await expect(page.getByRole('heading', { name: 'Agenda D+1' })).toBeVisible({ timeout: 20000 })
    await page.keyboard.press('Escape')

    await page.goto('/gerente/rotina-equipe')
    const routineDetail = page.getByRole('button', { name: 'Ver rotina' }).first()
    if (await routineDetail.isVisible()) {
      await routineDetail.click()
      await expect(page.getByText('Ações do dia')).toBeVisible()
      await page.keyboard.press('Escape')
    }

    await page.goto('/gerente/minha-equipe')
    const profile = page.getByRole('button', { name: 'Ver perfil' }).first()
    await expect(profile).toBeVisible({ timeout: 20000 })
    await profile.click()
    for (const tab of ['Visão Geral', 'Performance', 'Rotina', 'Feedbacks', 'Treinamentos']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Performance' }).click()
    await expect(page.getByText('Leads', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/gerente/feedbacks-pdis')
    await page.getByRole('tab', { name: 'PDIS' }).click()
    await expect(page.getByText(/Evolução do Vendedor|PDI como acompanhamento/i).first()).toBeVisible({ timeout: 20000 })
    await page.getByRole('tab', { name: 'Agenda de Reuniões' }).click()
    await expect(page.getByRole('heading', { name: 'Agenda de Acompanhamentos' })).toBeVisible()

    await page.goto('/gerente/universidade-mx')
    await expect(page.locator('main')).not.toContainText('NaN')
    for (const tab of ['Equipe', 'Matriz da Equipe', 'Minha Trilha']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible()
    }
  })
})
