import { toDateOnlyBR } from '@/lib/schemas/crm.schema'

export interface CrmDerivedTotalsBase {
  leads: number
  leads_cart: number
  leads_net: number
  vnd_porta: number
  vnd_cart: number
  vnd_net: number
  visitas: number
  visitas_porta: number
  visitas_cart: number
  visitas_net: number
  agd_cart: number
  agd_net: number
  hasCrmData: boolean
}

export interface CrmClienteForTotals {
  created_at?: string | null
  data_competencia?: string | null
  canal_origem?: string | null
}

export interface CrmOportunidadeForTotals {
  etapa?: string | null
  canal?: string | null
  closed_at?: string | null
}

export interface CrmAtendimentoForTotals {
  data?: string | null
  canal?: string | null
}

export interface CrmAgendamentoForTotals {
  canal?: string | null
  data_hora?: string | null
}

export const EMPTY_CRM_DERIVED_TOTALS: CrmDerivedTotalsBase = {
  leads: 0,
  leads_cart: 0,
  leads_net: 0,
  vnd_porta: 0,
  vnd_cart: 0,
  vnd_net: 0,
  visitas: 0,
  visitas_porta: 0,
  visitas_cart: 0,
  visitas_net: 0,
  agd_cart: 0,
  agd_net: 0,
  hasCrmData: false,
}

export function addDaysDateOnly(dateOnly: string, days: number) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  if (!year || !month || !day) return dateOnly
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getSaoPauloDayRange(dateOnly: string) {
  const start = new Date(`${dateOnly}T00:00:00-03:00`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

function timestampMatchesDateOnly(value: string | null | undefined, dateOnly: string) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return toDateOnlyBR(date) === dateOnly
}

function isPortaSale(canal: string | null | undefined) {
  return canal === 'porta' || canal === 'showroom'
}

export function deriveCrmDerivedTotals(input: {
  referenceDate: string
  clientes: readonly CrmClienteForTotals[]
  oportunidades: readonly CrmOportunidadeForTotals[]
  atendimentos: readonly CrmAtendimentoForTotals[]
  agendamentos: readonly CrmAgendamentoForTotals[]
}): CrmDerivedTotalsBase {
  const agendaDate = addDaysDateOnly(input.referenceDate, 1)
  const leadsDia = input.clientes.filter(cliente => cliente.data_competencia === input.referenceDate
    || (!cliente.data_competencia && timestampMatchesDateOnly(cliente.created_at, input.referenceDate)))
  const leads_cart = leadsDia.filter(cliente => cliente.canal_origem === 'carteira').length
  const leads_net = leadsDia.filter(cliente => cliente.canal_origem === 'internet').length
  const leads = leadsDia.length
  const vendas = input.oportunidades.filter(oportunidade =>
    oportunidade.etapa === 'ganho' && timestampMatchesDateOnly(oportunidade.closed_at, input.referenceDate),
  )

  const vnd_porta = vendas.filter(oportunidade => isPortaSale(oportunidade.canal)).length
  const vnd_cart = vendas.filter(oportunidade => oportunidade.canal === 'carteira').length
  const vnd_net = vendas.filter(oportunidade => oportunidade.canal === 'internet').length
  const atendimentosDia = input.atendimentos.filter(atendimento => atendimento.data === input.referenceDate)
  const visitas_porta = atendimentosDia.filter(atendimento => isPortaSale(atendimento.canal)).length
  const visitas_cart = atendimentosDia.filter(atendimento => atendimento.canal === 'carteira').length
  const visitas_net = atendimentosDia.filter(atendimento => atendimento.canal === 'internet').length
  const visitas = atendimentosDia.length
  const agendamentosD0 = input.agendamentos.filter(agendamento => timestampMatchesDateOnly(agendamento.data_hora, agendaDate))
  const agd_cart = agendamentosD0.filter(agendamento => agendamento.canal === 'carteira').length
  const agd_net = agendamentosD0.filter(agendamento => agendamento.canal === 'internet').length
  const hasCrmData = leads > 0 || vnd_porta > 0 || vnd_cart > 0 || vnd_net > 0 || visitas > 0 || agd_cart > 0 || agd_net > 0

  return {
    leads,
    leads_cart,
    leads_net,
    vnd_porta,
    vnd_cart,
    vnd_net,
    visitas,
    visitas_porta,
    visitas_cart,
    visitas_net,
    agd_cart,
    agd_net,
    hasCrmData,
  }
}
