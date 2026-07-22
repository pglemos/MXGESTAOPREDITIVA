import { expect, test, type Browser, type Page, type Request } from '@playwright/test'
import {
  createE2EAdminUser,
  createE2EStoreUser,
  deleteE2EUser,
  type E2EUser,
} from './e2e-helpers/supabase-admin'

const STORE_ID = '467a19d1-af51-4b4f-9b05-d67187a2a759'
const STORE_SLUG = 'mx-consultoria'

const SELLER_ROUTES = [
  '/home', '/terminal-mx', '/carteira-clientes', '/meu-funil', '/central-execucao',
  '/relatorios-vendedor', '/universidade-mx', '/desenvolvimento', '/devolutivas',
  '/pdi', '/perfil', '/configuracoes', '/notificacoes', '/ajuda', '/ranking',
  `/lojas/${STORE_SLUG}/consultor-ia`,
] as const

const MANAGER_ROUTES = [
  '/home', `/lojas/${STORE_SLUG}`, '/rotina', '/gerente/rotina-equipe',
  '/gerente/minha-equipe', '/gerente/meta-loja', '/fechamento-diario', '/gerente/mentor',
  '/gerente/feedbacks-pdis', '/devolutivas', '/pdi', '/funil-vendas', '/metas', '/ranking',
  '/treinamentos', '/falar-consultor', '/configuracoes', '/configuracoes/remuneracao',
  '/relatorio-matinal', '/relatorios/performance-vendas', '/relatorios/performance-vendedor',
  '/auditoria', '/liberacao-fechamento',
] as const

const OWNER_ROUTES = [
  '/dono', '/dono/rotina', '/dono/decisoes', '/dono/plano-estrategico', '/dono/plano-acao',
  '/dono/consultoria', '/dono/departamentos', '/dono/departamentos/comercial',
  '/dono/departamentos/marketing', '/dono/departamentos/produto-e-estoque',
  '/dono/departamentos/pessoas-rh', '/dono/departamentos/financeiro',
  '/dono/departamentos/operacoes', '/dono/mercado', '/dono/universidade', '/lojas',
  '/funil-vendas', '/metas', '/organograma', '/banco-talentos', '/ranking', '/treinamentos',
  '/devolutivas', '/pdi', '/configuracoes', '/configuracoes/remuneracao', '/fechamento-diario',
] as const

const INTERNAL_ROUTES = [
  '/painel', '/simulacao', '/lojas', `/lojas/${STORE_SLUG}`, '/agenda', '/consultoria',
  '/consultoria/clientes', '/produtos', '/configuracoes', '/configuracoes/remuneracao',
  '/configuracoes/operacional', '/configuracoes/consultoria-pmr', '/configuracoes/reprocessamento',
  '/relatorio-matinal', '/relatorios/performance-vendas', '/relatorios/performance-vendedor',
  '/auditoria', '/ranking', '/treinamentos', '/devolutivas', '/pdi', '/notificacoes', '/perfil',
  '/fechamento-diario', '/liberacao-fechamento',
] as const

type RoleCase = {
  role: string
  user: E2EUser
  routes: readonly string[]
}

async function login(page: Page, user: E2EUser) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await expect(page.locator('main#main-content').first()).toBeVisible({ timeout: 30_000 })
}

