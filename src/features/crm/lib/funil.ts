import { getDiasInfo } from '@/lib/calculations'
import type { CrmCanal, CrmEtapaFunil } from '@/lib/schemas/crm.schema'

export type FunilCanalEstrategia = 'internet' | 'carteira' | 'porta'
export type FunilPlanoFonte = 'manual' | 'historico' | 'fallback'

export type FunilOportunidadeLike = {
  etapa: CrmEtapaFunil | string
  canal: CrmCanal | string | null
  created_at: string | null
  updated_at: string | null
  closed_at: string | null
}

export type FunilMetaRulesLike = {
  bench_lead_agd?: number | null
  bench_agd_visita?: number | null
  bench_visita_vnd?: number | null
  projection_mode?: string | null
}

export type FunilMixManual = Partial<Record<FunilCanalEstrategia, number | null>>

export type FunilDistribuicaoCanal = {
  canal: FunilCanalEstrategia
  vendas: number
  percentual: number
  ativo: boolean
}

export type FunilDistribuicao = {
  totalVendas: number
  canais: FunilDistribuicaoCanal[]
}

export type FunilCanalPlano = {
  canal: FunilCanalEstrategia
  titulo: string
  percurso: string
  unidadeSingular: string
  unidadePlural: string
  tone: 'blue' | 'orange' | 'green'
  percentual: number
  vendasHistoricas: number
  vendasPlanejadas: number
  necessidade: number
  necessidadePorDia: number
}

export type FunilPlanoPonderado = {
  fonte: FunilPlanoFonte
  dias: ReturnType<typeof getDiasInfo>
  distribuicao: FunilDistribuicao
  canais: FunilCanalPlano[]
}

export const FUNIL_CANAIS_ESTRATEGIA: FunilCanalEstrategia[] = ['internet', 'carteira', 'porta']

const CANAL_ORDEM: Record<FunilCanalEstrategia, number> = {
  internet: 0,
  carteira: 1,
  porta: 2,
}

const CANAL_CONFIG: Record<FunilCanalEstrategia, Omit<FunilCanalPlano, 'percentual' | 'vendasHistoricas' | 'vendasPlanejadas' | 'necessidade' | 'necessidadePorDia'>> = {
  internet: {
    canal: 'internet',
    titulo: 'Internet',
    percurso: 'Lead -> Agendamento -> Visita -> Venda',
    unidadeSingular: 'novo lead',
    unidadePlural: 'novos leads',
    tone: 'blue',
  },
  carteira: {
    canal: 'carteira',
    titulo: 'Carteira',
    percurso: 'Agendamento -> Visita -> Venda',
    unidadeSingular: 'novo agendamento',
    unidadePlural: 'novos agendamentos',
    tone: 'orange',
  },
  porta: {
    canal: 'porta',
    titulo: 'Porta/Showroom',
    percurso: 'Atendimento -> Venda',
    unidadeSingular: 'atendimento',
    unidadePlural: 'atendimentos',
    tone: 'green',
  },
}

export function normalizarCanalEstrategia(canal: CrmCanal | string | null | undefined): FunilCanalEstrategia | null {
  if (canal === 'internet') return 'internet'
  if (canal === 'carteira') return 'carteira'
  if (canal === 'porta' || canal === 'showroom') return 'porta'
  return null
}

export function calcularDistribuicaoVendasPorCanal(
  oportunidades: FunilOportunidadeLike[],
  referenceDate: Date = new Date(),
  mesesJanela = 3,
): FunilDistribuicao {
  const inicio = new Date(referenceDate)
  inicio.setHours(0, 0, 0, 0)
  inicio.setMonth(inicio.getMonth() - mesesJanela)

  const fim = new Date(referenceDate)
  fim.setHours(23, 59, 59, 999)

  const vendasPorCanal: Record<FunilCanalEstrategia, number> = {
    internet: 0,
    carteira: 0,
    porta: 0,
  }

  for (const oportunidade of oportunidades) {
    if (oportunidade.etapa !== 'ganho') continue
    const canal = normalizarCanalEstrategia(oportunidade.canal)
    if (!canal) continue
    const dataVenda = parseDataVenda(oportunidade)
    if (!dataVenda || dataVenda < inicio || dataVenda > fim) continue
    vendasPorCanal[canal] += 1
  }

  const totalVendas = FUNIL_CANAIS_ESTRATEGIA.reduce((sum, canal) => sum + vendasPorCanal[canal], 0)
  const canais = FUNIL_CANAIS_ESTRATEGIA.map(canal => {
    const vendas = vendasPorCanal[canal]
    const percentual = totalVendas > 0 ? round1((vendas / totalVendas) * 100) : 0
    return { canal, vendas, percentual, ativo: totalVendas > 0 && vendas > 0 }
  })

  return { totalVendas, canais }
}

