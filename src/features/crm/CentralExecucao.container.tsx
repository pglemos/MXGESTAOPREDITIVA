import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlarmClock,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Info,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RotateCcw,
  SquareUserRound,
  Store,
  Target,
  UserPlus,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Select } from '@/components/atoms/Select'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { calculateReferenceDate, useCheckinsToday } from '@/hooks/checkins'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  CRM_AGENDAMENTO_STATUS,
  CRM_AGENDAMENTO_STATUS_LABEL,
  CRM_AGENDAMENTO_TIPO,
  CRM_CANAIS,
  CRM_CANAL_LABEL,
  toDateOnlyBR,
  type CrmAgendamentoStatus,
  type CrmCanal,
  type CrmClienteStatus,
} from '@/lib/schemas/crm.schema'
import { deriveDailyRoutineSlots, resolveCloseDayReminderSchedule, type DailyRoutineAutoSlot } from '@/lib/daily-routine'
import { useAgendamentos, type AgendamentoComCliente, type AgendamentoInput } from '@/features/crm/hooks/useAgendamentos'
import { useAtendimentos } from '@/features/crm/hooks/useAtendimentos'
import { useCadenciaAgenda, type CadenciaAgendaItem } from '@/features/crm/hooks/useCadenciaAgenda'
import { useClientes, type ClienteInput } from '@/features/crm/hooks/useClientes'
import { useFeedbackActions } from '@/features/crm/hooks/useFeedbackActions'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { montarDataHoraAcaoCadencia, type CadenciaResultadoAcao } from '@/features/crm/lib/cadencia'
import { mapFeedbackActionToAgendaItem, type FeedbackActionRow } from '@/features/gerente-feedback/lib/feedback-actions'

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
  feedback: 'Feedback do gestor',
}

