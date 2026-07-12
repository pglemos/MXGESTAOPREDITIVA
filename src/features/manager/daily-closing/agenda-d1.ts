import type { Database } from '@/types/database.generated'

export type AgendaTipo = Database['public']['Enums']['crm_agendamento_tipo']
export type AgendaStatus = Database['public']['Enums']['crm_agendamento_status']
export type AgendaCanal = Database['public']['Enums']['crm_canal']

export interface AgendaD1Row {
  id: string
  data_hora: string
  canal: AgendaCanal | null
  tipo: AgendaTipo
  status: AgendaStatus
  observacoes: string | null
  seller_user_id: string
  cliente: {
    id: string
    nome: string
    telefone: string | null
    telefone_normalizado: string | null
    ultima_interacao: string | null
  } | null
  oportunidade?: { veiculo_interesse: string | null } | null
}

export const AGENDA_TIPO_LABEL: Record<AgendaTipo, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
  garantia: 'Garantia',
  pos_venda: 'Pós-venda',
}

export const AGENDA_STATUS_LABEL: Record<AgendaStatus, string> = {
  confirmado: 'Confirmado',
  aguardando: 'Aguardando',
  compareceu: 'Compareceu',
  nao_compareceu: 'Não compareceu',
}

export const AGENDA_CANAL_LABEL: Record<AgendaCanal, string> = {
  carteira: 'Carteira',
  internet: 'Internet',
  showroom: 'Showroom',
  porta: 'Porta',
}

export const CONFIRMATION_OUTCOMES = [
  'Confirmado',
  'Sem resposta',
  'Solicitou reagendamento',
  'Cancelou',
  'Outro',
] as const
export type ConfirmationOutcome = (typeof CONFIRMATION_OUTCOMES)[number]

const SAO_PAULO_DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function getSaoPauloDateTime(value: string) {
  const parts = Object.fromEntries(SAO_PAULO_DATE_TIME.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return { day: parts.day, month: parts.month, hour: Number(parts.hour), minute: parts.minute }
}

/** Normaliza telefone brasileiro para uso em wa.me/tel:. Retorna null quando inválido. */
export function normalizePhoneBr(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D+/g, '')
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits
  return null
}

/** Mensagem de confirmação por tipo, sem linhas vazias quebradas; link só quando existir. */
export function buildWhatsappMessage(input: {
  clienteNome: string
  tipo: AgendaTipo
  dataHora: string
  lojaNome?: string | null
  meetLink?: string | null
}): string {
  const local = getSaoPauloDateTime(input.dataHora)
  const hora = `${String(local.hour).padStart(2, '0')}:${local.minute}`
  const dia = `${local.day}/${local.month}`
  const loja = input.lojaNome ? ` na ${input.lojaNome}` : ''
  const porTipo: Record<AgendaTipo, string> = {
    visita: `sua visita${loja}`,
    retorno: `seu retorno${loja}`,
    test_drive: `seu test drive${loja}`,
    entrega: `a entrega do seu veículo${loja}`,
    negociacao: `nossa conversa de negociação${loja}`,
    garantia: `seu atendimento de garantia${loja}`,
    pos_venda: `seu atendimento de pós-venda${loja}`,
  }
  const lines = [
    `Olá, ${input.clienteNome}! Tudo bem?`,
    `Passando para confirmar ${porTipo[input.tipo]} amanhã (${dia}) às ${hora}.`,
  ]
  if (input.meetLink) lines.push(`Link da videoconferência: ${input.meetLink}`)
  lines.push('Podemos confirmar? Qualquer imprevisto, é só me avisar por aqui.')
  return lines.join('\n')
}

export function buildWhatsappUrl(normalizedPhone: string, message: string): string {
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

/** Extrai link de videoconferência das observações do agendamento, quando existir. */
export function extractMeetLink(observacoes: string | null | undefined): string | null {
  if (!observacoes) return null
  const match = observacoes.match(/https?:\/\/(meet\.google\.com|zoom\.us|teams\.microsoft\.com)\S*/i)
  return match ? match[0] : null
}

/** Registro ativo, cliente sem duplicidade: mantém o agendamento mais cedo por cliente. */
export function dedupeActiveAppointments(rows: AgendaD1Row[]): AgendaD1Row[] {
  const sorted = [...rows].sort((a, b) => a.data_hora.localeCompare(b.data_hora))
  const seen = new Set<string>()
  const result: AgendaD1Row[] = []
  for (const row of sorted) {
    if (!row.cliente) continue
    if (row.status === 'nao_compareceu') continue
    if (seen.has(row.cliente.id)) continue
    seen.add(row.cliente.id)
    result.push(row)
  }
  return result
}

export interface AgendaD1Filters {
  sellerId: string | 'all'
  canal: AgendaCanal | 'all'
  tipo: AgendaTipo | 'all'
  status: AgendaStatus | 'all'
  periodo: 'all' | 'manha' | 'tarde' | 'noite'
}

export const AGENDA_D1_DEFAULT_FILTERS: AgendaD1Filters = { sellerId: 'all', canal: 'all', tipo: 'all', status: 'all', periodo: 'all' }

export function filterAgenda(rows: AgendaD1Row[], filters: AgendaD1Filters): AgendaD1Row[] {
  return rows.filter(row => {
    if (filters.sellerId !== 'all' && row.seller_user_id !== filters.sellerId) return false
    if (filters.canal !== 'all' && row.canal !== filters.canal) return false
    if (filters.tipo !== 'all' && row.tipo !== filters.tipo) return false
    if (filters.status !== 'all' && row.status !== filters.status) return false
    if (filters.periodo !== 'all') {
      const hour = getSaoPauloDateTime(row.data_hora).hour
      if (filters.periodo === 'manha' && hour >= 12) return false
      if (filters.periodo === 'tarde' && (hour < 12 || hour >= 18)) return false
      if (filters.periodo === 'noite' && hour < 18) return false
    }
    return true
  })
}
