import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  MessageSquare,
  Plus,
  RefreshCw,
  Target,
  Users,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSellersByStore } from '@/hooks/useStores'
import { useFeedbacks } from '@/hooks/useFeedbacks'
import { usePDIs } from '@/hooks/usePDI'
import { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

type Category = 'resultado' | 'equipe' | 'desenvolvimento' | 'operacao'
type Priority = 'critical' | 'attention' | 'normal'
type RoutineTab = 'today' | 'history'
type RoutineActionRow = {
  id: string
  title: string
  description: string | null
  due_at: string
  status: string
  priority: string
  created_at: string
  completed_at: string | null
  metadata: unknown
}
type ManagerTask = {
  id: string
  title: string
  description: string
  dueAt: string
  category: Category
  priority: Priority
  origin: string
  automatic: boolean
  status: string
  rowId?: string
  relatedSellerName?: string
  consultLabel?: string
  consultPath?: string
  actionLabel?: string
  actionPath?: string
}

const CATEGORY_CONFIG = {
  resultado: { label: 'Resultado', icon: Target, iconClass: 'bg-violet-50 text-violet-600' },
  equipe: { label: 'Equipe', icon: Users, iconClass: 'bg-cyan-50 text-cyan-600' },
  desenvolvimento: { label: 'Desenvolvimento', icon: MessageSquare, iconClass: 'bg-emerald-50 text-emerald-600' },
  operacao: { label: 'Operação', icon: ClipboardCheck, iconClass: 'bg-blue-50 text-blue-600' },
} as const

const PRIORITY_CONFIG = {
  critical: { label: 'Crítica', border: 'border-red-200', color: 'text-red-600', badge: 'bg-red-50 text-red-600', dot: 'bg-red-500', rank: 0 },
  attention: { label: 'Atenção', border: 'border-amber-200', color: 'text-amber-600', badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500', rank: 1 },
  normal: { label: 'Normal', border: 'border-emerald-200', color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500', rank: 2 },
} as const

const FIELD_CLASS = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500'

export function ManagerDayRoutine() {
  const navigate = useNavigate()
  const { profile, storeId, membership } = useAuth()
  const { sellers, loading: sellersLoading } = useSellersByStore(storeId)
  const dashboard = useDashboardLojaData({ selectedStoreId: storeId, selectedStoreName: membership?.store?.name || 'Unidade MX' })
  const { devolutivas, loading: feedbackLoading } = useFeedbacks({ storeId: storeId || undefined })
  const { pdis, loading: pdiLoading } = usePDIs(storeId || undefined)
  const [rows, setRows] = useState<RoutineActionRow[]>([])
  const [actionsLoading, setActionsLoading] = useState(true)
  const [tab, setTab] = useState<RoutineTab>('today')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<'priority' | 'time' | 'origin'>('priority')
  const [showOverdue, setShowOverdue] = useState(false)
  const [historyDays, setHistoryDays] = useState(7)
  const [historyStartDate, setHistoryStartDate] = useState('')
  const [historyEndDate, setHistoryEndDate] = useState('')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [completing, setCompleting] = useState<ManagerTask | null>(null)
  const referenceDate = dashboard.referenceDate

  const fetchActions = useCallback(async () => {
    if (!profile?.id || !storeId) { setRows([]); setActionsLoading(false); return }
    setActionsLoading(true)
    const end = `${referenceDate}T23:59:59.999-03:00`
    const start = `${format(addDays(parseISO(referenceDate), -29), 'yyyy-MM-dd')}T00:00:00-03:00`
    const { data, error } = await supabase
      .from('execution_actions')
      .select('id,title,description,due_at,status,priority,created_at,completed_at,metadata')
      .eq('store_id', storeId)
      .eq('seller_id', profile.id)
      .eq('source_type', 'manual')
      .gte('due_at', start)
      .lte('due_at', end)
      .order('due_at', { ascending: true })
    if (error) { toast.error('Não foi possível carregar a rotina do gerente.'); setRows([]) }
    else setRows((data || []) as RoutineActionRow[])
    setActionsLoading(false)
  }, [profile?.id, referenceDate, storeId])

  useEffect(() => { void fetchActions() }, [fetchActions])

  const persistedAutomaticKeys = useMemo(() => new Set(rows.filter(row => isDone(row.status)).map(row => String(metadata(row).automatic_key || '')).filter(Boolean)), [rows])
  const manualTasks = useMemo(() => rows.filter(row => !metadata(row).automatic_key).map(rowToTask), [rows])
  const automaticTasks = useMemo(() => buildAutomaticTasks({ dashboard, sellers, devolutivas, pdis, referenceDate }).filter(task => !persistedAutomaticKeys.has(task.id)), [dashboard, devolutivas, pdis, persistedAutomaticKeys, referenceDate, sellers])
  const todayManual = manualTasks.filter(task => task.dueAt.slice(0, 10) === referenceDate && !isDone(task.status))
  const overdueManual = manualTasks.filter(task => task.dueAt.slice(0, 10) < referenceDate && !isDone(task.status))
  const todayTasks = [...automaticTasks, ...todayManual]
  const visibleTasks = showOverdue ? overdueManual : todayTasks
  const filteredTasks = visibleTasks.filter(task => category === 'all' || task.category === category).sort((left, right) => sortTasks(left, right, sort))
  const historyStart = format(addDays(parseISO(referenceDate), -(historyDays - 1)), 'yyyy-MM-dd')
  const effectiveHistoryStart = historyStartDate && historyEndDate ? historyStartDate : historyStart
  const effectiveHistoryEnd = historyStartDate && historyEndDate ? historyEndDate : referenceDate
  const historyTasks = rows.map(rowToTask).filter(task => {
    const dueDate = task.dueAt.slice(0, 10)
    return dueDate >= effectiveHistoryStart && dueDate <= effectiveHistoryEnd
  })
  const loading = sellersLoading || dashboard.loading || feedbackLoading || pdiLoading || actionsLoading
  const date = new Date(`${referenceDate}T12:00:00`)

  const createTask = async (form: NewTaskForm) => {
    if (!profile?.id || !storeId) return
    const related = sellers.find(seller => seller.id === form.relatedSellerId)
    const { error } = await supabase.from('execution_actions').insert({
      store_id: storeId,
      seller_id: profile.id,
      source_type: 'manual',
      title: form.title.trim(),
      description: form.notes.trim() || null,
      due_at: `${form.date}T${form.time || '12:00'}:00-03:00`,
      status: 'pendente',
      priority: dbPriority(form.priority),
      alert_tone: form.priority === 'critical' ? 'error' : form.priority === 'attention' ? 'warning' : 'info',
      created_by: profile.id,
      metadata: { manager_daily: true, category: form.category, related_seller_id: related?.id || null, related_seller_name: related?.name || null },
    })
    if (error) { toast.error(`Não foi possível criar a atividade: ${error.message}`); return }
    toast.success('Atividade criada na Rotina do Dia.')
    setNewTaskOpen(false)
    await fetchActions()
  }

  const completeTask = async (task: ManagerTask, notes: string) => {
    if (!profile?.id || !storeId) return
    if (task.rowId) {
      const { error } = await supabase.from('execution_actions').update({ status: 'concluida', completed_at: new Date().toISOString(), completed_by: profile.id, justificativa: notes.trim() || null }).eq('id', task.rowId)
      if (error) { toast.error(`Não foi possível concluir: ${error.message}`); return }
    } else {
      const { error } = await supabase.from('execution_actions').insert({
        store_id: storeId, seller_id: profile.id, source_type: 'manual', title: task.title, description: task.description,
        due_at: task.dueAt, status: 'concluida', priority: dbPriority(task.priority), alert_tone: 'info', created_by: profile.id,
        completed_at: new Date().toISOString(), completed_by: profile.id, justificativa: notes.trim() || null,
        metadata: { manager_daily: true, automatic_key: task.id, category: task.category, origin: task.origin },
      })
      if (error) { toast.error(`Não foi possível concluir: ${error.message}`); return }
    }
    toast.success('Atividade concluída.')
    setCompleting(null)
    await fetchActions()
  }

  const handleNavigate = (path: string, task: ManagerTask) => {
    sessionStorage.setItem('mx_contexto_navegacao', JSON.stringify({
      origemNavegacao: 'ROTINA_DO_DIA_GERENTE',
      tarefaId: task.id,
      data: referenceDate,
      modulo: task.origin,
      filtros: { filtro: category, ordenacao: sort },
    }))
    navigate(path)
  }

  return <main className="min-h-full bg-gray-50" id="main-content">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
      <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-xl font-bold text-gray-800">Rotina do Dia</h1><p className="mt-0.5 text-sm text-gray-500">Alertas e ações essenciais para conduzir o dia com foco em resultado.</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold text-gray-700">{capitalize(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date))}</p><p className="text-xs text-gray-500">{new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</p><p className="text-xs font-medium text-emerald-600">{membership?.store?.name || 'Unidade vinculada'}</p></div><button type="button" onClick={() => void Promise.all([fetchActions(), dashboard.handleRefresh()])} className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-50"><RefreshCw size={15} className={dashboard.isRefetching ? 'animate-spin' : ''}/>Atualizar</button></div></div></header>

      <nav className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" aria-label="Rotina do Dia" role="tablist"><TabButton active={tab === 'today'} onClick={() => setTab('today')} icon={CalendarClock} label="Hoje" count={tab === 'history' ? todayTasks.length : undefined}/><TabButton active={tab === 'history'} onClick={() => setTab('history')} label="Minha Rotina"/></nav>

      {tab === 'today' ? <>
        {!loading && overdueManual.length > 0 && !showOverdue && <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center"><span className="flex-1"><strong>{overdueManual.length}</strong> pendência{overdueManual.length === 1 ? '' : 's'} de dias anteriores exige{overdueManual.length === 1 ? '' : 'm'} atuação.</span><button type="button" onClick={() => setShowOverdue(true)} className="self-start font-semibold text-amber-700 sm:self-auto">Ver pendências</button></section>}
        {showOverdue && <button type="button" onClick={() => setShowOverdue(false)} className="self-start text-xs font-medium text-emerald-600 hover:text-emerald-700">← Ver todas as tarefas</button>}
        {!loading && <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="flex max-w-full gap-2 overflow-x-auto">{(['all','resultado','equipe','desenvolvimento','operacao'] as const).map(value => <button key={value} type="button" onClick={() => setCategory(value)} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold ${category === value ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{value === 'all' ? `Todas ${todayTasks.length}` : CATEGORY_CONFIG[value].label}</button>)}</div><label className="flex items-center gap-2 text-xs text-gray-400">Ordenar:<select value={sort} onChange={event => setSort(event.target.value as typeof sort)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600"><option value="priority">Prioridade</option><option value="time">Horário</option><option value="origin">Origem</option></select></label></div></section>}
        <section><h2 className="text-base font-bold text-gray-800">{showOverdue ? 'Pendências de dias anteriores' : 'O que você não pode deixar de fazer hoje'}</h2><p className="mt-0.5 text-xs text-gray-500">{showOverdue ? 'Tarefas vencidas que ainda exigem atuação.' : 'Somente ações urgentes e pendentes do dia.'}</p>{loading ? <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"/></div> : <div className="mt-4 space-y-3">{filteredTasks.length ? filteredTasks.map(task => <TaskCard key={task.id} task={task} onNavigate={path => handleNavigate(path, task)} onComplete={() => setCompleting(task)}/>) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center"><CheckCircle2 className="mx-auto text-emerald-400"/><p className="mt-2 text-sm font-medium text-gray-600">Nenhuma ação pendente neste filtro.</p></div>}</div>}</section>
        <button type="button" onClick={() => setNewTaskOpen(true)} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-50"><Plus size={16}/>Nova atividade</button>
      </> : <HistoryPanel rows={historyTasks} days={historyDays} startDate={historyStartDate} endDate={historyEndDate} minDate={format(addDays(parseISO(referenceDate), -29), 'yyyy-MM-dd')} maxDate={referenceDate} onDaysChange={value => { setHistoryDays(value); setHistoryStartDate(''); setHistoryEndDate('') }} onStartDateChange={setHistoryStartDate} onEndDateChange={setHistoryEndDate}/>}
    </div>
    {newTaskOpen && <NewTaskModal sellers={sellers} referenceDate={referenceDate} onClose={() => setNewTaskOpen(false)} onSave={createTask}/>}
    {completing && <CompleteTaskModal task={completing} onClose={() => setCompleting(null)} onConfirm={completeTask}/>}
  </main>
}

function buildAutomaticTasks({ dashboard, sellers, devolutivas, pdis, referenceDate }: { dashboard: ReturnType<typeof useDashboardLojaData>; sellers: ReturnType<typeof useSellersByStore>['sellers']; devolutivas: ReturnType<typeof useFeedbacks>['devolutivas']; pdis: ReturnType<typeof usePDIs>['pdis']; referenceDate: string }): ManagerTask[] {
  const tasks: ManagerTask[] = []
  const pendingClosing = sellers.filter(seller => !seller.checkin_today)
  if (pendingClosing.length) tasks.push(autoTask('closing', 'Regularizar Fechamento Diário', `Existem ${pendingClosing.length} fechamento${pendingClosing.length === 1 ? '' : 's'} pendente${pendingClosing.length === 1 ? '' : 's'} na equipe.`, '09:30', 'operacao', 'critical', 'Fechamento Diário', 'Ver fechamento', '/fechamento-diario', 'Regularizar', '/fechamento-diario?filtro=regularizacoes', referenceDate))
  const routineRisk = dashboard.metrics.ranking.filter(row => row.routine_execution === null || (row.routine_execution || 0) < 75)
  if (routineRisk.length) tasks.push(autoTask('team-routine', 'Conferir execução da rotina da equipe', `${routineRisk.length} vendedor${routineRisk.length === 1 ? '' : 'es'} precisa${routineRisk.length === 1 ? '' : 'm'} de acompanhamento na rotina comercial.`, '11:00', 'equipe', 'attention', 'Rotina da Equipe', 'Ver rotina', '/gerente/rotina-equipe', 'Cobrar', '/gerente/rotina-equipe', referenceDate))
  const missing = Math.max((dashboard.metrics.goalValue || 0) - (dashboard.metrics.totalSales || 0), 0)
  const need = missing > 0 ? Math.max(1, Math.ceil(missing / Math.max(new Date(parseISO(referenceDate).getFullYear(), parseISO(referenceDate).getMonth() + 1, 0).getDate() - parseISO(referenceDate).getDate(), 1))) : 0
  if (need > 0) tasks.push(autoTask('goal', 'Acompanhar oportunidades da meta de hoje', `Faltam ${need} venda${need === 1 ? '' : 's'} para atingir a necessidade do dia.`, '18:00', 'resultado', 'critical', 'Meta da Loja', 'Ver Meta da Loja', '/gerente/meta-loja', 'Acompanhar', '/gerente/meta-loja?acao=acompanhar', referenceDate))
  const pendingFeedbacks = devolutivas.filter(item => !item.acknowledged)
  if (pendingFeedbacks.length) tasks.push(autoTask('feedback', 'Atualizar feedback pendente', `${pendingFeedbacks.length} feedback${pendingFeedbacks.length === 1 ? '' : 's'} precisa${pendingFeedbacks.length === 1 ? '' : 'm'} de acompanhamento.`, '17:00', 'desenvolvimento', 'attention', 'Desenvolvimento', 'Abrir feedback', '/gerente/feedbacks-pdis', 'Atualizar', '/gerente/feedbacks-pdis', referenceDate))
  const duePdis = pdis.filter(item => item.status !== 'concluido' && item.due_date && item.due_date <= referenceDate)
  if (duePdis.length) tasks.push(autoTask('pdi', 'Conferir entrega do PDI', `${duePdis.length} PDI${duePdis.length === 1 ? '' : 's'} exige${duePdis.length === 1 ? '' : 'm'} acompanhamento hoje.`, '17:00', 'desenvolvimento', 'attention', 'Desenvolvimento', 'Abrir PDI', '/gerente/feedbacks-pdis?tab=pdi', 'Acompanhar', '/gerente/feedbacks-pdis?tab=pdi', referenceDate))
  return tasks
}

function autoTask(id: string, title: string, description: string, time: string, category: Category, priority: Priority, origin: string, consultLabel: string, consultPath: string, actionLabel: string, actionPath: string, date: string): ManagerTask { return { id: `auto-${id}-${date}`, title, description, dueAt: `${date}T${time}:00-03:00`, category, priority, origin, automatic: true, status: 'pendente', consultLabel, consultPath, actionLabel, actionPath } }

function TaskCard({ task, onNavigate, onComplete }: { task: ManagerTask; onNavigate: (path: string) => void; onComplete: () => void }) {
  const category = CATEGORY_CONFIG[task.category]; const priority = PRIORITY_CONFIG[task.priority]; const Icon = category.icon
  return <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${priority.border}`}><div className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className={`w-16 shrink-0 text-sm font-bold ${priority.color}`}>{task.dueAt.slice(11,16)}</div><div className={`hidden h-12 w-1 shrink-0 rounded-full md:block ${priority.dot}`}/><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${category.iconClass}`}><Icon size={17}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-gray-800">{task.title}</h3>{!task.automatic && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Manual</span>}</div><p className="mt-0.5 text-xs text-gray-500">{task.description}</p><div className="mt-1 flex items-center gap-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${category.iconClass}`}>{category.label}</span><span className="text-[10px] text-gray-400">{task.origin}</span></div></div><span className={`self-start rounded-lg px-2 py-1 text-[10px] font-semibold md:self-auto ${priority.badge}`}>{priority.label}</span><div className="flex shrink-0 gap-2">{task.consultPath && <button type="button" onClick={() => onNavigate(task.consultPath!)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">{task.consultLabel}</button>}{task.automatic ? <button type="button" onClick={() => onNavigate(task.actionPath || task.consultPath || '/rotina')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">{task.actionLabel || 'Acompanhar'}</button> : <button type="button" onClick={onComplete} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Concluir</button>}</div></div></article>
}

function TabButton({ active, onClick, label, icon: Icon, count }: { active: boolean; onClick: () => void; label: string; icon?: typeof CalendarClock; count?: number }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-medium ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{Icon && <Icon size={16}/>} {label}{count ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">{count}</span> : null}</button> }

function HistoryPanel({ rows, days, startDate, endDate, minDate, maxDate, onDaysChange, onStartDateChange, onEndDateChange }: { rows: ManagerTask[]; days: number; startDate: string; endDate: string; minDate: string; maxDate: string; onDaysChange: (days: number) => void; onStartDateChange: (value: string) => void; onEndDateChange: (value: string) => void }) { return <div className="space-y-4"><section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-2"><div className="inline-flex rounded-xl bg-gray-50 p-1">{[7,15,30].map(value => <button key={value} type="button" onClick={() => onDaysChange(value)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${days === value && !startDate ? 'bg-emerald-600 text-white' : 'text-gray-500'}`}>{value} dias</button>)}</div><div className="ml-auto flex items-center gap-1.5"><input aria-label="Data inicial" type="date" min={minDate} max={endDate || maxDate} value={startDate} onChange={event => onStartDateChange(event.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500"/><span className="text-xs text-gray-400">até</span><input aria-label="Data final" type="date" min={startDate || minDate} max={maxDate} value={endDate} onChange={event => onEndDateChange(event.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-emerald-500"/></div></div></section><section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="space-y-2">{rows.length ? rows.map(task => <div key={task.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center"><span className="text-xs font-medium text-gray-400">{new Intl.DateTimeFormat('pt-BR').format(new Date(task.dueAt))}</span><div className="flex-1"><p className="text-sm font-medium text-gray-700">{task.title}</p><p className="text-xs text-gray-400">{task.origin}</p></div><span className={`rounded-lg px-2 py-1 text-xs font-medium ${isDone(task.status) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{isDone(task.status) ? 'Concluída' : 'Pendente'}</span></div>) : <p className="py-10 text-center text-sm text-gray-400">Nenhuma atividade registrada no período.</p>}</div></section></div> }

type NewTaskForm = { title: string; date: string; time: string; category: Category; priority: Priority; relatedSellerId: string; notes: string }
function NewTaskModal({ sellers, referenceDate, onClose, onSave }: { sellers: ReturnType<typeof useSellersByStore>['sellers']; referenceDate: string; onClose: () => void; onSave: (form: NewTaskForm) => Promise<void> }) {
  const [form, setForm] = useState<NewTaskForm>({ title: '', date: referenceDate, time: '12:00', category: 'operacao', priority: 'normal', relatedSellerId: '', notes: '' })
  // eslint-disable-next-line jsx-a11y/no-autofocus -- o foco inicial replica o modal de referência e evita uma etapa extra no teclado.
  return <ModalShell title="Nova atividade" onClose={onClose}><div className="space-y-4"><Field label="Título *"><input autoFocus value={form.title} onChange={event => setForm({...form,title:event.target.value})} placeholder="Ex.: Reunião com vendedor" className={FIELD_CLASS}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Data"><input type="date" value={form.date} onChange={event => setForm({...form,date:event.target.value})} className={FIELD_CLASS}/></Field><Field label="Horário"><input type="time" value={form.time} onChange={event => setForm({...form,time:event.target.value})} className={FIELD_CLASS}/></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Categoria"><select value={form.category} onChange={event => setForm({...form,category:event.target.value as Category})} className={FIELD_CLASS}>{Object.entries(CATEGORY_CONFIG).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></Field><Field label="Prioridade"><select value={form.priority} onChange={event => setForm({...form,priority:event.target.value as Priority})} className={FIELD_CLASS}><option value="normal">Normal</option><option value="attention">Atenção</option><option value="critical">Crítica</option></select></Field></div>{sellers.length > 0 && <Field label="Vendedor relacionado (opcional)"><select value={form.relatedSellerId} onChange={event => setForm({...form,relatedSellerId:event.target.value})} className={FIELD_CLASS}><option value="">Nenhum</option>{sellers.map(seller=><option key={seller.id} value={seller.id}>{seller.name}</option>)}</select></Field>}<Field label="Observação"><textarea value={form.notes} onChange={event => setForm({...form,notes:event.target.value})} rows={3} placeholder="Detalhes da atividade..." className={`${FIELD_CLASS} resize-none`}/></Field></div><div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Cancelar</button><button type="button" disabled={!form.title.trim()} onClick={() => void onSave(form)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Criar atividade</button></div></ModalShell>
}

function CompleteTaskModal({ task, onClose, onConfirm }: { task: ManagerTask; onClose: () => void; onConfirm: (task: ManagerTask, notes: string) => Promise<void> }) { const [notes,setNotes]=useState(''); return <ModalShell title="Concluir atividade" onClose={onClose}><p className="text-sm font-medium text-gray-700">{task.title}</p><p className="mt-1 text-xs text-gray-500">Registre uma observação opcional sobre o resultado.</p><textarea value={notes} onChange={event=>setNotes(event.target.value)} rows={4} className={`${FIELD_CLASS} mt-4 resize-none`} placeholder="Resultado ou observação..."/><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Cancelar</button><button type="button" onClick={() => void onConfirm(task,notes)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Concluir</button></div></ModalShell> }

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/30 p-4" role="presentation" onMouseDown={onClose}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onMouseDown={event=>event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="font-semibold text-gray-800">{title}</h2><button type="button" onClick={onClose} aria-label="Fechar"><X size={18} className="text-gray-400"/></button></div>{children}</section></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-500">{label}<div className="mt-1">{children}</div></label> }

function rowToTask(row: RoutineActionRow): ManagerTask { const meta=metadata(row); return { id: row.id, rowId: row.id, title: row.title, description: row.description || '', dueAt: row.due_at, category: isCategory(meta.category) ? meta.category : 'operacao', priority: uiPriority(row.priority), origin: String(meta.related_seller_name || 'Atividade manual'), relatedSellerName: typeof meta.related_seller_name === 'string' ? meta.related_seller_name : undefined, automatic: Boolean(meta.automatic_key), status: row.status } }
function metadata(row: RoutineActionRow): Record<string, unknown> { return row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata as Record<string, unknown> : {} }
function uiPriority(value: string): Priority { return value === 'urgent' ? 'critical' : value === 'high' ? 'attention' : 'normal' }
function dbPriority(value: Priority) { return value === 'critical' ? 'urgent' : value === 'attention' ? 'high' : 'medium' }
function isCategory(value: unknown): value is Category { return value === 'resultado' || value === 'equipe' || value === 'desenvolvimento' || value === 'operacao' }
function isDone(status: string) { return status === 'concluida' || status === 'justificada' || status === 'cancelada' }
function sortTasks(left: ManagerTask, right: ManagerTask, sort: 'priority' | 'time' | 'origin') { if (sort === 'time') return left.dueAt.localeCompare(right.dueAt); if (sort === 'origin') return left.origin.localeCompare(right.origin, 'pt-BR'); return PRIORITY_CONFIG[left.priority].rank - PRIORITY_CONFIG[right.priority].rank || left.dueAt.localeCompare(right.dueAt) }
function capitalize(value: string) { return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value }

export default ManagerDayRoutine
