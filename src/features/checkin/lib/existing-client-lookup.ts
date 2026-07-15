export type ExistingClientRecord = {
  id: string
  nome: string
  telefone: string | null
  canal_origem: 'carteira' | 'internet' | 'showroom' | 'porta' | null
  empresa: string | null
  observacoes: string | null
}

export type ExistingOpportunityRecord = {
  veiculo_interesse: string | null
  valor_negociado: number
  etapa: string
  financiamento: 'aprovado' | 'reprovado' | 'nao_aplica' | 'pendente'
  carro_avaliado: boolean
}

export type ExistingAppointmentRecord = {
  id: string
  cliente_id: string | null
  data_hora: string
  tipo?: string
  status?: string
  observacoes?: string | null
}

export type ExistingClientFormPatch = Record<string, string>

const CANAL_DB_TO_UI: Record<NonNullable<ExistingClientRecord['canal_origem']>, string> = {
  carteira: 'Carteira',
  internet: 'Internet',
  showroom: 'Showroom',
  porta: 'Showroom',
}

const FINANCIAMENTO_DB_TO_UI: Record<ExistingOpportunityRecord['financiamento'], string> = {
  aprovado: 'Aprovado',
  reprovado: 'Recusado',
  nao_aplica: 'Não se aplica',
  pendente: '',
}

function formatCurrencyForForm(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ')
}

function dateOnly(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed)
}

function dateDistanceInDays(later: string, earlier: string): number | null {
  const laterDate = dateOnly(later)
  const earlierDate = dateOnly(earlier)
  if (!laterDate || !earlierDate) return null
  const laterMs = Date.parse(`${laterDate}T12:00:00Z`)
  const earlierMs = Date.parse(`${earlierDate}T12:00:00Z`)
  if (Number.isNaN(laterMs) || Number.isNaN(earlierMs)) return null
  return Math.round((laterMs - earlierMs) / 86400000)
}

export function buildExistingClientFormPatch(input: {
  cliente: ExistingClientRecord
  oportunidade?: ExistingOpportunityRecord | null
}): ExistingClientFormPatch {
  const { cliente, oportunidade } = input
  return {
    nome: cliente.nome.toUpperCase(),
    whatsapp: cliente.telefone || '',
    canal: cliente.canal_origem ? CANAL_DB_TO_UI[cliente.canal_origem] : '',
    veiculo_texto: (oportunidade?.veiculo_interesse || cliente.empresa || '').toUpperCase(),
    valor_negociado: formatCurrencyForForm(oportunidade?.valor_negociado),
    negociacao: oportunidade?.etapa || '',
    financiamento: oportunidade ? FINANCIAMENTO_DB_TO_UI[oportunidade.financiamento] : '',
    possui_troca: oportunidade?.carro_avaliado ? 'Sim' : 'Não',
    observacao: cliente.observacoes || '',
  }
}

export function findRecentClientAppointment(
  agendamentos: readonly ExistingAppointmentRecord[],
  clienteId: string,
  referenceDate: string,
  lookbackDays = 90,
): ExistingAppointmentRecord | null {
  const candidates = agendamentos
    .filter(agendamento => agendamento.cliente_id === clienteId)
    .map(agendamento => ({ agendamento, daysAgo: dateDistanceInDays(referenceDate, agendamento.data_hora) }))
    .filter(({ daysAgo }) => daysAgo !== null && daysAgo >= 0 && daysAgo <= lookbackDays)
    .sort((a, b) => (a.daysAgo as number) - (b.daysAgo as number))

  return candidates[0]?.agendamento || null
}

export function findMostRecentClientAppointment(
  agendamentos: readonly ExistingAppointmentRecord[],
  clienteId: string,
): ExistingAppointmentRecord | null {
  const candidates = agendamentos
    .filter(agendamento => agendamento.cliente_id === clienteId && dateOnly(agendamento.data_hora))
    .sort((a, b) => (dateOnly(b.data_hora) || '').localeCompare(dateOnly(a.data_hora) || ''))
  return candidates[0] || null
}
