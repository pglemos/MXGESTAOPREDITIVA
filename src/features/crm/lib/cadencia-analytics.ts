import type { Json } from '@/types/database.generated'

export type CadenciaAnalyticsEstado = {
  id: string
  cliente_id: string
  loja_id: string
  seller_user_id: string
  fluxo_id: string
  fluxo_version: number
  etapa_atual: string
  passo_atual_key: string
  status: string
  last_result: string | null
  tentativas_passo: number
  tentativa_limite: number
  reagendamentos_sem_sucesso: number
  historico: Json
  created_at: string
  updated_at: string
}

export type CadenciaAnalyticsOportunidade = {
  id: string
  cliente_id: string
  loja_id: string
  etapa: string
  tipo_veiculo: string | null
  valor_negociado: number
}

export type CadenciaGargalo = {
  etapa: string
  total: number
  pendentes: number
  concluidos: number
  cancelados: number
  semSucesso: number
  aguardando: number
  reagendamentosSemSucesso: number
}

export type CadenciaDemandaVeiculo = {
  tipo_veiculo: string
  quantidade: number
  valorTotal: number
}

export type CadenciaConversaoFluxo = {
  fluxo_id: string
  fluxo_version: number
  totalClientes: number
  ganhos: number
  taxaConversao: number
  valorGanho: number
}

export type CadenciaAnalytics = {
  totalEstados: number
  gargalos: CadenciaGargalo[]
  demandaVeiculos: CadenciaDemandaVeiculo[]
  conversaoPorFluxo: CadenciaConversaoFluxo[]
}

export function buildCadenciaAnalytics({
  estados,
  oportunidades,
}: {
  estados: CadenciaAnalyticsEstado[]
  oportunidades: CadenciaAnalyticsOportunidade[]
}): CadenciaAnalytics {
  const oportunidadesGanhasPorCliente = new Map<string, CadenciaAnalyticsOportunidade[]>()
  for (const oportunidade of oportunidades) {
    if (oportunidade.etapa !== 'ganho') continue
    const current = oportunidadesGanhasPorCliente.get(oportunidade.cliente_id) || []
    current.push(oportunidade)
    oportunidadesGanhasPorCliente.set(oportunidade.cliente_id, current)
  }

  return {
    totalEstados: estados.length,
    gargalos: buildGargalos(estados),
    demandaVeiculos: buildDemandaVeiculos(oportunidades),
    conversaoPorFluxo: buildConversaoPorFluxo(estados, oportunidadesGanhasPorCliente),
  }
}

function buildGargalos(estados: CadenciaAnalyticsEstado[]): CadenciaGargalo[] {
  const byEtapa = new Map<string, CadenciaGargalo>()

  for (const estado of estados) {
    const row = byEtapa.get(estado.etapa_atual) || {
      etapa: estado.etapa_atual,
      total: 0,
      pendentes: 0,
      concluidos: 0,
      cancelados: 0,
      semSucesso: 0,
      aguardando: 0,
      reagendamentosSemSucesso: 0,
    }

    row.total += 1
    if (estado.status === 'concluido') row.concluidos += 1
    else if (estado.status === 'cancelado') row.cancelados += 1
    else row.pendentes += 1
    if (estado.last_result === 'nao_feito') row.semSucesso += 1
    if (estado.last_result === 'aguardando') row.aguardando += 1
    row.reagendamentosSemSucesso += Math.max(Number(estado.reagendamentos_sem_sucesso || 0), 0)

    byEtapa.set(estado.etapa_atual, row)
  }

  return [...byEtapa.values()].sort((a, b) => {
    return b.total - a.total ||
      b.reagendamentosSemSucesso - a.reagendamentosSemSucesso ||
      a.etapa.localeCompare(b.etapa)
  })
}

function buildDemandaVeiculos(oportunidades: CadenciaAnalyticsOportunidade[]): CadenciaDemandaVeiculo[] {
  const byTipo = new Map<string, CadenciaDemandaVeiculo>()

  for (const oportunidade of oportunidades) {
    const tipo = oportunidade.tipo_veiculo || 'nao_informado'
    const row = byTipo.get(tipo) || { tipo_veiculo: tipo, quantidade: 0, valorTotal: 0 }
    row.quantidade += 1
    row.valorTotal += Number(oportunidade.valor_negociado || 0)
    byTipo.set(tipo, row)
  }

  return [...byTipo.values()].sort((a, b) => {
    return b.quantidade - a.quantidade ||
      unknownVehicleWeight(a.tipo_veiculo) - unknownVehicleWeight(b.tipo_veiculo) ||
      b.valorTotal - a.valorTotal ||
      a.tipo_veiculo.localeCompare(b.tipo_veiculo)
  })
}

function unknownVehicleWeight(tipo: string): number {
  return tipo === 'nao_informado' ? 1 : 0
}

function buildConversaoPorFluxo(
  estados: CadenciaAnalyticsEstado[],
  oportunidadesGanhasPorCliente: Map<string, CadenciaAnalyticsOportunidade[]>,
): CadenciaConversaoFluxo[] {
  const byFluxo = new Map<string, CadenciaConversaoFluxo>()

  for (const estado of estados) {
    const key = `${estado.fluxo_id}:${estado.fluxo_version}`
    const ganhosCliente = oportunidadesGanhasPorCliente.get(estado.cliente_id) || []
    const row = byFluxo.get(key) || {
      fluxo_id: estado.fluxo_id,
      fluxo_version: estado.fluxo_version,
      totalClientes: 0,
      ganhos: 0,
      taxaConversao: 0,
      valorGanho: 0,
    }

    row.totalClientes += 1
    if (ganhosCliente.length > 0) {
      row.ganhos += 1
      row.valorGanho += ganhosCliente.reduce((acc, oportunidade) => acc + Number(oportunidade.valor_negociado || 0), 0)
    }
    byFluxo.set(key, row)
  }

  return [...byFluxo.values()]
    .map(row => ({
      ...row,
      taxaConversao: row.totalClientes > 0 ? Math.round((row.ganhos / row.totalClientes) * 1000) / 10 : 0,
    }))
    .sort((a, b) => {
      return b.taxaConversao - a.taxaConversao ||
        b.totalClientes - a.totalClientes ||
        a.fluxo_id.localeCompare(b.fluxo_id) ||
        b.fluxo_version - a.fluxo_version
    })
}
