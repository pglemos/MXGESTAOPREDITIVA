import { expect, test, type Locator } from '@playwright/test'
import { getE2ERolePassword, loginWithCredentials } from './e2e-helpers/auth'

const credentials = {
  email: 'gerente@mxgestaopreditiva.com.br',
  password: getE2ERolePassword(),
}

const routes = [
  { path: '/home', slug: 'inicio', heading: 'Início', uniqueText: /Previsibilidade comercial para conduzir o resultado do dia/i },
  { path: '/rotina', slug: 'rotina-dia', heading: 'Rotina do Dia', uniqueText: /Alertas e ações essenciais para conduzir o dia/i },
  { path: '/fechamento-diario', slug: 'fechamento', heading: 'Fechamento Diário', uniqueText: /Movimento da Equipe/i },
  { path: '/gerente/rotina-equipe', slug: 'rotina', heading: 'Rotina da Equipe', uniqueText: /Acompanhe a execução das atividades comerciais da equipe/i },
  { path: '/gerente/minha-equipe', slug: 'equipe', heading: 'Minha Equipe', uniqueText: /Visão do Kanban/i },
  { path: '/gerente/meta-loja', slug: 'meta', heading: 'Meta da Loja', uniqueText: /Acompanhe o resultado da loja e saiba o que fazer para alcançar a meta/i },
  { path: '/gerente/mentor', slug: 'mentor', heading: 'Mentor Gerencial', uniqueText: /Biblioteca de orientações/i },
  { path: '/gerente/feedbacks-pdis', slug: 'desenvolvimento', heading: 'Desenvolvimento', uniqueText: /Central de gestão de pessoas/i },
  { path: '/gerente/ranking', slug: 'ranking', heading: 'Ranking', uniqueText: /Acompanhe a classificação da equipe por resultado, conversão e execução/i },
  { path: '/gerente/universidade-mx', slug: 'universidade', heading: /Universidade|Desenvolvimento/i, uniqueText: /Desenvolvimento do gerente/i },
] as const

async function expectDialogAboveSidebar(dialog: Locator) {
  const layers = await dialog.evaluate((element) => {
    const layerZIndex = (start: Element | null) => {
      let current = start
      while (current) {
        const zIndex = window.getComputedStyle(current).zIndex
        if (zIndex !== 'auto') return Number(zIndex)
        current = current.parentElement
      }
      return 0
    }

    return {
      dialog: layerZIndex(element),
      sidebar: layerZIndex(document.querySelector('aside')),
    }
  })

  expect(layers.dialog).toBeGreaterThan(layers.sidebar)
}

async function expectWithinViewport(element: Locator) {
  const bounds = await element.evaluate((node) => {
    const rect = node.getBoundingClientRect()
    return { left: rect.left, right: rect.right, width: rect.width, viewport: window.innerWidth }
  })

  expect(bounds.width).toBeGreaterThan(0)
  expect(bounds.left).toBeGreaterThanOrEqual(0)
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1)
}