const FUNIL_LABEL: Record<string, string> = {
  prospeccao: 'Prospecção',
  lead: 'Lead',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  negociacao: 'Negociação',
  proposta: 'Proposta enviada',
  fechamento: 'Fechamento',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

const STATUS_CLIENTE_LABEL: Record<CrmClienteStatus, string> = {
  aguardando_contato: 'Aguardando contato',
  oportunidade: 'Oportunidade',
  ativo: 'Ativo',
  pos_venda: 'Pós-venda',
  inativo: 'Inativo',
}

type FiltroData = 'todos' | 'hoje' | 'atrasados' | 'proximos7'
type CanalFiltro = 'todos' | CrmCanal
type AgendaCentralStatus = CrmAgendamentoStatus | 'cadencia' | 'feedback_pendente' | 'reagendado'
type OrigemAcao = 'agendamento' | 'cadencia' | 'feedback'
type PrioridadeAcao = 'Urgente' | 'Alta' | 'Média' | 'Baixa'

type AgendaCentralItem = {
  id: string
  origem: OrigemAcao
  data_hora: string
  canal: CrmCanal | null
  status: AgendaCentralStatus
  statusLabel: string
  proxima_acao: string | null
  cliente: { nome: string; telefone: string | null } | null
  oportunidade: { veiculo_interesse: string | null; valor_negociado?: number | null } | null
  tipo: string | null
  etapa: string | null
  agendamento?: AgendamentoComCliente
  cadencia?: CadenciaAgendaItem
  feedbackAction?: FeedbackActionRow
  alertTone?: 'error'
}

type NewClientForm = {
  nome: string
  telefone: string
  canal: CrmCanal | ''
  veiculo: string
  etapa: CrmClienteStatus
  proxima_acao: string
  data_hora: string
}

type ScoreLine = {
  label: string
  value: string
  done: boolean
  tone?: 'green' | 'orange' | 'muted'
}

const EMPTY_AGENDAMENTO: AgendamentoInput = {
  cliente_id: '',
  data_hora: '',
  canal: null,
  tipo: 'visita',
  status: 'aguardando',
  proxima_acao: '',
}

const EMPTY_CLIENTE: NewClientForm = {
  nome: '',
  telefone: '',
  canal: 'carteira',
  veiculo: '',
  etapa: 'aguardando_contato',
  proxima_acao: 'Enviar mensagem 1 de primeiro contato',
  data_hora: '',
}

const canalTone: Record<string, string> = {
  carteira: 'bg-status-success-surface text-status-success border-status-success/20',
  internet: 'bg-status-info-surface text-status-info border-status-info/20',
  showroom: 'bg-status-warning-surface text-status-warning border-status-warning/20',
  porta: 'bg-surface-alt text-text-secondary border-border-subtle',
}

const origemTone: Record<string, string> = {
  Cadência: 'bg-status-info-surface text-status-info border-status-info/20',
  Feedback: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  Manual: 'bg-surface-alt text-text-secondary border-border-subtle',
  Agendamento: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
}

const prioridadeTone: Record<PrioridadeAcao, string> = {
  Urgente: 'bg-status-error-surface text-status-error border-status-error/20',
  Alta: 'bg-status-error-surface text-status-error border-status-error/20',
  Média: 'bg-status-warning-surface text-status-warning border-status-warning/20',
  Baixa: 'bg-surface-alt text-text-secondary border-border-subtle',
}

const statusTone: Record<string, string> = {
  cadencia: 'bg-status-info-surface text-status-info border-status-info/20',
  feedback_pendente: 'bg-status-error-surface text-status-error border-status-error/20',
  confirmado: 'bg-status-success-surface text-status-success border-status-success/20',
  aguardando: 'bg-status-info-surface text-status-info border-status-info/20',
  compareceu: 'bg-status-success-surface text-status-success border-status-success/20',
  nao_compareceu: 'bg-status-error-surface text-status-error border-status-error/20',
  reagendado: 'bg-status-warning-surface text-status-warning border-status-warning/20',
}

function isSameDay(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

function onlyDigits(value: string | null | undefined) {
  return (value || '').replace(/\D/g, '')
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function getDateLabel(date: Date) {
  const dateLabel = date.toLocaleDateString('pt-BR')
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${dateLabel} (${weekday.charAt(0).toUpperCase()}${weekday.slice(1)})`
}

function getActionTime(action: string | null | undefined) {
  if (!action) return null
  return action.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)?.[0] || null
}

function humanizeKey(value: string | null | undefined) {
  if (!value) return 'Não definido'
  return FUNIL_LABEL[value] || value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function mapAgendamentoToAgendaItem(item: AgendamentoComCliente): AgendaCentralItem {
  return {
    id: item.id,
    origem: 'agendamento',
    data_hora: item.data_hora,
    canal: item.canal,
    status: item.status,
    statusLabel: CRM_AGENDAMENTO_STATUS_LABEL[item.status],
    proxima_acao: item.proxima_acao,
    cliente: item.cliente ? { nome: item.cliente.nome, telefone: item.cliente.telefone } : null,
    oportunidade: item.oportunidade || null,
    tipo: item.tipo,
    etapa: item.tipo === 'negociacao' ? 'negociacao' : item.tipo === 'retorno' ? 'retorno' : 'visita',
    agendamento: item,
  }
}

function mapCadenciaToAgendaItem(item: CadenciaAgendaItem): AgendaCentralItem {
  return {
    id: `cadencia-${item.cadencia_estado_id}`,
    origem: 'cadencia',
    data_hora: montarDataHoraAcaoCadencia(item.proxima_acao_em, item.proxima_acao, item.canal),
    canal: item.canal,
    status: 'cadencia',
    statusLabel: item.last_result === 'aguardando' ? 'Aguardando' : 'Pendente',
    proxima_acao: item.proxima_acao,
    cliente: { nome: item.cliente_nome, telefone: item.cliente_telefone },
    oportunidade: null,
    tipo: null,
    etapa: item.etapa_atual,
    cadencia: item,
  }
}

function getOrigemLabel(item: AgendaCentralItem) {
  if (item.origem === 'cadencia') return 'Cadência'
  if (item.origem === 'feedback') return 'Feedback'
  if (item.tipo === 'retorno' || item.tipo === 'visita' || item.tipo === 'test_drive') return 'Agendamento'
  return 'Manual'
}

function getCadenciaLabel(item: AgendaCentralItem) {
  if (item.origem === 'cadencia' && item.cadencia) {
    return `${humanizeKey(item.cadencia.etapa_atual)} · ${item.cadencia.passo_atual_key.replace(/_/g, ' ')}`
  }
  if (item.origem === 'feedback') return 'Ação do gestor'
  return item.tipo ? TIPO_LABEL[item.tipo] || 'Manual' : 'Manual'
}

function getPriority(item: AgendaCentralItem, now = new Date()): PrioridadeAcao {
  const action = (item.proxima_acao || '').toLowerCase()
  const isLate = new Date(item.data_hora).getTime() < now.getTime() && !isSameDay(new Date(item.data_hora), now)
  if (isLate || item.alertTone === 'error' || action.includes('urgente')) return 'Urgente'
  if (item.origem === 'feedback' || item.tipo === 'negociacao' || item.etapa === 'negociacao') return 'Alta'
  if (item.origem === 'cadencia' || item.status === 'confirmado') return 'Média'
  return 'Baixa'
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn('inline-flex rounded-mx-sm border px-2 py-1 text-xs font-bold', className)}>{children}</span>
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone: 'green' | 'red' | 'orange' | 'blue'
}) {
  const toneClass = {
    green: 'bg-status-success-surface text-status-success',
    red: 'bg-status-error-surface text-status-error',
    orange: 'bg-status-warning-surface text-status-warning',
    blue: 'bg-status-info-surface text-status-info',
  }[tone]

  return (
    <Card className="h-[124px] rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex h-full items-center gap-mx-sm">
        <span className={cn('flex h-mx-2xl w-mx-2xl shrink-0 items-center justify-center rounded-full', toneClass)}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="tiny" className="font-bold uppercase leading-tight tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="mt-1 text-3xl leading-none text-text-primary">{value}</Typography>
          <Typography variant="caption" tone="muted" className="mt-mx-xs block leading-tight tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

function ScoreCard({ score, items }: { score: number; items: ScoreLine[] }) {
  return (
    <Card className="h-[124px] rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="grid h-full grid-cols-[96px_1fr] items-center gap-mx-md">
        <div className="relative flex h-[86px] w-[86px] items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${score * 3.6}deg, var(--color-border-subtle) 0deg)` }}>
          <div className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-white">
            <Typography variant="h2" className="text-2xl leading-none text-brand-primary">{score}%</Typography>
            <Typography variant="tiny" className="font-bold leading-none tracking-normal text-brand-primary">{score >= 70 ? 'Bom!' : 'Foco!'}</Typography>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-mx-tiny">
            <Typography variant="tiny" className="font-bold uppercase tracking-normal text-text-primary">Score da Rotina</Typography>
            <Info size={12} className="text-text-tertiary" />
          </div>
          <div className="mt-2 space-y-1">
            {items.map(item => (
              <div key={item.label} className="grid grid-cols-[14px_1fr_auto] items-center gap-1.5 text-[11px]">
                <span className={cn('flex h-3.5 w-3.5 items-center justify-center rounded-full text-white', item.done ? 'bg-status-success' : item.tone === 'orange' ? 'bg-status-warning' : 'border border-border-strong bg-white')} />
                <span className="truncate font-semibold text-text-secondary">{item.label}</span>
                <span className={cn('font-bold', item.done ? 'text-brand-primary' : item.tone === 'orange' ? 'text-status-warning' : 'text-text-tertiary')}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function RoutineTimeline({ slots }: { slots: DailyRoutineAutoSlot[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-start justify-between gap-mx-sm">
        <div>
          <Typography variant="h3" className="text-base tracking-normal">Rotina do Dia</Typography>
          <Typography variant="caption" tone="muted" className="tracking-normal">Siga sua rotina e ganhe disciplina.</Typography>
        </div>
        <MoreHorizontal size={18} className="text-text-tertiary" />
      </div>
      <div className="mt-mx-sm space-y-mx-xs">
        {slots.map((slot, index) => (
          <div key={slot.key} className="relative grid grid-cols-[24px_42px_1fr] gap-mx-xs">
            {index < slots.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%+4px)] w-px bg-border-subtle" />}
            <span className={cn('relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border bg-white', slot.state === 'done' ? 'border-status-success bg-status-success text-white' : 'border-border-strong text-text-tertiary')}>
              {slot.state === 'done' ? <Check size={12} /> : null}
            </span>
            <Typography variant="caption" className="pt-1 font-bold text-text-primary">{slot.time}</Typography>
            <div className="min-w-0">
              <Typography variant="p" className="text-xs font-bold leading-tight text-text-primary">{slot.title}</Typography>
              <Typography variant="caption" tone="muted" className="normal-case leading-snug tracking-normal">{slot.progress}</Typography>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
  className,
}: {
  label: string
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <Button variant="outline" size="icon" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={cn('h-8 w-8 rounded-mx-md bg-white', className)}>
      {children}
    </Button>
  )
}

function AgendaRow({
  item,
  statusSaving,
  onWhatsApp,
  onAgendamentoStatus,
  onCadenciaStatus,
  onFeedbackActionDone,
  onReagendar,
  onMore,
}: {
  item: AgendaCentralItem
  statusSaving: boolean
  onWhatsApp: () => void
  onAgendamentoStatus: (item: AgendaCentralItem, status: CrmAgendamentoStatus) => void
  onCadenciaStatus: (item: AgendaCentralItem, status: CadenciaResultadoAcao) => void
  onFeedbackActionDone: (item: AgendaCentralItem) => void
  onReagendar: () => void
  onMore: () => void
}) {
  const actionTime = getActionTime(item.proxima_acao)
  const vehicle = item.oportunidade?.veiculo_interesse || (item.tipo ? TIPO_LABEL[item.tipo] : null) || 'Oportunidade'
  const value = item.oportunidade?.valor_negociado
    ? item.oportunidade.valor_negociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : item.origem === 'feedback'
      ? 'Ação obrigatória'
      : item.origem === 'cadencia'
        ? 'Ação sugerida'
        : 'Valor a definir'
  const priority = getPriority(item)
  const origem = getOrigemLabel(item)

  function handleDone() {
    if (item.origem === 'feedback') return onFeedbackActionDone(item)
    if (item.origem === 'cadencia') return onCadenciaStatus(item, 'feito')
    return onAgendamentoStatus(item, 'compareceu')
  }

  function handleNoAnswer() {
    if (item.origem === 'cadencia') return onCadenciaStatus(item, 'nao_feito')
    if (item.origem === 'agendamento') return onAgendamentoStatus(item, 'nao_compareceu')
    return onMore()
  }

  function handleWaiting() {
    if (item.origem === 'cadencia') return onCadenciaStatus(item, 'aguardando')
    if (item.origem === 'agendamento') return onAgendamentoStatus(item, 'aguardando')
    return onMore()
  }

  return (
    <tr className="border-t border-border-subtle align-middle hover:bg-surface-alt/60">
      <td className="whitespace-nowrap px-mx-sm py-mx-md">
        <div className="flex items-center gap-mx-xs">
          <Typography variant="p" className={cn('w-12 font-bold text-brand-primary', priority === 'Urgente' && 'text-status-error')}>{fmtHora(item.data_hora)}</Typography>
          <Bell size={14} className={cn('text-text-tertiary', priority === 'Urgente' && 'text-status-error')} />
        </div>
      </td>
      <td className="min-w-[154px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-bold leading-tight text-text-primary">{item.cliente?.nome || 'Cliente sem vínculo'}</Typography>
        <Typography variant="caption" tone="muted">{item.cliente?.telefone || 'Telefone não cadastrado'}</Typography>
      </td>
      <td className="min-w-[170px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-bold leading-tight text-text-primary">{vehicle}</Typography>
        <Typography variant="caption" tone="muted">{value}</Typography>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={canalTone[item.canal || 'porta'] || canalTone.porta}>{item.canal ? CRM_CANAL_LABEL[item.canal] : 'Carteira'}</Pill>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={origemTone[origem] || origemTone.Manual}>{origem}</Pill>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Typography variant="caption" className="font-bold text-text-secondary">{humanizeKey(item.etapa)}</Typography>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={statusTone[item.status] || statusTone.aguardando}>{item.statusLabel}</Pill>
      </td>
      <td className="min-w-[142px] px-mx-sm py-mx-md">
        <Typography variant="caption" className="font-bold text-text-primary">{getCadenciaLabel(item)}</Typography>
      </td>
      <td className="min-w-[160px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-bold leading-tight text-text-primary">{item.proxima_acao || 'Definir próxima ação'}</Typography>
        {actionTime && <Typography variant="caption" tone="muted" className="font-bold">{actionTime}</Typography>}
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={prioridadeTone[priority]}>{priority}</Pill>
      </td>
      <td className="min-w-[180px] px-mx-sm py-mx-md">
        <div className="flex items-center justify-end gap-1">
          {item.origem !== 'feedback' && (
            <IconAction label="WhatsApp" onClick={onWhatsApp} className="border-status-success/30 text-status-success hover:bg-status-success-surface">
              <MessageCircle size={14} />
            </IconAction>
          )}
          <IconAction label="Feito" disabled={statusSaving} onClick={handleDone} className="border-status-success/30 text-status-success hover:bg-status-success-surface">
            <Check size={14} />
          </IconAction>
          <IconAction label="Não respondeu" disabled={statusSaving} onClick={handleNoAnswer} className="border-status-error/30 text-status-error hover:bg-status-error-surface">
            <XCircle size={14} />
          </IconAction>
          <IconAction label="Aguardando" disabled={statusSaving} onClick={handleWaiting} className="border-status-warning/30 text-status-warning hover:bg-status-warning-surface">
            <Clock size={14} />
          </IconAction>
          <IconAction label="Reagendar" onClick={onReagendar} className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10">
            <RotateCcw size={14} />
          </IconAction>
          <Button variant="ghost" size="icon" aria-label="Mais ações" title="Mais ações" onClick={onMore} className="h-8 w-8 rounded-mx-md">
            <MoreHorizontal size={15} />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function CentralExecucao() {
  const { profile, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const {
    agendamentos,
    metrics,
    loading,
    error,
    createAgendamento,
    updateAgendamento,
    updateStatus,
  } = useAgendamentos()
  const { acoes: acoesCadencia, loading: cadenciaLoading, error: cadenciaError, refetch: refetchCadencia } = useCadenciaAgenda()
  const { acoes: acoesFeedback, loading: feedbackActionsLoading, error: feedbackActionsError, refetch: refetchFeedbackActions, concluirAcaoFeedback } = useFeedbackActions()
  const { porCanal: atendimentosPorCanal } = useAtendimentos()
  const { clientes, createCliente, registrarStatusCadencia, refetch: refetchClientes } = useClientes()
  const { perfil } = useVendedorPerfil()
  const referenceDate = calculateReferenceDate()
  const { todayCheckin, fetchTodayCheckin } = useCheckinsToday(profile, effectiveStoreId, referenceDate)

  const [filtro, setFiltro] = useState<FiltroData>('todos')
  const [canalFiltro, setCanalFiltro] = useState<CanalFiltro>('todos')
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [form, setForm] = useState<AgendamentoInput>(EMPTY_AGENDAMENTO)
  const [clienteForm, setClienteForm] = useState<NewClientForm>(EMPTY_CLIENTE)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cadenciaSavingId, setCadenciaSavingId] = useState<string | null>(null)
  const [feedbackSavingId, setFeedbackSavingId] = useState<string | null>(null)
  const [agendamentoSavingId, setAgendamentoSavingId] = useState<string | null>(null)

  const hoje = useMemo(() => new Date(), [])
  const hojeStr = useMemo(() => toDateOnlyBR(), [])
  const closeDayReminder = resolveCloseDayReminderSchedule({
    enabled: perfil.fechar_dia_notificacao_ativa,
    reminderTime: perfil.fechar_dia_notificacao_hora,
    workEndTime: perfil.hora_saida,
    workDays: perfil.dias_trabalho,
  })

  useEffect(() => {
    fetchTodayCheckin()
  }, [fetchTodayCheckin])

  useEffect(() => {
    if (error) console.error('Erro ao carregar agendamentos da Central de Execução:', error)
    if (cadenciaError) console.error('Erro ao carregar ações de cadência:', cadenciaError)
    if (feedbackActionsError) console.error('Erro ao carregar ações de feedback:', feedbackActionsError)
  }, [error, cadenciaError, feedbackActionsError])

  const agendaItens = useMemo(() => {
    const feedbackItens: AgendaCentralItem[] = acoesFeedback.flatMap((acao) => {
      const item = mapFeedbackActionToAgendaItem(acao, hoje)
      return item ? [item as AgendaCentralItem] : []
    })
    const items: AgendaCentralItem[] = [
      ...agendamentos.map(mapAgendamentoToAgendaItem),
      ...acoesCadencia.map(mapCadenciaToAgendaItem),
      ...feedbackItens,
    ]
    return items.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
  }, [acoesCadencia, acoesFeedback, agendamentos, hoje])

  const filtrados = useMemo(() => {
    const em7 = new Date()
    em7.setDate(em7.getDate() + 7)
    return agendaItens.filter(item => {
      const data = new Date(item.data_hora)
      const matchDate =
        filtro === 'todos'
        || (filtro === 'hoje' && isSameDay(data, hoje))
        || (filtro === 'atrasados' && data < hoje && !isSameDay(data, hoje))
        || (filtro === 'proximos7' && data >= hoje && data <= em7)
      const matchCanal = canalFiltro === 'todos' || item.canal === canalFiltro
      return matchDate && matchCanal
    })
  }, [agendaItens, canalFiltro, filtro, hoje])

  const rotinaSlots = useMemo(() => {
    const clientesCriadosHoje = clientes.filter(c => c.created_at && toDateOnlyBR(new Date(c.created_at)) === hojeStr).length
    const clientesAtualizadosHoje = clientes.filter(c => c.updated_at && toDateOnlyBR(new Date(c.updated_at)) === hojeStr).length
    const agendamentosCriadosHoje = agendamentos.filter(a => a.created_at && toDateOnlyBR(new Date(a.created_at)) === hojeStr).length
    const acoesListaQuenteHoje = agendaItens.filter((item) => {
      if (!isSameDay(new Date(item.data_hora), hoje)) return false
      const action = (item.proxima_acao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return item.tipo === 'negociacao' || item.etapa === 'negociacao' || action.includes('proposta') || action.includes('negoci')
    }).length
    return deriveDailyRoutineSlots({
      workStartTime: perfil.hora_entrada,
      workEndTime: perfil.hora_saida,
      atendimentosHoje: atendimentosPorCanal.total,
      minimumAtendimentos: 5,
      clientesCriadosHoje,
      clientesAtualizadosHoje,
      agendamentosCriadosHoje,
      acoesListaQuenteHoje,
      fechamentoDiarioFeito: Boolean(todayCheckin),
    })
  }, [agendamentos, agendaItens, atendimentosPorCanal.total, clientes, hoje, hojeStr, perfil.hora_entrada, perfil.hora_saida, todayCheckin])

  const clientesAtualizadosHoje = useMemo(
    () => clientes.filter(cliente => cliente.updated_at && toDateOnlyBR(new Date(cliente.updated_at)) === hojeStr).length,
    [clientes, hojeStr],
  )
  const score = Math.min(
    100,
    10
      + (clientesAtualizadosHoje > 0 ? 35 : 0)
      + (metrics.compareceram + metrics.naoCompareceram + metrics.aguardando > 0 ? 25 : 0)
      + (todayCheckin ? 30 : 0),
  )
  const scoreItems: ScoreLine[] = [
    { label: 'Abriu a Central de Execução', value: '100%', done: true, tone: 'green' },
    { label: 'Atualizou status dos clientes', value: clientesAtualizadosHoje > 0 ? '75%' : '0%', done: clientesAtualizadosHoje > 0, tone: 'green' },
    { label: 'Executou retornos', value: metrics.compareceram + metrics.naoCompareceram > 0 ? '50%' : '0%', done: metrics.compareceram + metrics.naoCompareceram > 0, tone: 'orange' },
    { label: 'Fez Fechamento Diário', value: todayCheckin ? '100%' : '0%', done: Boolean(todayCheckin), tone: 'muted' },
  ]

  const pendencias = useMemo(() => {
    const clientesSemStatusAtualizado = clientes.filter(cliente => !cliente.updated_at || toDateOnlyBR(new Date(cliente.updated_at)) !== hojeStr).length
    const feedbackObrigatorio = acoesFeedback.filter(acao => acao.obrigatoria_fechamento).length
    const acaoSemProximaEtapa = agendaItens.filter(item => !item.proxima_acao).length
    return [
      { label: 'clientes sem status atualizado', value: clientesSemStatusAtualizado, tone: 'green' },
      { label: 'feedback obrigatório pendente', value: feedbackObrigatorio, tone: 'red' },
      { label: 'ação sem próxima etapa', value: acaoSemProximaEtapa, tone: 'red' },
      { label: 'registro diário pendente', value: todayCheckin ? 0 : 1, tone: 'orange' },
    ]
  }, [acoesFeedback, agendaItens, clientes, hojeStr, todayCheckin])

  const statusDia = useMemo(() => {
    const atrasados = agendaItens.some(item => {
      const data = new Date(item.data_hora)
      return data < hoje && !isSameDay(data, hoje)
    })
    if (atrasados) return 'Ações atrasadas'
    if (todayCheckin) return 'Fechamento concluído'
    if (pendencias.some(item => item.value > 0)) return 'Fechamento pendente'
    return 'Dia em andamento'
  }, [agendaItens, hoje, pendencias, todayCheckin])

  const feedbackObrigatorio = acoesFeedback.find(acao => acao.obrigatoria_fechamento) || acoesFeedback[0]
  const hasLoadError = Boolean(error || cadenciaError || feedbackActionsError)

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY_AGENDAMENTO)
    setAgendaModalOpen(true)
  }

  function openEditModal(item: AgendamentoComCliente) {
    setEditingId(item.id)
    setForm({
      cliente_id: item.cliente_id || '',
      oportunidade_id: item.oportunidade_id || null,
      data_hora: item.data_hora ? new Date(item.data_hora).toISOString().slice(0, 16) : '',
      canal: item.canal || null,
      tipo: item.tipo,
      status: item.status,
      proxima_acao: item.proxima_acao || '',
      observacoes: item.observacoes || '',
    })
    setAgendaModalOpen(true)
  }

  async function handleSubmitAgendamento() {
    if (!form.data_hora) {
      toast.error('Informe data e hora.')
      return
    }
    setSaving(true)
    const { error: saveError } = editingId ? await updateAgendamento(editingId, form) : await createAgendamento(form)
    setSaving(false)
    if (saveError) {
      toast.error(saveError)
      return
    }
    toast.success(editingId ? 'Agendamento atualizado.' : 'Agendamento criado.')
    setForm(EMPTY_AGENDAMENTO)
    setEditingId(null)
    setAgendaModalOpen(false)
  }

  async function handleSubmitCliente() {
    if (!clienteForm.nome.trim() || !clienteForm.data_hora) {
      toast.error('Informe nome e data da próxima ação.')
      return
    }
    const payload: ClienteInput = {
      nome: clienteForm.nome,
      telefone: clienteForm.telefone || null,
      canal_origem: clienteForm.canal || null,
      status: clienteForm.etapa,
      proxima_acao: clienteForm.proxima_acao,
      proxima_acao_em: clienteForm.data_hora ? toDateOnlyBR(new Date(clienteForm.data_hora)) : null,
      observacoes: clienteForm.veiculo ? `Veículo de interesse: ${clienteForm.veiculo}` : null,
    }
    setSaving(true)
    const { error: clienteError, id } = await createCliente(payload)
    if (!clienteError && id) {
      await createAgendamento({
        cliente_id: id,
        data_hora: clienteForm.data_hora,
        canal: clienteForm.canal || null,
        tipo: 'retorno',
        status: 'aguardando',
        proxima_acao: clienteForm.proxima_acao,
        observacoes: clienteForm.veiculo ? `Veículo de interesse: ${clienteForm.veiculo}` : null,
      })
    }
    setSaving(false)
    if (clienteError) {
      toast.error(clienteError)
      return
    }
    toast.success('Cliente criado e ação adicionada à Central.')
    setClienteForm(EMPTY_CLIENTE)
    setClienteModalOpen(false)
    await Promise.all([refetchClientes(), refetchCadencia()])
  }

  async function handleAgendamentoStatus(item: AgendaCentralItem, status: CrmAgendamentoStatus) {
    if (!item.agendamento) return
    setAgendamentoSavingId(item.id)
    const { error: statusError } = await updateStatus(item.agendamento.id, status)
    setAgendamentoSavingId(null)
    if (statusError) {
      toast.error(statusError)
      return
    }
    toast.success(status === 'nao_compareceu' ? 'Cliente sem resposta. Sugira uma nova tentativa para não perder o retorno.' : 'Status da ação atualizado.')
  }

  async function handleCadenciaStatus(item: AgendaCentralItem, status: CadenciaResultadoAcao) {
    if (!item.cadencia) return
    setCadenciaSavingId(item.id)
    const { error: statusError } = await registrarStatusCadencia({ clienteId: item.cadencia.cliente_id, status })
    setCadenciaSavingId(null)
    if (statusError) {
      toast.error(statusError)
      return
    }
    await Promise.all([refetchCadencia(), refetchClientes()])
    if (status === 'nao_feito') {
      toast.info('Próxima tentativa sugerida: reagendar retorno para o próximo horário disponível.')
      return
    }
    toast.success('Cadência atualizada.')
  }

  async function handleFeedbackActionDone(item: AgendaCentralItem) {
    if (!item.feedbackAction) return
    setFeedbackSavingId(item.id)
    const { error: actionError } = await concluirAcaoFeedback(item.feedbackAction.id)
    setFeedbackSavingId(null)
    if (actionError) {
      toast.error(actionError)
      return
    }
    await refetchFeedbackActions()
    toast.success('Ação do feedback concluída.')
  }

  function openWhatsApp(item: AgendaCentralItem) {
    const tel = onlyDigits(item.cliente?.telefone)
    if (!tel) {
      toast.error('Cliente sem telefone cadastrado.')
      return
    }
    const num = tel.length <= 11 ? `55${tel}` : tel
    window.open(`https://wa.me/${num}`, '_blank', 'noopener')
  }

  return (
    <main className="min-h-full w-full bg-white p-mx-sm md:p-mx-md">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-mx-md pb-20">
        <header className="flex flex-col gap-mx-md rounded-mx-xl border border-border-subtle bg-white px-mx-lg py-mx-md shadow-mx-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Typography variant="h1" className="text-2xl leading-tight text-text-primary">Central de Execução</Typography>
            <Typography variant="caption" tone="muted">Sua rotina diária. Organize seu dia e foque no que gera resultado.</Typography>
          </div>
          <div className="flex flex-wrap items-center gap-mx-sm">
            <div className="inline-flex h-mx-11 items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-sm text-sm font-bold text-text-primary shadow-mx-sm">
              <Calendar size={16} className="text-text-secondary" />
              {getDateLabel(hoje)}
              <ChevronDown size={15} className="text-text-tertiary" />
            </div>
            <Button variant="outline" onClick={() => toast.info('Agenda sincronizada com a rotina local.')} className="h-mx-11 bg-white">
              <RotateCcw size={16} /> Sincronizar Agenda
            </Button>
            <div className="relative flex h-mx-11 w-mx-11 items-center justify-center rounded-mx-md border border-border-subtle bg-white shadow-mx-sm">
              <Bell size={18} className="text-text-secondary" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-error text-[10px] font-bold text-white">{Math.min(pendencias.reduce((acc, item) => acc + item.value, 0), 9)}</span>
            </div>
            <div className="flex items-center gap-mx-sm rounded-mx-md bg-white px-mx-sm py-mx-xs">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-bold text-brand-primary">
                {(profile?.name || 'V').slice(0, 1)}
              </span>
              <span>
                <Typography variant="caption" className="block font-bold text-text-primary">{profile?.name || 'Vendedor'}</Typography>
                <Typography variant="tiny" tone="muted">Vendedor</Typography>
                <span className={cn('mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold', statusDia === 'Ações atrasadas' ? 'border-status-error/30 bg-status-error-surface text-status-error' : 'border-status-success/20 bg-status-success-surface text-status-success')}>
                  {statusDia}
                </span>
              </span>
              <ChevronDown size={16} className="text-text-tertiary" />
            </div>
          </div>
        </header>

        {hasLoadError && (
          <div className="rounded-mx-md border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm">
            <Typography className="text-status-error">Não foi possível carregar ações de cadência. Tente novamente.</Typography>
          </div>
        )}

        <section className="grid grid-cols-1 gap-mx-sm md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(145px,1fr))_minmax(330px,1.7fr)]" aria-label="Indicadores do dia">
          <MetricCard icon={<CalendarCheck size={24} />} label="Agendamentos Hoje" value={String(metrics.agendamentosHoje)} hint="100% do dia" tone="green" />
          <MetricCard icon={<CheckCircle2 size={24} />} label="Compareceram" value={String(metrics.compareceram)} hint={`${metrics.taxaComparecimento}% do dia`} tone="green" />
          <MetricCard icon={<XCircle size={24} />} label="Não Compareceram" value={String(metrics.naoCompareceram)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.naoCompareceram / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="red" />
          <MetricCard icon={<Clock size={24} />} label="Em Negociação" value={String(metrics.emNegociacao)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.emNegociacao / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="orange" />
          <MetricCard icon={<CircleDollarSign size={24} />} label="Vendas Realizadas" value={String(metrics.vendasRealizadas)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.vendasRealizadas / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="green" />
          <ScoreCard score={score} items={scoreItems} />
        </section>

        <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-mx-md">
            <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
              <div className="flex flex-wrap items-center gap-mx-xs">
                <FilterButton active={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</FilterButton>
                <FilterButton active={filtro === 'hoje'} onClick={() => setFiltro('hoje')}><Calendar size={15} /> Hoje</FilterButton>
                <FilterButton active={filtro === 'atrasados'} onClick={() => setFiltro('atrasados')}><AlarmClock size={15} /> Atrasados</FilterButton>
                <FilterButton active={filtro === 'proximos7'} onClick={() => setFiltro('proximos7')}><CalendarCheck size={15} /> Próximos 7 dias</FilterButton>
                <FilterSelectButton active={canalFiltro === 'todos'} onClick={() => setCanalFiltro('todos')}>Todos os Canais</FilterSelectButton>
                <FilterSelectButton active={false} onClick={() => toast.info('Filtro por origem será aplicado automaticamente pelos dados exibidos.')}>Origem da ação</FilterSelectButton>
                <FilterSelectButton active={false} onClick={() => toast.info('Prioridades são calculadas conforme prazo, origem e etapa.')}>Prioridade</FilterSelectButton>
                <FilterSelectButton active={false} onClick={() => toast.info('Use a coluna Status da Ação para acompanhar cada cliente.')}>Status da ação</FilterSelectButton>
              </div>
              <div className="mt-mx-sm flex flex-wrap items-center gap-mx-xs">
                {CRM_CANAIS.filter(canal => canal !== 'porta').map(canal => (
                  <FilterButton key={canal} active={canalFiltro === canal} onClick={() => setCanalFiltro(canalFiltro === canal ? 'todos' : canal)}>
                    {canal === 'carteira' ? <SquareUserRound size={15} /> : canal === 'internet' ? <CalendarCheck size={15} /> : <Store size={15} />}
                    {CRM_CANAL_LABEL[canal]}
                  </FilterButton>
                ))}
                <Button variant="outline" size="sm" onClick={openCreateModal} className="ml-auto h-mx-10 border-brand-primary/30 bg-white text-brand-primary">
                  <Plus size={15} /> Nova Atividade
                </Button>
                <Button variant="outline" size="sm" onClick={() => setClienteModalOpen(true)} className="h-mx-10 border-brand-primary/30 bg-white text-brand-primary">
                  <UserPlus size={15} /> Novo Cliente
                </Button>
                <Button size="sm" onClick={openCreateModal} className="h-mx-10">
                  <CalendarCheck size={15} /> Novo Agendamento
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
              <div className="border-b border-border-subtle px-mx-md py-mx-md">
                <Typography variant="h3" className="tracking-normal text-text-primary">Ações Comerciais de Hoje</Typography>
                <Typography variant="caption" tone="muted">Clientes, retornos e rotinas que precisam ser executados hoje.</Typography>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1260px] table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[82px]" />
                    <col className="w-[154px]" />
                    <col className="w-[170px]" />
                    <col className="w-[86px]" />
                    <col className="w-[100px]" />
                    <col className="w-[110px]" />
                    <col className="w-[120px]" />
                    <col className="w-[142px]" />
                    <col className="w-[160px]" />
                    <col className="w-[90px]" />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead className="bg-surface-alt/70 text-text-secondary">
                    <tr>
                      <th className="px-mx-sm py-mx-sm font-bold">Horário</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Cliente / Contato</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Veículo de Interesse</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Canal</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Origem</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Etapa do Funil</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Status da Ação</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Cadência / Tentativa</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Próxima Ação</th>
                      <th className="px-mx-sm py-mx-sm font-bold">Prioridade</th>
                      <th className="px-mx-sm py-mx-sm text-right font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading || cadenciaLoading || feedbackActionsLoading ? (
                      <tr><td colSpan={11} className="p-mx-lg"><Typography tone="muted">Carregando ações comerciais...</Typography></td></tr>
                    ) : filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-mx-xl">
                          <EmptyState
                            title="Nenhuma ação encontrada para este filtro."
                            description="Verifique retornos vencidos, crie prospecção ativa, atualize a carteira, peça indicações ou crie um novo agendamento."
                          />
                        </td>
                      </tr>
                    ) : (
                      filtrados.map(item => (
                        <AgendaRow
                          key={item.id}
                          item={item}
                          onWhatsApp={() => openWhatsApp(item)}
                          statusSaving={cadenciaSavingId === item.id || feedbackSavingId === item.id || agendamentoSavingId === item.id}
                          onAgendamentoStatus={handleAgendamentoStatus}
                          onCadenciaStatus={handleCadenciaStatus}
                          onFeedbackActionDone={handleFeedbackActionDone}
                          onReagendar={() => item.agendamento ? openEditModal(item.agendamento) : toast.info('Sugestão: reagende a próxima tentativa no próximo horário disponível.')}
                          onMore={() => toast.info('Abra a Carteira para ver o histórico completo do cliente.')}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-mx-sm">
            <RoutineTimeline slots={rotinaSlots} />

            <Card className="rounded-mx-lg border border-status-error/20 bg-status-error-surface/30 p-mx-md shadow-mx-sm">
              <div className="flex items-center justify-between gap-mx-sm">
                <Typography variant="h3" className="text-base tracking-normal text-status-error">Feedback Obrigatório</Typography>
                {feedbackObrigatorio && <Pill className="border-status-error/20 bg-white text-status-error">Pendente</Pill>}
              </div>
              {feedbackObrigatorio ? (
                <div className="mt-mx-sm space-y-mx-xs">
                  <Typography variant="p" className="text-sm font-bold text-text-primary">{feedbackObrigatorio.action_text}</Typography>
                  <Typography variant="caption" tone="muted">Progresso</Typography>
                  <div className="h-1.5 rounded-full bg-white">
                    <span className="block h-full w-1/3 rounded-full bg-status-error" />
                  </div>
                  <div className="flex justify-end gap-mx-xs pt-mx-xs">
                    <Button variant="outline" size="sm" className="bg-white">Ver ação</Button>
                    <Button variant="ghost" size="sm" className="bg-white">Justificar</Button>
                  </div>
                </div>
              ) : (
                <Typography variant="caption" tone="muted" className="mt-mx-sm block">Nenhuma ação obrigatória vinculada.</Typography>
              )}
            </Card>

            <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
              <Typography variant="h3" className="text-base tracking-normal">Pendências para Fechamento</Typography>
              <div className="mt-mx-sm space-y-mx-xs">
                {pendencias.map(item => (
                  <div key={item.label} className="flex items-center justify-between gap-mx-sm">
                    <div className="flex min-w-0 items-center gap-mx-xs">
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', item.tone === 'green' ? 'bg-status-success-surface text-status-success' : item.tone === 'orange' ? 'bg-status-warning-surface text-status-warning' : 'bg-status-error-surface text-status-error')}>{item.value}</span>
                      <Typography variant="caption" className="truncate font-bold text-text-primary">{item.label}</Typography>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-mx-sm w-full border-brand-primary/30 text-brand-primary">
                <Link to="/lancamento-diario">Ir para Fechamento Diário</Link>
              </Button>
            </Card>

            <Card className="rounded-mx-lg border border-brand-primary/10 bg-brand-primary/5 p-mx-md shadow-mx-sm">
              <div className="flex items-start gap-mx-sm">
                <Target size={18} className="mt-1 text-brand-primary" />
                <div>
                  <Typography variant="h3" className="text-base text-brand-primary">Dica do Dia</Typography>
                  <Typography variant="p" className="mt-mx-xs text-sm font-semibold text-brand-primary">Foque nas negociações mais próximas do fechamento. Vender é prioridade.</Typography>
                  {closeDayReminder.time && (
                    <Typography variant="caption" tone="muted" className="mt-mx-xs block">Lembrete Fechar o dia: {closeDayReminder.time}</Typography>
                  )}
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Modal
        open={agendaModalOpen}
        onClose={() => { setAgendaModalOpen(false); setEditingId(null); setForm(EMPTY_AGENDAMENTO) }}
        title={editingId ? 'Editar agendamento' : 'Novo agendamento'}
        description={editingId ? 'Atualize os dados do compromisso.' : 'Organize uma ação comercial com cliente, horário e prioridade.'}
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => { setAgendaModalOpen(false); setEditingId(null); setForm(EMPTY_AGENDAMENTO) }}>Cancelar</Button>
            <Button onClick={handleSubmitAgendamento} disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar agendamento'}</Button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <Select label="Cliente" value={form.cliente_id || ''} onChange={event => setForm(current => ({ ...current, cliente_id: event.target.value || null }))}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}{cliente.empresa ? ` · ${cliente.empresa}` : ''}</option>)}
          </Select>
          <FormField type="datetime-local" label="Data e hora *" value={form.data_hora} onChange={event => setForm(current => ({ ...current, data_hora: event.target.value }))} />
          <Select label="Tipo de ação" value={form.tipo} onChange={event => setForm(current => ({ ...current, tipo: event.target.value as AgendamentoInput['tipo'] }))}>
            {CRM_AGENDAMENTO_TIPO.map(tipo => <option key={tipo} value={tipo}>{TIPO_LABEL[tipo]}</option>)}
          </Select>
          <Select label="Canal" value={form.canal || ''} onChange={event => setForm(current => ({ ...current, canal: (event.target.value || null) as AgendamentoInput['canal'] }))}>
            <option value="">Selecione</option>
            {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as CrmAgendamentoStatus }))}>
            {CRM_AGENDAMENTO_STATUS.map(status => <option key={status} value={status}>{CRM_AGENDAMENTO_STATUS_LABEL[status]}</option>)}
          </Select>
          <FormField label="Próxima ação" value={form.proxima_acao || ''} onChange={event => setForm(current => ({ ...current, proxima_acao: event.target.value }))} placeholder="Ex: Apresentar proposta às 13:45" />
        </div>
      </Modal>

      <Modal
        open={clienteModalOpen}
        onClose={() => { setClienteModalOpen(false); setClienteForm(EMPTY_CLIENTE) }}
        title="Novo Cliente"
        description="Cadastro rápido para gerar a próxima ação na Central. O cadastro completo permanece na Carteira."
        footer={(
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => { setClienteModalOpen(false); setClienteForm(EMPTY_CLIENTE) }}>Cancelar</Button>
            <Button onClick={handleSubmitCliente} disabled={saving}>{saving ? 'Salvando...' : 'Salvar cliente'}</Button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <FormField label="Nome *" value={clienteForm.nome} onChange={event => setClienteForm(current => ({ ...current, nome: event.target.value }))} />
          <FormField label="Telefone" value={clienteForm.telefone} onChange={event => setClienteForm(current => ({ ...current, telefone: event.target.value }))} />
          <Select label="Canal" value={clienteForm.canal} onChange={event => setClienteForm(current => ({ ...current, canal: event.target.value as CrmCanal }))}>
            {CRM_CANAIS.filter(canal => canal !== 'porta').map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
          </Select>
          <FormField label="Veículo de Interesse" value={clienteForm.veiculo} onChange={event => setClienteForm(current => ({ ...current, veiculo: event.target.value }))} placeholder="Ex: Compass Longitude" />
          <Select label="Etapa inicial do funil" value={clienteForm.etapa} onChange={event => setClienteForm(current => ({ ...current, etapa: event.target.value as CrmClienteStatus }))}>
            {Object.entries(STATUS_CLIENTE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <FormField type="datetime-local" label="Data/horário da próxima ação *" value={clienteForm.data_hora} onChange={event => setClienteForm(current => ({ ...current, data_hora: event.target.value }))} />
          <div className="sm:col-span-2">
            <FormField label="Próxima ação" value={clienteForm.proxima_acao} onChange={event => setClienteForm(current => ({ ...current, proxima_acao: event.target.value }))} />
          </div>
        </div>
      </Modal>
    </main>
  )
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-mx-10 items-center justify-center gap-mx-xs rounded-mx-md border px-mx-sm text-sm font-bold transition-colors',
        active ? 'border-brand-primary bg-brand-primary text-white shadow-mx-sm' : 'border-border-subtle bg-white text-text-secondary hover:border-brand-primary/30 hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function FilterSelectButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-mx-10 items-center justify-center gap-mx-xs rounded-mx-md border px-mx-md text-sm font-bold transition-colors',
        active ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary' : 'border-border-subtle bg-white text-text-secondary hover:border-brand-primary/30',
      )}
    >
      {children}
      <ChevronDown size={15} />
    </button>
  )
}

export default CentralExecucao
