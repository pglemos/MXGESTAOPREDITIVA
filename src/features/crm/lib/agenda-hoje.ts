// Aba "Hoje" da Rotina do Dia — deriva a agenda do dia das MESMAS fontes já
// usadas pelo Fechamento Diário (oportunidades + agendamentos), sem criar
// tabela nova de cliente/venda/agendamento (ver EV-1.7 / clientes-list-from-crm.ts).
//
// Regra de entrada (espelha Base44 AbaHoje.jsx): qualquer agendamento
// (visita/retorno/test-drive/entrega/negociação/garantia/pós-venda) cuja
// dataAgendamento cai no dia de hoje (America/Sao_Paulo) aparece na lista,
// vinculado ou não a uma oportunidade do funil. Regra de saída é implícita:
// o item some sozinho quando o status muda para compareceu/não compareceu ou
// a data deixa de ser hoje, porque a lista é recalculada a cada fetch — não
// há estado próprio a "remover".
import {
  CANAL_LABEL,
  FINANCIAMENTO_LABEL,
  compareceuFromStatus,
  timestampMatchesDateOnly,
} from '@/features/checkin/lib/clientes-list-from-crm'
import type { ClienteRow } from '@/features/checkin/hooks/useCheckinPage'

export interface OportunidadeForAgendaHoje {
  id: string
  cliente_id: string
  seller_user_id: string
  veiculo_interesse: string | null
  tipo_veiculo: string | null
  valor_negociado: number
  etapa: string
  canal: string | null
  sinal: number
  financiamento: string
  carro_avaliado: boolean
  motivo_perda: string | null
  created_at: string
  cliente?: { nome: string; telefone: string | null } | null
}

export interface AgendamentoForAgendaHoje {
  id: string
  cliente_id: string | null
  oportunidade_id: string | null
  data_hora: string
  canal: string | null
  tipo: string
  status: string
  proxima_acao: string | null
  observacoes: string | null
  cliente?: { nome: string; telefone: string | null } | null
}

export interface AgendaHojeItem {
  id: string
  oportunidadeId: string | null
  agendamentoId: string | null
  clienteId: string
  clienteNome: string
  clienteTelefone: string | null
  veiculoInteresse: string | null
  valorNegociado: number | null
  canal: ClienteRow['canal']
  compareceu: ClienteRow['compareceu']
  financiamentoLabel: ClienteRow['financiamento']
  horario: string
  atrasadoNaoTratado: boolean
  proximaAcao: string | null
  /** null quando o agendamento não está vinculado a uma oportunidade do funil (ex.: atividade avulsa). */
  oportunidade: OportunidadeForAgendaHoje | null
  agendamento: AgendamentoForAgendaHoje
}

const STATUS_TRATADO = new Set(['compareceu', 'nao_compareceu'])

function isAtrasadoNaoTratado(horarioIso: string, status: string | undefined, now: Date): boolean {
  if (STATUS_TRATADO.has(status || '')) return false
  const horario = new Date(horarioIso)
  if (Number.isNaN(horario.getTime())) return false
  return horario.getTime() < now.getTime()
}

/**
 * Deriva a lista de itens da aba "Hoje" a partir de QUALQUER agendamento
 * marcado para hoje (visita/retorno/test-drive/entrega/negociação/garantia/
 * pós-venda) — não só os vinculados a uma oportunidade "Em Negociação" do
 * funil. Espelha o `AbaHoje.jsx` do Base44: nem toda atividade do dia precisa
 * estar ligada a uma oportunidade de venda em andamento (ex.: uma garantia ou
 * um pós-venda avulso criado via "Nova atividade").
 */
export function deriveAgendaHojeFromCrm(
  oportunidades: readonly OportunidadeForAgendaHoje[],
  agendamentos: readonly AgendamentoForAgendaHoje[],
  hojeStr: string,
  now: Date = new Date(),
): AgendaHojeItem[] {
  const oportunidadePorId = new Map(oportunidades.map(op => [op.id, op]))

  const items: AgendaHojeItem[] = []
  for (const agendamento of agendamentos) {
    // Já tratado (compareceu/não compareceu) — some da lista, igual ao Base44 (status "Resolvida"/"Cancelada").
    if (agendamento.status === 'compareceu' || agendamento.status === 'nao_compareceu') continue
    if (!timestampMatchesDateOnly(agendamento.data_hora, hojeStr)) continue

    const op = agendamento.oportunidade_id ? oportunidadePorId.get(agendamento.oportunidade_id) ?? null : null
    const clienteNome = op?.cliente?.nome ?? agendamento.cliente?.nome ?? ''
    const clienteTelefone = op?.cliente?.telefone ?? agendamento.cliente?.telefone ?? null

    items.push({
      id: agendamento.id,
      oportunidadeId: op?.id ?? null,
      agendamentoId: agendamento.id,
      clienteId: op?.cliente_id ?? agendamento.cliente_id ?? '',
      clienteNome,
      clienteTelefone,
      veiculoInteresse: op?.veiculo_interesse ?? null,
      valorNegociado: op?.valor_negociado || null,
      canal: CANAL_LABEL[(agendamento.canal ?? op?.canal) ?? ''] ?? 'Showroom',
      compareceu: compareceuFromStatus(agendamento.status),
      financiamentoLabel: op ? (FINANCIAMENTO_LABEL[op.financiamento] ?? 'Não se aplica') : 'Não se aplica',
      horario: agendamento.data_hora,
      atrasadoNaoTratado: isAtrasadoNaoTratado(agendamento.data_hora, agendamento.status, now),
      proximaAcao: agendamento.proxima_acao,
      oportunidade: op,
      agendamento,
    })
  }

  return items.sort((a, b) => {
    if (a.atrasadoNaoTratado !== b.atrasadoNaoTratado) return a.atrasadoNaoTratado ? -1 : 1
    return new Date(a.horario).getTime() - new Date(b.horario).getTime()
  })
}
