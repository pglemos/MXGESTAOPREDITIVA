// Aba "Hoje" da Central de Execução — deriva a agenda do dia das MESMAS fontes
// já usadas pelo Fechamento Diário (oportunidades + agendamentos), sem criar
// tabela nova de cliente/venda/agendamento (ver EV-1.7 / clientes-list-from-crm.ts).
//
// Regra de entrada (spec Central de Execução §3.2): aparece quando
// vendaRealizada == 'Em Negociação' E dataAgendamento (do agendamento mais
// recente vinculado) cai no dia de hoje (America/Sao_Paulo). Regra de saída
// (§3.3) é implícita: o item some sozinho quando esses critérios deixam de
// valer após reagendar/registrar venda/perda, porque a lista é recalculada a
// cada fetch — não há estado próprio a "remover".
import {
  CANAL_LABEL,
  FINANCIAMENTO_LABEL,
  compareceuFromStatus,
  timestampMatchesDateOnly,
  vendaRealizadaFromEtapa,
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
}

export interface AgendaHojeItem {
  id: string
  oportunidadeId: string
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
  oportunidade: OportunidadeForAgendaHoje
  agendamento: AgendamentoForAgendaHoje
}

const STATUS_TRATADO = new Set(['compareceu', 'nao_compareceu'])

function isAtrasadoNaoTratado(horarioIso: string, status: string | undefined, now: Date): boolean {
  if (STATUS_TRATADO.has(status || '')) return false
  const horario = new Date(horarioIso)
  if (Number.isNaN(horario.getTime())) return false
  return horario.getTime() < now.getTime()
}

export function deriveAgendaHojeFromCrm(
  oportunidades: readonly OportunidadeForAgendaHoje[],
  agendamentos: readonly AgendamentoForAgendaHoje[],
  hojeStr: string,
  now: Date = new Date(),
): AgendaHojeItem[] {
  const agendamentoPorOportunidade = new Map<string, AgendamentoForAgendaHoje>()
  for (const ag of agendamentos) {
    if (!ag.oportunidade_id) continue
    const existing = agendamentoPorOportunidade.get(ag.oportunidade_id)
    if (!existing || new Date(ag.data_hora) > new Date(existing.data_hora)) {
      agendamentoPorOportunidade.set(ag.oportunidade_id, ag)
    }
  }

  const items: AgendaHojeItem[] = []
  for (const op of oportunidades) {
    const vendaRealizada = vendaRealizadaFromEtapa(op.etapa)
    if (vendaRealizada !== 'Em Negociação') continue

    const agendamento = agendamentoPorOportunidade.get(op.id)
    if (!agendamento) continue
    if (!timestampMatchesDateOnly(agendamento.data_hora, hojeStr)) continue

    items.push({
      id: op.id,
      oportunidadeId: op.id,
      agendamentoId: agendamento.id,
      clienteId: op.cliente_id,
      clienteNome: op.cliente?.nome ?? '',
      clienteTelefone: op.cliente?.telefone ?? null,
      veiculoInteresse: op.veiculo_interesse,
      valorNegociado: op.valor_negociado || null,
      canal: CANAL_LABEL[op.canal ?? ''] ?? 'Showroom',
      compareceu: compareceuFromStatus(agendamento.status),
      financiamentoLabel: FINANCIAMENTO_LABEL[op.financiamento] ?? 'Não se aplica',
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