export function calcularPlanoFunilPonderado({
  faltaX,
  metaRules,
  oportunidades,
  mixManual,
  referenceDate = new Date(),
}: {
  faltaX: number
  metaRules: FunilMetaRulesLike | null | undefined
  oportunidades: FunilOportunidadeLike[]
  mixManual?: FunilMixManual | null
  referenceDate?: Date
}): FunilPlanoPonderado {
  const distribuicao = calcularDistribuicaoVendasPorCanal(oportunidades, referenceDate)
  const manual = normalizarMixManual(mixManual)
  const fonte: FunilPlanoFonte = manual ? 'manual' : distribuicao.totalVendas > 0 ? 'historico' : 'fallback'
  const dias = getDiasInfo(referenceDate, metaRules?.projection_mode === 'business' ? 'business' : 'calendar')
  const percentuais = manual || percentuaisDoHistorico(distribuicao)
  const vendasRestantes = Math.max(0, Math.floor(faltaX))

  const ativos = percentuais
    ? percentuais.filter(row => row.percentual > 0)
    : FUNIL_CANAIS_ESTRATEGIA.map(canal => ({ canal, percentual: 0 }))

  const vendasPlanejadas = percentuais
    ? distribuirVendasRestantes(vendasRestantes, ativos)
    : new Map(FUNIL_CANAIS_ESTRATEGIA.map(canal => [canal, vendasRestantes]))

  const canais = ativos
    .map(({ canal, percentual }) => montarPlanoCanal({
      canal,
      percentual,
      vendasHistoricas: distribuicao.canais.find(row => row.canal === canal)?.vendas || 0,
      vendasPlanejadas: vendasPlanejadas.get(canal) || 0,
      metaRules,
      diasRestantes: dias.restantes,
    }))
    .filter(row => fonte === 'fallback' || faltaX === 0 || row.vendasPlanejadas > 0)
    .sort((a, b) => {
      if (fonte === 'fallback') return CANAL_ORDEM[a.canal] - CANAL_ORDEM[b.canal]
      return b.percentual - a.percentual || CANAL_ORDEM[a.canal] - CANAL_ORDEM[b.canal]
    })

  return { fonte, dias, distribuicao, canais }
}

function montarPlanoCanal({
  canal,
  percentual,
  vendasHistoricas,
  vendasPlanejadas,
  metaRules,
  diasRestantes,
}: {
  canal: FunilCanalEstrategia
  percentual: number
  vendasHistoricas: number
  vendasPlanejadas: number
  metaRules: FunilMetaRulesLike | null | undefined
  diasRestantes: number
}): FunilCanalPlano {
  const necessidade = calcularNecessidadePorCanal(canal, vendasPlanejadas, metaRules)
  return {
    ...CANAL_CONFIG[canal],
    percentual,
    vendasHistoricas,
    vendasPlanejadas,
    necessidade,
    necessidadePorDia: diasRestantes > 0 ? Math.ceil(necessidade / diasRestantes) : necessidade,
  }
}

function calcularNecessidadePorCanal(
  canal: FunilCanalEstrategia,
  vendasPlanejadas: number,
  metaRules: FunilMetaRulesLike | null | undefined,
) {
  if (vendasPlanejadas <= 0) return 0
  const benchLeadAgd = (metaRules?.bench_lead_agd ?? 20) / 100
  const benchAgdVisita = (metaRules?.bench_agd_visita ?? 60) / 100
  const benchVisitaVnd = (metaRules?.bench_visita_vnd ?? 33) / 100
  const chain = canal === 'internet'
    ? benchLeadAgd * benchAgdVisita * benchVisitaVnd
    : canal === 'carteira'
      ? benchAgdVisita * benchVisitaVnd
      : benchVisitaVnd
  return chain > 0 ? Math.ceil(vendasPlanejadas / chain) : 0
}

function parseDataVenda(oportunidade: FunilOportunidadeLike): Date | null {
  const value = oportunidade.closed_at || oportunidade.updated_at || oportunidade.created_at
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizarMixManual(mixManual: FunilMixManual | null | undefined) {
  if (!mixManual) return null
  const values = FUNIL_CANAIS_ESTRATEGIA.map(canal => ({
    canal,
    value: sanitizePercentual(mixManual[canal]),
  }))
  const total = values.reduce((sum, row) => sum + row.value, 0)
  if (total <= 0) return null
  return values.map(row => ({
    canal: row.canal,
    percentual: round1((row.value / total) * 100),
  }))
}

function percentuaisDoHistorico(distribuicao: FunilDistribuicao) {
  if (distribuicao.totalVendas <= 0) return null
  return distribuicao.canais.map(row => ({ canal: row.canal, percentual: row.percentual }))
}

function distribuirVendasRestantes(
  faltaX: number,
  canais: { canal: FunilCanalEstrategia; percentual: number }[],
) {
  const base = new Map<FunilCanalEstrategia, number>()
  if (faltaX <= 0 || canais.length === 0) {
    for (const row of canais) base.set(row.canal, 0)
    return base
  }

  const partes = canais.map(row => {
    const raw = faltaX * (row.percentual / 100)
    const floor = Math.floor(raw)
    base.set(row.canal, floor)
    return { canal: row.canal, resto: raw - floor }
  })

  let restante = faltaX - Array.from(base.values()).reduce((sum, value) => sum + value, 0)
  const ordenado = partes.sort((a, b) => b.resto - a.resto || CANAL_ORDEM[a.canal] - CANAL_ORDEM[b.canal])
  let index = 0
  while (restante > 0) {
    const canal = ordenado[index % ordenado.length].canal
    base.set(canal, (base.get(canal) || 0) + 1)
    restante -= 1
    index += 1
  }

  return base
}

function sanitizePercentual(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0
  return Math.max(0, value)
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