async function auditAuthenticatedRole(browser: Browser, roleCase: RoleCase) {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    const apiErrors: string[] = []
    const pendingSupabaseRequests = new Set<Request>()
    let successfulBusinessRequests = 0
    let activeRoute = '/login'

    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(`${activeRoute}: ${message.text()}`)
    })
    page.on('request', request => {
      if (request.url().includes('.supabase.co/')) pendingSupabaseRequests.add(request)
    })
    page.on('requestfailed', request => {
      pendingSupabaseRequests.delete(request)
      const failure = request.failure()?.errorText || ''
      if (!request.url().includes('.supabase.co/') || failure.includes('ERR_ABORTED')) return
      apiErrors.push(`${activeRoute}: ${request.method()} ${request.url()} ${failure}`)
    })
    page.on('response', response => {
      pendingSupabaseRequests.delete(response.request())
      const url = response.url()
      if (!url.includes('.supabase.co/')) return
      if (/\/(?:rest|functions)\/v1\//.test(url) && response.ok()) successfulBusinessRequests += 1
      if (response.status() >= 400) apiErrors.push(`${activeRoute}: ${response.status()} ${response.request().method()} ${url}`)
    })

    await login(page, roleCase.user)

    for (const route of roleCase.routes) {
      activeRoute = route
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main#main-content').first(), `${roleCase.role}: ${route}`).toBeVisible({ timeout: 30_000 })
      await expect(page, `${roleCase.role}: ${route}`).not.toHaveURL(/\/login(?:[?#]|$)/)
      await expect(page.getByText(/Acesso não autorizado|Página não encontrada/i), `${roleCase.role}: ${route}`).toHaveCount(0)
      await expect(page.locator('body'), `${roleCase.role}: ${route}`).not.toContainText(/dados\s+fict[ií]cios|modelo\s+em\s+valida[cç][aã]o/i)
      await expect.poll(
        () => pendingSupabaseRequests.size,
        { message: `${roleCase.role}: ${route} ainda possui consultas Supabase em voo`, timeout: 15_000 },
      ).toBe(0)
    }

    expect(successfulBusinessRequests, `${roleCase.role}: nenhuma leitura real Supabase`).toBeGreaterThan(0)
    expect(pageErrors, `${roleCase.role}: erros de página`).toEqual([])
    expect(apiErrors, `${roleCase.role}: falhas HTTP/rede Supabase`).toEqual([])
    expect(consoleErrors, `${roleCase.role}: console.error`).toEqual([])
  } finally {
    await context.close()
  }
}

test.describe('MX CONSULTORIA — todos os módulos autenticados usam dados reais', () => {
  test.describe.configure({ mode: 'serial', timeout: 900_000 })
  const createdUsers: E2EUser[] = []
  let roleCases: RoleCase[] = []

  test.beforeAll(async () => {
    const trackCreatedUser = async (create: () => Promise<E2EUser>) => {
      const user = await create()
      createdUsers.push(user)
      return user
    }
    const creations = await Promise.allSettled([
      trackCreatedUser(() => createE2EStoreUser({ storeId: STORE_ID, role: 'vendedor', prefix: 'e2e-real-vendedor', name: 'E2E Dados Reais Vendedor' })),
      trackCreatedUser(() => createE2EStoreUser({ storeId: STORE_ID, role: 'gerente', prefix: 'e2e-real-gerente', name: 'E2E Dados Reais Gerente' })),
      trackCreatedUser(() => createE2EStoreUser({ storeId: STORE_ID, role: 'dono', prefix: 'e2e-real-dono', name: 'E2E Dados Reais Dono' })),
      trackCreatedUser(() => createE2EAdminUser({ role: 'administrador_geral', prefix: 'e2e-real-admin-geral', name: 'E2E Dados Reais Administrador Geral' })),
      trackCreatedUser(() => createE2EAdminUser({ role: 'administrador_mx', prefix: 'e2e-real-admin-mx', name: 'E2E Dados Reais Admin MX' })),
      trackCreatedUser(() => createE2EAdminUser({ role: 'consultor_mx', prefix: 'e2e-real-consultor-mx', name: 'E2E Dados Reais Consultor MX' })),
    ])
    const failedCreation = creations.find(result => result.status === 'rejected')
    if (failedCreation?.status === 'rejected') throw failedCreation.reason
    const [vendedor, gerente, dono, administradorGeral, administradorMx, consultorMx] = creations.map(
      result => (result as PromiseFulfilledResult<E2EUser>).value,
    )
    roleCases = [
      { role: 'vendedor', user: vendedor, routes: SELLER_ROUTES },
      { role: 'gerente', user: gerente, routes: MANAGER_ROUTES },
      { role: 'dono', user: dono, routes: OWNER_ROUTES },
      { role: 'administrador_geral', user: administradorGeral, routes: INTERNAL_ROUTES },
      { role: 'administrador_mx', user: administradorMx, routes: INTERNAL_ROUTES },
      { role: 'consultor_mx', user: consultorMx, routes: INTERNAL_ROUTES },
    ]
  })

  test.afterAll(async () => {
    const cleanup = await Promise.allSettled(createdUsers.map(user => deleteE2EUser(user.id)))
    const failures = cleanup.filter(result => result.status === 'rejected')
    if (failures.length > 0) throw new Error(`Falha ao limpar ${failures.length} identidade(s) E2E temporária(s).`)
  })

  test('percorre todas as superfícies permitidas sem mocks, erros de página ou falhas Supabase', async ({ browser }) => {
    for (const roleCase of roleCases) await auditAuthenticatedRole(browser, roleCase)
  })
})
