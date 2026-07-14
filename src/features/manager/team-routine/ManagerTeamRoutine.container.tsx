import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { AlertTriangle, BarChart3, CheckCircle2, RefreshCw, Search, TrendingUp, Trophy, XCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { useAuth } from '@/hooks/useAuth'
import { useSellersByStore } from '@/hooks/useStores'
import { useNotifications } from '@/hooks/useData'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { classifyRoutine } from '@/features/manager/shared/manager-metrics'
import { ManagerSectionCard } from '@/features/manager/shared/ManagerVisualPrimitives'
import { ManagerHomeReturnLink } from '@/features/manager/home/ManagerHomeReturnLink'
import { getManagerTeamSearch } from '@/features/manager/home/manager-home-parity'
import { chartTokens } from '@/lib/charts/tokens'
import { buildOfficialRoutineScores, buildOfficialRoutineTrend, buildRoutineActionMetrics, getRoutineDateFromSearch, type OfficialRoutineCanonicalSources, type OfficialRoutineScore } from './manager-team-routine'
import { ManagerRoutineChargeModal } from './ManagerRoutineChargeModal'
import { ManagerRoutineDetailModal } from './ManagerRoutineDetailModal'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ActionRow = { id: string; seller_id: string; status: string; due_at: string; title: string; updated_at: string; source_type: string; description: string | null; completed_at: string | null; justificativa: string | null; metadata: unknown }
type AppointmentRow = { id: string; seller_user_id: string }
type OfficialClosingRow = { seller_user_id: string; submission_status: string; reference_date?: string }
type CadenceStateRow = { seller_user_id: string; status: string; last_result: string | null; proxima_acao_em: string; updated_at: string }
type OfficialScheduleRow = { quantidade: number | null; dia_semana?: number; semana_mes?: number | null }
type QualificationRow = { seller_user_id: string; data_evento?: string }
type OpeningRow = { seller_user_id: string; data?: string }

export default function ManagerTeamRoutine() {
  const location = useLocation()
  const { storeId, membership } = useAuth()
  const [date, setDate] = useState(() => getRoutineDateFromSearch(location.search, new Date().toISOString().slice(0, 10)))
  const [actions, setActions] = useState<ActionRow[]>([])
  const [routineSources, setRoutineSources] = useState<Omit<OfficialRoutineCanonicalSources, 'date'> | null>(null)
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [officialScores, setOfficialScores] = useState<Record<string, OfficialRoutineScore>>({})
  const [historyRange, setHistoryRange] = useState<7 | 15 | 30>(15)
  const [networkComparison, setNetworkComparison] = useState<{ average: number | null; top: number | null }>({ average: null, top: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [chargeSellerId, setChargeSellerId] = useState<string | null>(null)
  const chartSearch = getManagerTeamSearch(location.search)
  const [search, setSearch] = useState(chartSearch)
  const { sellers, loading: sellersLoading, refetch: refetchSellers } = useSellersByStore(storeId)
  const { sendNotification } = useNotifications()
  const sellerIds = useMemo(() => sellers.map(seller => seller.id), [sellers])
  const historyStart = format(subDays(parseISO(date), historyRange - 1), 'yyyy-MM-dd')

  const fetchRoutine = useCallback(async () => {
    if (!storeId) { setActions([]); setAppointments([]); setRoutineSources(null); setLoading(false); return }
    setLoading(true); setError(null)
    const start = `${historyStart}T00:00:00-03:00`
    const end = `${date}T23:59:59-03:00`
    const selectedStart = `${date}T00:00:00-03:00`
    const noRows = Promise.resolve({ data: [], error: null })
    const [actionsResult, appointmentsResult, openingsResult, cadenceResult, schedulesResult, qualificationResult, closingsResult] = await Promise.all([
      supabase.from('execution_actions').select('id,seller_id,status,due_at,title,updated_at,source_type,description,completed_at,justificativa,metadata').eq('store_id', storeId).gte('due_at', start).lte('due_at', end),
      supabase.from('agendamentos').select('id,seller_user_id').eq('loja_id', storeId).gte('data_hora', selectedStart).lte('data_hora', end),
      sellerIds.length ? supabase.from('central_execucao_aberturas').select('seller_user_id,data').gte('data', historyStart).lte('data', date).in('seller_user_id', sellerIds) : noRows,
      sellerIds.length ? supabase.from('cadencia_estado_cliente').select('seller_user_id,status,last_result,proxima_acao_em,updated_at').eq('loja_id', storeId).in('seller_user_id', sellerIds) : noRows,
      supabase.from('prospecting_schedule').select('quantidade,dia_semana,semana_mes').eq('ativo', true),
      sellerIds.length ? supabase.from('eventos_comerciais').select('seller_user_id,data_evento').eq('loja_id', storeId).eq('tipo_evento', 'cliente_qualificado').gte('data_evento', start).lte('data_evento', end).in('seller_user_id', sellerIds) : noRows,
      sellerIds.length ? supabase.from('lancamentos_diarios').select('seller_user_id,submission_status,reference_date').eq('store_id', storeId).eq('metric_scope', 'daily').gte('reference_date', historyStart).lte('reference_date', date).in('seller_user_id', sellerIds) : noRows,
    ])
    const sourceError = [actionsResult, appointmentsResult, openingsResult, cadenceResult, schedulesResult, qualificationResult, closingsResult].find(result => result.error)
    if (sourceError?.error) {
      setError(sourceError.error.message || 'Falha ao carregar a rotina.')
      setActions([]); setRoutineSources(null); setAppointments([])
      setOfficialScores({})
    } else {
      const loadedActions = (actionsResult.data || []) as ActionRow[]
      setActions(loadedActions.filter(action => action.due_at.startsWith(date)))
      setAppointments((appointmentsResult.data || []) as AppointmentRow[])
      const sources = {
        sellerIds,
        actions: loadedActions,
        actionsAvailable: true,
        openings: (openingsResult.data || []) as OpeningRow[],
        cadenceStates: (cadenceResult.data || []) as CadenceStateRow[],
        schedules: (schedulesResult.data || []) as OfficialScheduleRow[],
        qualificationEvents: (qualificationResult.data || []) as QualificationRow[],
        closings: (closingsResult.data || []) as OfficialClosingRow[],
        sourcesAvailable: {
          openings: true,
          cadenceStates: true,
          schedules: true,
          qualificationEvents: true,
          closings: true,
        },
      } satisfies Omit<OfficialRoutineCanonicalSources, 'date'>
      setRoutineSources(sources)
      setOfficialScores(buildOfficialRoutineScores({ ...sources, date }))
    }
    const benchmarkResult = await supabase
      .from('benchmark_snapshots')
      .select('peer_avg,peer_top')
      .eq('loja_id', storeId)
      .eq('metric_code', 'routine_execution')
      .eq('peer_group', 'mercado')
      .lte('period', date)
      .order('period', { ascending: false })
      .limit(1)
      .maybeSingle()
    setNetworkComparison(benchmarkResult.error || !benchmarkResult.data
      ? { average: null, top: null }
      : {
          average: typeof benchmarkResult.data.peer_avg === 'number' ? Math.round(benchmarkResult.data.peer_avg) : null,
          top: typeof benchmarkResult.data.peer_top === 'number' ? Math.round(benchmarkResult.data.peer_top) : null,
        })
    setLoading(false)
  }, [storeId, date, historyStart, sellerIds])

  useEffect(() => { void fetchRoutine() }, [fetchRoutine])
  useEffect(() => { setSearch(chartSearch) }, [chartSearch])

  const rows = useMemo(() => sellers.map(seller => {
    const sellerActions = actions.filter(action => action.seller_id === seller.id)
    const metrics = buildRoutineActionMetrics(sellerActions)
    const officialScore = officialScores[seller.id]
    const execution = officialScore?.score ?? null
    const generatedAppointments = appointments.filter(item => item.seller_user_id === seller.id).length
    return {
      seller,
      ...metrics,
      officialScore,
      execution,
      appointments: generatedAppointments,
      status: execution !== null ? classifyRoutine(execution) : 'Sem dados',
    }
  }), [sellers, actions, appointments, officialScores])
  const executionValues = rows.map(row => row.execution).filter((value): value is number => value !== null)
  const average = executionValues.length
    ? Math.round(executionValues.reduce((sum, value) => sum + value, 0) / executionValues.length)
    : null
  const filteredRows = rows.filter(row => row.seller.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  const selectedRow = rows.find(row => row.seller.id === selectedSellerId) || null
  const selectedActions = actions.filter(action => action.seller_id === selectedSellerId)
  const trend = useMemo(() => routineSources
    ? buildOfficialRoutineTrend({ ...routineSources, start: historyStart, end: date })
    : [], [routineSources, historyStart, date])

  const remind = async (sellerId: string, message: string) => {
    const { error: notificationError } = await sendNotification({ recipient_id: sellerId, title: 'Pendências na Rotina do Dia', message, type: 'routine', priority: 'high', link: '/central-execucao' })
    if (notificationError) toast.error('Não foi possível registrar a cobrança.')
    else toast.success('Cobrança registrada e enviada.')
  }

  if (loading || sellersLoading) return <RoutineSkeleton />
  const refresh = async () => { await Promise.all([fetchRoutine(), refetchSellers()]); toast.success('Rotina da equipe atualizada.') }

  return <main className="min-h-full bg-gray-50" id="main-content"><div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 pb-24">
    <ManagerHomeReturnLink />
    <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-xl font-bold text-gray-800">Rotina da Equipe</h1><p className="mt-0.5 text-sm text-gray-500">Acompanhe a execução das atividades comerciais da equipe em tempo real.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-gray-500" htmlFor="manager-routine-date">Data<input id="manager-routine-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/></label><label className="text-xs text-gray-500">Buscar<div className="relative mt-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input aria-label="Vendedor..." value={search} onChange={event => setSearch(event.target.value)} placeholder="Vendedor..." className="h-10 w-40 rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/></div></label><Button className="h-10 rounded-xl bg-emerald-600 px-4 hover:bg-emerald-700" onClick={refresh}><RefreshCw size={15}/>Atualizar</Button></div></div></header>
    {error && <Card className="border border-status-error/30 bg-status-error-surface p-mx-md"><Typography variant="p" tone="error">Não foi possível carregar a rotina: {error}</Typography></Card>}
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Resumo da rotina"><RoutineSummaryCard label="Execução Média" value={average === null ? '—' : `${average}%`} icon={TrendingUp} tone="blue"/><RoutineSummaryCard label="Em Dia" value={rows.filter(row=>row.status==='Em dia').length} icon={CheckCircle2} tone="green"/><RoutineSummaryCard label="Em Atenção" value={rows.filter(row=>row.status==='Atenção').length} icon={AlertTriangle} tone="amber"/><RoutineSummaryCard label="Críticos" value={rows.filter(row=>row.status==='Crítico').length} icon={XCircle} tone="red"/></section>
    <ManagerSectionCard><div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-800">Rotina — {format(parseISO(date), 'dd/MM/yyyy')}</h2></div>{filteredRows.length === 0 ? <div className="px-5 py-16 text-center text-sm text-gray-500">{rows.length ? 'Nenhum vendedor corresponde à busca.' : 'Nenhum vendedor vinculado a este gerente.'}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><thead className="border-b border-gray-100 bg-gray-50"><tr>{['Vendedor','Unidade','Execução','Follow-ups','Atualização','Agendamentos','Status','Ações'].map((label, index)=><th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${index === 7 ? 'text-right' : ''}`}>{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{filteredRows.map(row=><tr key={row.seller.id} className="transition-colors hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{row.seller.name}</td><td className="max-w-32 px-4 py-3 text-gray-500">{membership?.store?.name || 'Unidade vinculada'}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">{row.execution !== null && <div className={`h-full rounded-full ${row.execution >= 75 ? 'bg-emerald-500' : row.execution >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width:`${row.execution}%`}}/>}</div><span className="text-xs font-medium text-gray-700">{row.execution === null ? '—' : `${row.execution}%`}</span></div></td><td className="px-4 py-3 text-gray-700">{row.followUpsCompleted}/{row.followUpsPlanned}</td><td className="px-4 py-3 text-gray-700">{row.updatesCompleted}/{row.updatesRequired}</td><td className={`px-4 py-3 font-semibold ${row.appointments===0?'text-red-600':row.appointments===1?'text-orange-500':'text-emerald-600'}`}>{row.appointments}</td><td className="px-4 py-3"><Badge variant={row.status==='Em dia'?'success':row.status==='Atenção'?'warning':row.status==='Sem dados'?'outline':'danger'}>{row.status}</Badge></td><td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5 whitespace-nowrap"><button type="button" onClick={()=>setSelectedSellerId(row.seller.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700">Ver rotina</button><button type="button" onClick={()=>setChargeSellerId(row.seller.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">Cobrar</button></div></td></tr>)}</tbody></table></div>}</ManagerSectionCard>
    <RoutineTrendCard trend={trend} range={historyRange} onRange={setHistoryRange}/>
    <RoutineComparisonCard team={average} network={networkComparison.average} top={networkComparison.top}/>
    {selectedRow && (
      <ManagerRoutineDetailModal
        open
        onClose={() => setSelectedSellerId(null)}
        sellerName={selectedRow.seller.name}
        date={date}
        actions={selectedActions}
        appointments={selectedRow.appointments}
        execution={selectedRow.execution}
        officialScore={selectedRow.officialScore}
      />
    )}
    {chargeSellerId && (
      <ManagerRoutineChargeModal
        open
        sellerName={rows.find(row => row.seller.id === chargeSellerId)?.seller.name || 'Vendedor'}
        date={format(parseISO(date), 'dd/MM/yyyy')}
        onClose={() => setChargeSellerId(null)}
        onSave={(message) => remind(chargeSellerId, message)}
      />
    )}
  </div></main>
}

function RoutineTrendCard({
  trend,
  range,
  onRange,
}: {
  trend: Array<{ date: string; label: string; value: number | null }>;
  range: 7 | 15 | 30;
  onRange: (range: 7 | 15 | 30) => void;
}) {
  const hasData = trend.some(point => point.value !== null)
  return <Card className="border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2"><TrendingUp size={18} className="mt-0.5 text-emerald-600"/><div><Typography variant="h3">Evolução da Execução Média</Typography><Typography variant="tiny" tone="muted" className="mt-1 block">Acompanhe a evolução da disciplina da equipe ao longo do tempo.</Typography></div></div>
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">{([7, 15, 30] as const).map(option => <button key={option} type="button" onClick={() => onRange(option)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${range === option ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>{option} dias</button>)}</div>
    </div>
    {!hasData ? <div className="flex flex-col items-center justify-center py-10 text-center"><TrendingUp className="mb-2 h-10 w-10 text-gray-300"/><p className="text-sm font-medium text-gray-500">Dados insuficientes para exibir a evolução da execução média.</p></div> : <div className="mt-4 h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid()} vertical={false}/><XAxis dataKey="label" tick={{ fontSize: 10, fill: chartTokens.axisTick() }} axisLine={{ stroke: chartTokens.grid() }} tickLine={false}/><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartTokens.axisTick() }} axisLine={false} tickLine={false} tickFormatter={value => `${value}%`}/><Tooltip formatter={value => [typeof value === 'number' ? `${value}%` : 'Sem dados', 'Execução Média']}/><Line type="monotone" dataKey="value" stroke={chartTokens.success()} strokeWidth={2.5} connectNulls dot={{ r: 4, fill: chartTokens.success(), strokeWidth: 0 }} label={{ position: 'top', formatter: value => typeof value === 'number' ? `${value}%` : '', fill: chartTokens.success(), fontSize: 10 }}/></LineChart></ResponsiveContainer></div>}
    {hasData && trend.filter(point => point.value !== null).length === 1 && <p className="mt-2 text-center text-xs italic text-gray-500">Evolução disponível após novos registros de rotina.</p>}
  </Card>
}

function RoutineComparisonCard({ team, network, top }: { team: number | null; network: number | null; top: number | null }) {
  return <Card className="border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
    <div className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600"/><Typography variant="h3">Comparativo de Execução Média</Typography></div>
    <Typography variant="tiny" tone="muted" className="mt-1 block">Comparação com equipes da rede da consultoria</Typography>
    <div className="mt-4 space-y-4"><RoutineComparisonBar label="Sua Equipe" value={team} color="bg-emerald-500"/><RoutineComparisonBar label="Média da Rede" value={network} color="bg-slate-400"/><RoutineComparisonBar label="Top 25% da Rede" value={top} color="bg-emerald-700" icon={Trophy}/></div>
  </Card>
}

function RoutineComparisonBar({ label, value, color, icon: Icon }: { label: string; value: number | null; color: string; icon?: typeof Trophy }) {
  return <div className="flex items-center gap-3"><div className="flex w-40 shrink-0 items-center gap-2 text-sm text-gray-600">{Icon && <Icon size={14}/>} {label}</div><div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">{value !== null && <div className={`flex h-full items-center justify-end rounded-full pr-2 text-xs font-bold text-white ${color}`} style={{ width: `${Math.min(value, 100)}%` }}>{value}%</div>}{value === null && <span className="absolute inset-y-0 right-2 grid place-items-center text-xs font-bold text-gray-400">—</span>}</div></div>
}

function RoutineSkeleton(){return <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true"><Skeleton className="h-mx-20"/><div className="grid grid-cols-4 gap-mx-md">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-mx-32"/>)}</div><Skeleton className="h-[420px]"/></main>}
function RoutineSummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof TrendingUp; tone: 'blue' | 'green' | 'amber' | 'red' }) { const styles = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' }; return <article className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles[tone]}`}><Icon size={20}/></span><div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-xs text-gray-500">{label}</p></div></article> }
