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
  Edit3,
  Info,
  Menu,
  MessageCircle,
  Plus,
  SquareUserRound,
  Store,
  Target,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { useAuth } from '@/hooks/useAuth'
import { calculateReferenceDate, useCheckinsToday } from '@/hooks/checkins'
import { cn } from '@/lib/utils'
import { useAgendamentos, type AgendamentoInput, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import { resolveCloseDayReminderSchedule } from '@/lib/daily-routine'
import {
  CRM_CANAIS,
  CRM_CANAL_LABEL,
  CRM_AGENDAMENTO_TIPO,
  CRM_AGENDAMENTO_STATUS,
  CRM_AGENDAMENTO_STATUS_LABEL,
  toDateOnlyBR,
  type CrmAgendamentoStatus,
  type CrmCanal,
} from '@/lib/schemas/crm.schema'

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
}

type FiltroData = 'todos' | 'hoje' | 'atrasados' | 'proximos7'
type CanalFiltro = 'todos' | CrmCanal

const EMPTY: AgendamentoInput = {
  cliente_id: '',
  data_hora: '',
  canal: null,
  tipo: 'visita',
  status: 'aguardando',
  proxima_acao: '',
}

const isSameDay = (d: Date, ref: Date) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
const onlyDigits = (s: string | null | undefined) => (s || '').replace(/\D/g, '')
const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

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
  const match = action.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  return match?.[0] || null
}

const canalTone: Record<string, string> = {
  carteira: 'bg-status-success-surface text-status-success border-status-success/20',
  internet: 'bg-status-info-surface text-status-info border-status-info/20',
  showroom: 'bg-status-warning-surface text-status-warning border-status-warning/20',
  porta: 'bg-surface-alt text-text-secondary border-border-subtle',
}

const statusTone: Record<string, string> = {
  confirmado: 'bg-status-success-surface text-status-success border-status-success/20',
  aguardando: 'bg-status-info-surface text-status-info border-status-info/20',
  compareceu: 'bg-status-success-surface text-status-success border-status-success/20',
  nao_compareceu: 'bg-status-error-surface text-status-error border-status-error/20',
}

const routineSlots = [
  { time: '08:00', title: 'Motivação', desc: 'Energia para atingir seus objetivos.' },
  { time: '08:15', title: 'Organização do Dia', desc: 'Defina prioridades e responda clientes quentes.' },
  { time: '08:55', title: 'Contato com Novos Leads', desc: 'Boas-vindas e qualificação de novos contatos.' },
  { time: '11:00', title: 'Prospecção de Novos Clientes', desc: 'Aumente sua carteira de clientes.' },
  { time: '13:00', title: 'Atendimento', desc: 'Atenda, retorne leads e confirme agendamentos.' },
  { time: '16:00', title: 'Lista Quente', desc: 'Trabalhe objeções e negociações paradas.' },
  { time: '17:00', title: 'Fechamento do Dia', desc: 'Atualize seu funil e prepare o dia seguinte.' },
]

function getRoutineState(time: string) {
  const now = new Date()
  const [h, m] = time.split(':').map(Number)
  const slotDate = new Date()
  slotDate.setHours(h || 0, m || 0, 0, 0)
  const diff = slotDate.getTime() - now.getTime()
  if (diff < -45 * 60 * 1000) return 'done'
  if (diff <= 45 * 60 * 1000) return 'current'
  return 'pending'
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
  tone: 'blue' | 'green' | 'red' | 'orange'
}) {
  const toneClass = {
    blue: 'bg-brand-primary/10 text-brand-primary',
    green: 'bg-status-success-surface text-status-success',
    red: 'bg-status-error-surface text-status-error',
    orange: 'bg-status-warning-surface text-status-warning',
  }[tone]

  return (
    <Card className="h-[124px] rounded-mx-lg border border-border-subtle bg-white p-mx-sm shadow-mx-sm">
      <div className="flex h-full items-center gap-mx-sm">
        <span className={cn('flex h-mx-xl w-mx-xl shrink-0 items-center justify-center rounded-mx-lg', toneClass)}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="tiny" className="text-[10px] font-black uppercase leading-tight tracking-normal text-text-primary">{label}</Typography>
          <Typography variant="h2" className="mt-1 text-2xl leading-none">{value}</Typography>
          <Typography variant="caption" tone="muted" className="mt-mx-xs block leading-tight tracking-normal">{hint}</Typography>
        </div>
      </div>
    </Card>
  )
}

