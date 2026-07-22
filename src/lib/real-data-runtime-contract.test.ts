import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const root = process.cwd()
const sourceExtensions = ['', '.ts', '.tsx', '.js', '.jsx'] as const

function resolveSource(importer: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? resolve(root, 'src', specifier.slice(2))
    : resolve(dirname(importer), specifier)

  for (const extension of sourceExtensions) {
    const candidate = `${base}${extension}`
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  for (const extension of sourceExtensions.slice(1)) {
    const candidate = resolve(base, `index${extension}`)
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

function activeRuntimeSources() {
  const pending = [resolve(root, 'src/App.tsx')]
  const visited = new Set<string>()
  const importPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"]([^'"]+)['"]/g

  while (pending.length > 0) {
    const file = pending.pop()!
    if (visited.has(file)) continue
    visited.add(file)

    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1]
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) continue
      const imported = resolveSource(file, specifier)
      if (imported && !visited.has(imported)) pending.push(imported)
    }
  }

  return [...visited]
}

const prohibitedRuntimePatterns: Array<[string, RegExp]> = [
  ['mensagem de dados fictícios', /dados\s+fict[ií]cios/i],
  ['mensagem de modelo em validação', /modelo\s+em\s+valida[cç][aã]o/i],
  ['modo de demonstração de negócio', /\bdemoMode\b/],
  ['constante de dados demo', /\bDEMO_[A-Z0-9_]+\b/],
  ['mock de negócio instanciável', /\bMock[A-Z][A-Za-z0-9_]*/],
  ['banco local Base44', /\bmx_b44_/],
  ['progresso de treinamento inventado', /\bquiz_score\s*:\s*100\b/],
  ['horas de treinamento inventadas', /\bhours_studied\s*:\s*0\.5\b/],
  ['presença em live inventada', /\battended_live\s*:\s*true\b/],
  ['projeção comercial sem fonte', /\b\d+\s+a\s+\d+\s+vendas\b/i],
  ['meta mensal fixa', /\bmonthly_goal\s*:\s*10\b/],
  ['pretensão salarial fixa', /\btarget_salary\s*:\s*5000\b/],
  ['histórico de fechamento em armazenamento local', /\bmx-checkin-(?:clientes|score)\b/],
]

describe('contrato de dados reais do runtime ativo', () => {
  const sources = activeRuntimeSources()

  test('parte do App e cobre um grafo amplo de módulos carregáveis', () => {
    expect(sources.length).toBeGreaterThan(250)
    expect(sources.some(file => file.endsWith('/features/owner-base44/OwnerLiveDataPage.tsx'))).toBe(true)
    expect(sources.some(file => file.endsWith('/features/carteira-clientes/pages/CarteiraClientesBase44Page.tsx'))).toBe(true)
    expect(sources.some(file => file.endsWith('/features/carteira-clientes/lib/installCarteiraBase44Adapter.js'))).toBe(true)
    expect(sources.some(file => file.endsWith('/api/base44Client.js'))).toBe(true)
  })

  test('não carrega textos, identificadores ou valores fictícios conhecidos', () => {
    const violations: string[] = []
    for (const file of sources) {
      const source = readFileSync(file, 'utf8')
      for (const [label, pattern] of prohibitedRuntimePatterns) {
        if (pattern.test(source)) violations.push(`${relative(root, file)}: ${label}`)
      }
    }
    expect(violations).toEqual([])
  })

  test('mantém as implementações demonstrativas antigas do Dono fora do bundle ativo', () => {
    const active = new Set(sources.map(file => relative(root, file)))
    for (const legacy of [
      'src/pages/owner/OwnerHome.jsx',
      'src/pages/owner/PlanoEstrategico.jsx',
      'src/pages/owner/PlanoDeAcao.jsx',
      'src/pages/owner/Consultoria.jsx',
      'src/components/owner/home/homeData.js',
      'src/components/owner/actionplan/actionPlanFixtures.js',
      'src/components/owner/strategic/MockStrategicPlanRepository.js',
      'src/components/owner/consulting/consultingFixtures.js',
    ]) {
      expect(active.has(legacy), `${legacy} não pode ser alcançável a partir do App`).toBe(false)
    }
  })

  test('falhas e ausência de configuração não ativam catálogos locais de negócio', () => {
    const agenda = readFileSync(resolve(root, 'src/hooks/useAgendaOptions.ts'), 'utf8')
    const consulting = readFileSync(resolve(root, 'src/hooks/useConsultingModules.ts'), 'utf8')
    const carteira = readFileSync(resolve(root, 'src/features/crm/CarteiraClientes.container.tsx'), 'utf8')
    const carteiraAdapter = readFileSync(resolve(root, 'src/features/carteira-clientes/lib/installCarteiraBase44Adapter.js'), 'utf8')
    const base44 = readFileSync(resolve(root, 'src/api/base44Client.js'), 'utf8')

    expect(agenda).not.toContain('fallbackRows')
    expect(agenda).not.toContain('DEFAULT_OPTIONS')
    expect(consulting).toContain('return stored?.enabled ?? false')
    expect(carteira).not.toContain('demoMode')
    expect(carteira).not.toMatch(/\bDEMO_[A-Z0-9_]+\b/)
    expect(carteiraAdapter).toContain("supabase.rpc('carteira_salvar_cliente_v2'")
    expect(carteiraAdapter).not.toMatch(/\bDEMO_[A-Z0-9_]+\b/)
    expect(base44).toMatch(/UserProfile:\s*\{[\s\S]*?filter:\s*async/)
  })

  test('adapter de perfil não transforma email nem jornada incompleta em dados de perfil', () => {
    const base44 = readFileSync(resolve(root, 'src/api/base44Client.js'), 'utf8')
    expect(base44).toContain("full_name: profile.name || ''")
    expect(base44).toMatch(/work_schedule_id:\s*currentWorkStart && currentWorkEnd\s*\?[\s\S]*?: ''/)
  })

  test('UserProfile.filter respeita critérios, ordenação e limite depois do escopo autenticado', () => {
    const base44 = readFileSync(resolve(root, 'src/api/base44Client.js'), 'utf8')
    expect(base44).toMatch(/const \{ created_by_id: requestedCreatorId, \.\.\.criteria \} = filter/)
    expect(base44).toContain('rows.filter((row) => matchQuery(row, criteria))')
    expect(base44).toContain('sortRows(filtered, order)')
  })
})