test.describe('Módulo Gerencial canônico', () => {
  test.beforeEach(async ({ page }) => loginWithCredentials(page, credentials.email, credentials.password))

  test('exibe exatamente os dez menus na ordem contratada e abre todas as rotas', async ({ page }) => {
    const expectedLabels = ['Início', 'Rotina do Dia', 'Fechamento Diário', 'Rotina da Equipe', 'Minha Equipe', 'Meta da Loja', 'Mentor Gerencial', 'Desenvolvimento', 'Ranking', 'Universidade MX']
    const menu = page.getByRole('navigation', { name: 'Menu principal do Gerente' })
    await expect(menu.getByRole('link')).toHaveText(expectedLabels)
    for (const label of expectedLabels) {
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
        { path: '/fechamento-diario', heading: 'Fechamento Diário' },
        { path: '/gerente/rotina-equipe', heading: 'Rotina da Equipe' },
      ]) {
        await page.goto(route.path)
        await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 20000 })
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({ timeout: 20000 })
        await page.screenshot({ path: `output/playwright/manager-${route.path.split('/').pop()}-${viewport.name}.png`, fullPage: true })
      }
    }
  })

  test('carrega conteúdo exclusivo das dez telas em desktop, tablet e mobile', async ({ page }) => {
    test.setTimeout(120_000)
    for (const viewport of [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'tablet-768', width: 768, height: 1024 },
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
    await page.goto('/fechamento-diario')
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
    for (const view of ['Todos', 'Resultado', 'Consistência']) {
      const viewTab = page.getByRole('tab', { name: view, exact: true })
      await expect(viewTab).toBeVisible({ timeout: 20000 })
      await viewTab.click()
      await expect(viewTab).toHaveAttribute('aria-selected', 'true')
    }
    await page.getByRole('tab', { name: 'Todos', exact: true }).click()
    const moreActions = page.locator('summary[aria-label^="Mais ações para"]').first()
    await expect(moreActions).toBeVisible()
    await moreActions.click()
    for (const action of ['Ver rotina de hoje', 'Registrar feedback', 'Abrir Fechamento Diário', 'Recomendar treinamento']) {
      await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible()
    }
    const profile = page.getByRole('button', { name: 'Ver perfil completo', exact: true }).first()
    await expect(profile).toBeVisible({ timeout: 20000 })
    await profile.click()
    for (const tab of ['Visão Geral', 'Performance', 'Rotina', 'Feedbacks', 'Treinamentos']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Performance' }).click()
    await expect(page.getByText('Leads', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.goto('/gerente/feedbacks-pdis')
    await page.getByRole('tab', { name: 'PDI', exact: true }).click()
    await expect(page.getByText(/Desenvolva competências por meio de avaliações/i).first()).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: 'Iniciar novo PDI', exact: true }).click()
    const pdiSeller = page.getByLabel('Selecione o Especialista')
    await expect(pdiSeller).toBeVisible()
    await expect(pdiSeller).not.toContainText(/Gerente MX Consultoria|Dono/i)
    const pdiDialog = page.getByRole('dialog', { name: 'Sessão PDI MX 360º' })
    await expectDialogAboveSidebar(pdiDialog)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'output/playwright/manager-parity-20260712-fresh/local-desenvolvimento-v3-pdi-wizard.png', fullPage: true })
    await page.keyboard.press('Escape')

    await page.getByRole('tab', { name: 'Feedback', exact: true }).click()
    await page.getByRole('button', { name: 'Novo Feedback', exact: true }).click()
    const feedbackSeller = page.getByLabel('Especialista')
    await expect(feedbackSeller).toBeVisible()
    await expect(feedbackSeller).not.toContainText(/Gerente MX Consultoria|Dono/i)
    const feedbackDialog = page.getByRole('dialog', { name: 'Nova Mentoria' })
    await expectDialogAboveSidebar(feedbackDialog)
    await expect(feedbackDialog).toHaveCSS('opacity', '1')
    const feedbackPanel = feedbackDialog.locator(':scope > div').first()
    await expect.poll(async () => (await feedbackPanel.boundingBox())?.width || 0).toBeGreaterThanOrEqual(640)
    await page.screenshot({ path: 'output/playwright/manager-parity-20260712-fresh/local-desenvolvimento-v3-feedback-modal.png', fullPage: true })
    await page.keyboard.press('Escape')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('tab', { name: 'PDI', exact: true }).click()
    await page.getByRole('button', { name: 'Iniciar novo PDI', exact: true }).click()
    const mobilePdiDialog = page.getByRole('dialog', { name: 'Sessão PDI MX 360º' })
    await expectWithinViewport(mobilePdiDialog)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'output/playwright/manager-parity-20260712-fresh/local-desenvolvimento-v3-pdi-wizard-mobile.png', fullPage: true })
    await page.keyboard.press('Escape')
    await page.getByRole('tab', { name: 'Feedback', exact: true }).click()
    await page.getByRole('button', { name: 'Novo Feedback', exact: true }).click()
    const mobileFeedbackDialog = page.getByRole('dialog', { name: 'Nova Mentoria' })
    await expect(mobileFeedbackDialog).toHaveCSS('opacity', '1')
    await expectWithinViewport(mobileFeedbackDialog.locator(':scope > div').first())
    await expectWithinViewport(page.getByRole('button', { name: 'CANCELAR', exact: true }))
    await expectWithinViewport(page.getByRole('button', { name: 'REGISTRAR', exact: true }))
    await page.screenshot({ path: 'output/playwright/manager-parity-20260712-fresh/local-desenvolvimento-v3-feedback-modal-mobile.png', fullPage: true })
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 1280, height: 720 })

    await page.getByRole('tab', { name: 'PDI', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ver Mapa da Equipe', exact: true })).toBeVisible()

    await page.goto('/gerente/universidade-mx')
    await expect(page.locator('main')).not.toContainText('NaN')
    for (const tab of ['Desenvolvimento do Gerente', 'Acompanhamento da Equipe']) {
      await expect(page.getByRole('tab', { name: tab, exact: true })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Acompanhamento da Equipe', exact: true }).click()
    await expect(page.getByText('Nenhum conteúdo oficial').first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Sem conteúdo').first()).toBeVisible()
    await expect(page.getByText('Vendedores atrasados').locator('..').locator('p').first()).toHaveText('0')
    await expect(page.getByRole('button', { name: 'Atribuir', exact: true })).toHaveCount(0)
    await page.screenshot({ path: 'output/playwright/manager-parity-20260712-fresh/local-universidade-v3-equipe.png', fullPage: true })
  })
})