type ScoreItem = { label: string; value: string; done: boolean; muted?: string }

function ScoreCard({ score, items }: { score: number; items: ScoreItem[] }) {
  const mood = score >= 70 ? 'Ótimo!' : score >= 40 ? 'Bom!' : 'Vamos lá!'
  return (
    <Card className="h-[124px] rounded-mx-lg border border-brand-primary/10 bg-brand-primary/5 p-mx-sm shadow-mx-sm">
      <div className="grid h-full grid-cols-[76px_1fr] items-center gap-mx-sm">
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${score * 3.6}deg, var(--color-border-strong) 0deg)` }}>
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <Typography variant="h2" className="text-lg leading-none text-brand-primary">{score}%</Typography>
            <Typography variant="tiny" className="text-[8px] font-black leading-none tracking-normal text-brand-primary">{mood}</Typography>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-mx-tiny">
            <Typography variant="tiny" className="font-black uppercase leading-tight tracking-normal text-text-primary">Score da rotina</Typography>
            <Info size={12} className="text-text-tertiary" />
          </div>
          <div className="mt-1 space-y-0.5">
            {items.map((item) => <ScoreLine key={item.label} {...item} />)}
          </div>
        </div>
      </div>
    </Card>
  )
}

function ScoreLine({ label, value, done, muted }: ScoreItem) {
  return (
    <div className="grid grid-cols-[14px_1fr_auto] items-start gap-1 text-[9px]">
      <span className={cn('mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white', done ? 'bg-status-success' : 'bg-border-strong')}>
        {done ? <Check size={10} /> : <Clock size={10} />}
      </span>
      <span className="font-bold leading-tight text-text-secondary">{label}{muted && <span className="block text-text-tertiary">{muted}</span>}</span>
      <span className={cn('font-black', done ? 'text-brand-primary' : 'text-text-tertiary')}>{value}</span>
    </div>
  )
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-mx-11 items-center justify-center gap-mx-xs rounded-mx-md border px-mx-sm text-sm font-black transition-colors',
        active ? 'border-brand-primary bg-brand-primary text-white shadow-mx-sm' : 'border-border-subtle bg-white text-text-secondary hover:border-brand-primary/30 hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={cn('inline-flex rounded-mx-sm border px-2 py-1 text-xs font-black', className)}>{children}</span>
}

function RoutineTimeline() {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <Typography variant="h3" className="text-base uppercase tracking-normal">Rotina do dia</Typography>
      <Typography variant="caption" tone="muted" className="tracking-normal">Siga sua rotina e ganhe disciplina.</Typography>
      <ol className="mt-mx-sm space-y-mx-xs">
        {routineSlots.map((slot, index) => {
          const state = getRoutineState(slot.time)
          const isLast = index === routineSlots.length - 1
          return (
            <li key={slot.time} className="relative grid grid-cols-[32px_48px_1fr] gap-mx-sm">
              {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%+8px)] w-px bg-border-subtle" />}
              <span
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white',
                  state === 'done' && 'border-status-success bg-status-success text-white',
                  state === 'current' && 'border-status-warning text-status-warning',
                  state === 'pending' && 'border-border-strong text-border-strong',
                )}
              >
                {state === 'done' ? <Check size={16} /> : state === 'current' ? <Clock size={15} /> : null}
              </span>
              <Typography variant="caption" className="pt-1 font-black tracking-normal text-text-primary">{slot.time}</Typography>
              <div className="min-w-0">
                <Typography variant="p" className="text-xs font-black leading-tight text-text-primary">{slot.title}</Typography>
                <Typography variant="caption" tone="muted" className="normal-case leading-snug tracking-normal">{slot.desc}</Typography>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function AgendaRow({ item, onWhatsApp, onEdit, onDelete }: { item: AgendamentoComCliente; onWhatsApp: () => void; onEdit: () => void; onDelete: () => void }) {
  const actionTime = getActionTime(item.proxima_acao)
  const urgent = item.status === 'nao_compareceu' || (item.proxima_acao || '').toLowerCase().includes('urgente')
  const vehicle = item.oportunidade?.veiculo_interesse || TIPO_LABEL[item.tipo] || 'Oportunidade'
  const value = item.oportunidade?.valor_negociado ? BRL(item.oportunidade.valor_negociado) : item.tipo === 'negociacao' ? 'Proposta em aberto' : 'Valor a definir'

  return (
    <tr className="border-t border-border-subtle align-middle hover:bg-surface-alt/60">
      <td className="whitespace-nowrap px-mx-sm py-mx-md">
        <div className="flex items-center gap-mx-sm">
          <Typography variant="p" className={cn('w-12 font-black text-brand-primary', urgent && 'text-status-error')}>{fmtHora(item.data_hora)}</Typography>
          <Bell size={16} className={cn('text-text-tertiary', urgent && 'text-status-error')} />
        </div>
      </td>
      <td className="min-w-[170px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-black leading-tight">{item.cliente?.nome || 'Cliente sem vínculo'}</Typography>
        <Typography variant="caption" tone="muted">{item.cliente?.telefone || 'Telefone não cadastrado'}</Typography>
      </td>
      <td className="min-w-[180px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-black leading-tight">{vehicle}</Typography>
        <Typography variant="caption" tone="muted">{value}</Typography>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={canalTone[item.canal || 'porta'] || canalTone.porta}>{item.canal ? CRM_CANAL_LABEL[item.canal] : 'Sem canal'}</Pill>
      </td>
      <td className="px-mx-sm py-mx-md">
        <Pill className={statusTone[item.status] || statusTone.aguardando}>{CRM_AGENDAMENTO_STATUS_LABEL[item.status]}</Pill>
      </td>
      <td className="min-w-[170px] px-mx-sm py-mx-md">
        <Typography variant="p" className="font-black leading-tight">{item.proxima_acao || 'Definir próxima ação'}</Typography>
        {actionTime && <Typography variant="caption" tone={urgent ? 'error' : 'muted'} className="font-black">{actionTime}</Typography>}
        {urgent && !actionTime && <Typography variant="caption" tone="error" className="font-black">Urgente</Typography>}
      </td>
      <td className="min-w-[132px] px-mx-sm py-mx-md">
        <div className="flex items-center justify-end gap-mx-xs">
          <Button variant="outline" size="icon" aria-label="WhatsApp" onClick={onWhatsApp} className="h-mx-9 w-mx-9 border-status-success/30 text-status-success hover:bg-status-success-surface"><MessageCircle size={15} /></Button>
          <Button variant="outline" size="icon" aria-label="Editar agendamento" onClick={onEdit} className="h-mx-9 w-mx-9 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"><Edit3 size={15} /></Button>
          <Button variant="ghost" size="icon" aria-label="Excluir agendamento" onClick={onDelete} className="h-mx-9 w-mx-9 text-status-error hover:bg-status-error-surface"><Trash2 size={15} /></Button>
        </div>
      </td>
    </tr>
  )
}

export function CentralExecucao() {
  const { profile, activeStoreId, storeId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || null
  const { agendamentos, metrics, loading, error, createAgendamento, updateAgendamento, deleteAgendamento } = useAgendamentos()
  const { clientes } = useClientes()
  const { perfil } = useVendedorPerfil()
  const referenceDate = calculateReferenceDate()
  const { todayCheckin, fetchTodayCheckin } = useCheckinsToday(profile, effectiveStoreId, referenceDate)
  useEffect(() => { fetchTodayCheckin() }, [fetchTodayCheckin])
  const [filtro, setFiltro] = useState<FiltroData>('todos')
  const [canalFiltro, setCanalFiltro] = useState<CanalFiltro>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<AgendamentoInput>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const hoje = useMemo(() => new Date(), [])
  const closeDayReminder = resolveCloseDayReminderSchedule({
    enabled: perfil.fechar_dia_notificacao_ativa,
    reminderTime: perfil.fechar_dia_notificacao_hora,
    workEndTime: perfil.hora_saida,
    workDays: perfil.dias_trabalho,
  })

  const filtrados = useMemo(() => {
    const em7 = new Date()
    em7.setDate(em7.getDate() + 7)
    return agendamentos.filter(a => {
      const d = new Date(a.data_hora)
      const matchData =
        filtro === 'todos' ? true
          : filtro === 'hoje' ? isSameDay(d, hoje)
            : filtro === 'atrasados' ? d < hoje && !isSameDay(d, hoje) && (a.status === 'aguardando' || a.status === 'confirmado')
              : d >= hoje && d <= em7
      const matchCanal = canalFiltro === 'todos' || a.canal === canalFiltro
      return matchData && matchCanal
    })
  }, [agendamentos, canalFiltro, filtro, hoje])

  // Score da Rotina (spec): abriu Central=10%, Fechamento Diário=20%,
  // clientes cadastrados hoje: 1=40% / 2=60% / 3+=70%.
  const { score, scoreItems } = useMemo(() => {
    const hojeStr = toDateOnlyBR()
    const clientesHoje = clientes.filter(c => c.created_at && toDateOnlyBR(new Date(c.created_at)) === hojeStr).length
    const fezFechamento = Boolean(todayCheckin)
    const clientePontos = clientesHoje >= 3 ? 70 : clientesHoje === 2 ? 60 : clientesHoje === 1 ? 40 : 0
    const total = Math.min(10 + (fezFechamento ? 20 : 0) + clientePontos, 100)
    const items: ScoreItem[] = [
      { label: 'Abriu a Central de Execução', value: '10%', done: true },
      { label: 'Fez Fechamento Diário', value: '20%', done: fezFechamento },
      {
        label: 'Inseriu Novos Clientes',
        value: `${clientePontos > 0 ? clientePontos : 40}%`,
        done: clientesHoje > 0,
        muted: clientesHoje > 0
          ? `(${clientesHoje} novo${clientesHoje > 1 ? 's' : ''} cliente${clientesHoje > 1 ? 's' : ''})`
          : '(até 70% com 3 clientes)',
      },
    ]
    return { score: total, scoreItems: items }
  }, [clientes, todayCheckin])

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY)
    setModalOpen(true)
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
    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.data_hora) {
      toast.error('Informe data e hora.')
      return
    }
    setSaving(true)
    const { error: saveError } = editingId
      ? await updateAgendamento(editingId, form)
      : await createAgendamento(form)
    setSaving(false)
    if (saveError) {
      toast.error(saveError)
      return
    }
    toast.success(editingId ? 'Agendamento atualizado.' : 'Agendamento criado.')
    setForm(EMPTY)
    setEditingId(null)
    setModalOpen(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o agendamento de "${nome}"?`)) return
    const { error: deleteError } = await deleteAgendamento(id)
    if (deleteError) {
      toast.error(deleteError)
      return
    }
    toast.success('Agendamento excluído.')
  }

  function openWhatsApp(a: AgendamentoComCliente) {
    const tel = onlyDigits(a.cliente?.telefone)
    if (!tel) {
      toast.error('Cliente sem telefone cadastrado.')
      return
    }
    const num = tel.length <= 11 ? `55${tel}` : tel
    window.open(`https://wa.me/${num}`, '_blank', 'noopener')
  }

  return (
    <main className="min-h-full w-full bg-white p-mx-sm md:p-mx-lg">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-mx-md pb-20">
        <header className="flex flex-col gap-mx-md border-b border-border-subtle bg-white pb-mx-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-mx-sm">
            <span className="hidden text-text-primary md:block"><Menu size={24} /></span>
            <div className="min-w-0">
              <Typography variant="h1" className="text-2xl leading-tight">Central de Execução</Typography>
              <Typography variant="caption" tone="muted">Sua rotina diária. Organize seu dia e foque no que gera resultado.</Typography>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-mx-sm">
            <div className="inline-flex h-mx-11 items-center gap-mx-xs rounded-mx-md bg-white px-mx-sm text-sm font-black text-text-primary shadow-mx-sm">
              <Calendar size={16} className="text-text-secondary" />
              {getDateLabel(hoje)}
            </div>
            <Button variant="outline" onClick={() => toast.info('Agenda sincronizada com a rotina local.')}>
              <CalendarCheck size={16} /> Sincronizar Agenda
            </Button>
            <div className="hidden items-center gap-mx-sm rounded-mx-md bg-white px-mx-sm py-mx-xs shadow-mx-sm xl:flex">
              <span className="relative">
                <Bell size={20} className="text-text-secondary" />
                <span className="absolute -right-1 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-status-error text-[10px] font-black text-white">3</span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 text-sm font-black text-brand-primary">
                {(profile?.name || 'V').slice(0, 1)}
              </span>
              <span>
                <Typography variant="caption" className="block font-black text-text-primary">{profile?.name || 'Vendedor'}</Typography>
                <Typography variant="tiny" tone="muted">Vendedor</Typography>
              </span>
              <ChevronDown size={16} className="text-text-tertiary" />
            </div>
          </div>
        </header>

        {error && <Typography className="text-status-error">{error}</Typography>}

        <section className="grid grid-cols-2 gap-mx-sm md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(140px,1fr))_minmax(270px,1.4fr)]" aria-label="Indicadores do dia">
          <MetricCard icon={<CalendarCheck size={24} />} label="Agendamentos hoje" value={String(metrics.agendamentosHoje)} hint="100% do dia" tone="blue" />
          <MetricCard icon={<CheckCircle2 size={24} />} label="Compareceram" value={String(metrics.compareceram)} hint={`${metrics.taxaComparecimento}% do dia`} tone="green" />
          <MetricCard icon={<XCircle size={24} />} label="Não compareceram" value={String(metrics.naoCompareceram)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.naoCompareceram / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="red" />
          <MetricCard icon={<AlarmClock size={24} />} label="Em negociação" value={String(metrics.emNegociacao)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.emNegociacao / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="orange" />
          <MetricCard icon={<CircleDollarSign size={24} />} label="Vendas realizadas" value={String(metrics.vendasRealizadas)} hint={`${metrics.agendamentosHoje ? Math.round((metrics.vendasRealizadas / metrics.agendamentosHoje) * 100) : 0}% do dia`} tone="green" />
          <div className="col-span-2 md:col-span-1 xl:col-span-1">
            <ScoreCard score={score} items={scoreItems} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0">
            <div className="mb-mx-sm flex flex-wrap items-center gap-mx-xs">
              <FilterButton active={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</FilterButton>
              <FilterButton active={filtro === 'hoje'} onClick={() => setFiltro('hoje')}><Calendar size={15} /> Hoje</FilterButton>
              <FilterButton active={filtro === 'atrasados'} onClick={() => setFiltro('atrasados')}><AlarmClock size={15} /> Atrasados</FilterButton>
              <FilterButton active={filtro === 'proximos7'} onClick={() => setFiltro('proximos7')}><CalendarCheck size={15} /> Próximos 7 dias</FilterButton>
              <button
                type="button"
                onClick={() => setCanalFiltro('todos')}
                className={cn(
                  'inline-flex h-mx-11 items-center gap-mx-xs rounded-mx-md border px-mx-sm text-sm font-black transition-colors',
                  canalFiltro === 'todos' ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary' : 'border-border-subtle bg-white text-text-secondary hover:border-brand-primary/30',
                )}
              >
                Todos os Canais <ChevronDown size={15} />
              </button>
              {CRM_CANAIS.filter(c => c !== 'porta').map((canal) => (
                <FilterButton key={canal} active={canalFiltro === canal} onClick={() => setCanalFiltro(canalFiltro === canal ? 'todos' : canal)}>
                  {canal === 'carteira' ? <SquareUserRound size={15} /> : canal === 'internet' ? <CalendarCheck size={15} /> : <Store size={15} />}
                  {CRM_CANAL_LABEL[canal]}
                </FilterButton>
              ))}
              <Link to="/carteira-clientes" className="inline-flex h-mx-11 items-center justify-center gap-mx-xs rounded-mx-md border border-brand-primary/30 bg-white px-mx-md text-sm font-black text-brand-primary transition-colors hover:bg-brand-primary/10">
                <Plus size={16} /> Novo Cliente
              </Link>
              <Button variant="outline" size="sm" onClick={openCreateModal} className="ml-auto h-mx-11 bg-white">
                <CalendarCheck size={15} /> Novo agendamento
              </Button>
            </div>

            <Card className="overflow-hidden rounded-mx-lg border border-border-subtle bg-white p-0 shadow-mx-sm">
              <div className="border-b border-border-subtle px-mx-md py-mx-md">
                <Typography variant="h3" className="uppercase tracking-tight">Agenda do dia - {getDateLabel(hoje)}</Typography>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[90px]" />
                    <col className="w-[160px]" />
                    <col className="w-[160px]" />
                    <col className="w-[90px]" />
                    <col className="w-[120px]" />
                    <col className="w-[150px]" />
                    <col className="w-[110px]" />
                  </colgroup>
                  <thead className="bg-surface-alt/70 text-text-secondary">
                    <tr>
                      <th className="px-mx-sm py-mx-sm font-black">Horário</th>
                      <th className="px-mx-sm py-mx-sm font-black">Cliente / Contato</th>
                      <th className="px-mx-sm py-mx-sm font-black">Veículo de Interesse</th>
                      <th className="px-mx-sm py-mx-sm font-black">Canal</th>
                      <th className="px-mx-sm py-mx-sm font-black">Status</th>
                      <th className="px-mx-sm py-mx-sm font-black">Próxima Ação</th>
                      <th className="px-mx-sm py-mx-sm text-right font-black">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="p-mx-lg"><Typography tone="muted">Carregando agenda...</Typography></td></tr>
                    ) : filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-mx-xl">
                          <EmptyState title="Nada na agenda" description="Crie agendamentos para transformar esta central em uma rotina executável." />
                        </td>
                      </tr>
                    ) : (
                      filtrados.map((item) => (
                        <AgendaRow
                          key={item.id}
                          item={item}
                          onWhatsApp={() => openWhatsApp(item)}
                          onEdit={() => openEditModal(item)}
                          onDelete={() => handleDelete(item.id, item.cliente?.nome || 'cliente')}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <aside className="flex flex-col gap-mx-md">
            <RoutineTimeline />
            <Card className="rounded-mx-lg border border-brand-primary/10 bg-brand-primary/5 p-mx-lg shadow-mx-sm">
              <div className="flex items-start gap-mx-sm">
                <Target size={18} className="mt-1 text-brand-primary" />
                <div>
                  <Typography variant="h3" className="uppercase text-brand-primary">Dica do dia</Typography>
                  <Typography variant="p" className="mt-mx-xs text-sm font-semibold text-brand-primary">
                    Foque nas negociações mais próximas do fechamento. Vender é prioridade!
                  </Typography>
                  {closeDayReminder.time && (
                    <Typography variant="caption" tone="muted" className="mt-mx-xs block">
                      Lembrete Fechar o dia: {closeDayReminder.time}
                    </Typography>
                  )}
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingId(null)
          setForm(EMPTY)
        }}
        title={editingId ? 'Editar agendamento' : 'Novo agendamento'}
        description={editingId ? 'Atualize os dados do compromisso.' : 'Organize um compromisso com um cliente.'}
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button
              variant="ghost"
              onClick={() => {
                setModalOpen(false)
                setEditingId(null)
                setForm(EMPTY)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar agendamento'}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
          <Select label="Cliente" value={form.cliente_id || ''} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value || null }))}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` · ${c.empresa}` : ''}</option>)}
          </Select>
          <FormField type="datetime-local" label="Data e hora *" value={form.data_hora} onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))} />
          <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as AgendamentoInput['tipo'] }))}>
            {CRM_AGENDAMENTO_TIPO.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          </Select>
          <Select label="Canal" value={form.canal || ''} onChange={e => setForm(f => ({ ...f, canal: (e.target.value || null) as AgendamentoInput['canal'] }))}>
            <option value="">Selecione</option>
            {CRM_CANAIS.map(c => <option key={c} value={c}>{CRM_CANAL_LABEL[c]}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CrmAgendamentoStatus }))}>
            {CRM_AGENDAMENTO_STATUS.map(s => <option key={s} value={s}>{CRM_AGENDAMENTO_STATUS_LABEL[s]}</option>)}
          </Select>
          <FormField label="Próxima ação" value={form.proxima_acao || ''} onChange={e => setForm(f => ({ ...f, proxima_acao: e.target.value }))} placeholder="Ex: Ligar 30 min antes" />
        </div>
      </Modal>
    </main>
  )
}

export default CentralExecucao
