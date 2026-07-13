import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle2, Eye, Megaphone, RefreshCw, Search, TrendingUp, XCircle } from 'lucide-react'
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
import { Modal } from '@/components/organisms/Modal'
import { classifyRoutine, percent } from '@/features/manager/shared/manager-metrics'
import { ManagerSectionCard } from '@/features/manager/shared/ManagerVisualPrimitives'

type ActionRow = { id: string; seller_id: string; status: string; due_at: string; title: string; updated_at: string }
type AppointmentRow = { id: string; seller_user_id: string }

export default function ManagerTeamRoutine() {
  const { storeId, membership } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [actions, setActions] = useState<ActionRow[]>([])
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { sellers, loading: sellersLoading, refetch: refetchSellers } = useSellersByStore(storeId)
  const { sendNotification } = useNotifications()

  const fetchRoutine = useCallback(async () => {
    if (!storeId) { setActions([]); setAppointments([]); setLoading(false); return }
    setLoading(true); setError(null)
    const start = `${date}T00:00:00-03:00`
    const end = `${date}T23:59:59-03:00`
    const [actionsResult, appointmentsResult] = await Promise.all([
      supabase.from('execution_actions').select('id,seller_id,status,due_at,title,updated_at').eq('store_id', storeId).gte('due_at', start).lte('due_at', end),
      supabase.from('agendamentos').select('id,seller_user_id').eq('loja_id', storeId).gte('data_hora', start).lte('data_hora', end),
    ])
    if (actionsResult.error || appointmentsResult.error) {
      setError(actionsResult.error?.message || appointmentsResult.error?.message || 'Falha ao carregar a rotina.')
      setActions([]); setAppointments([])
    } else {
      setActions((actionsResult.data || []) as ActionRow[])
      setAppointments((appointmentsResult.data || []) as AppointmentRow[])
    }
    setLoading(false)
  }, [storeId, date])

  useEffect(() => { void fetchRoutine() }, [fetchRoutine])

  const rows = useMemo(() => sellers.map(seller => {
    const sellerActions = actions.filter(action => action.seller_id === seller.id)
    const completed = sellerActions.filter(action => action.status === 'concluida' || action.status === 'justificada').length
    const execution = percent(completed, sellerActions.length)
    const generatedAppointments = appointments.filter(item => item.seller_user_id === seller.id).length
    return { seller, planned: sellerActions.length, completed, updated: completed, execution, appointments: generatedAppointments, status: classifyRoutine(execution) }
  }), [sellers, actions, appointments])
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.execution, 0) / rows.length) : 0
  const filteredRows = rows.filter(row => row.seller.name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  const selectedRow = rows.find(row => row.seller.id === selectedSellerId) || null
  const selectedActions = actions.filter(action => action.seller_id === selectedSellerId)

  const remind = async (sellerId: string) => {
    const { error: notificationError } = await sendNotification({ recipient_id: sellerId, title: 'Pendências na Rotina do Dia', message: 'Você possui pendências na Rotina do Dia. Conclua as ações planejadas e atualize o Plano de Ataque.', type: 'routine', priority: 'high', link: '/central-execucao' })
    if (notificationError) toast.error('Não foi possível registrar a cobrança.')
    else toast.success('Cobrança registrada e enviada.')
  }

  if (loading || sellersLoading) return <RoutineSkeleton />
  const refresh = async () => { await Promise.all([fetchRoutine(), refetchSellers()]); toast.success('Rotina da equipe atualizada.') }

  return <main className="min-h-full bg-gray-50" id="main-content"><div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 pb-24">
    <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-xl font-bold text-gray-800">Rotina da Equipe</h1><p className="mt-0.5 text-sm text-gray-500">Acompanhe a execução das atividades comerciais da equipe em tempo real.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-gray-500" htmlFor="manager-routine-date">Data<input id="manager-routine-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/></label><label className="text-xs text-gray-500">Buscar<div className="relative mt-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Vendedor..." className="h-10 w-40 rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"/></div></label><Button className="h-10 rounded-xl bg-emerald-600 px-4 hover:bg-emerald-700" onClick={refresh}><RefreshCw size={15}/>Atualizar</Button></div></div></header>
    {error && <Card className="border border-status-error/30 bg-status-error-surface p-mx-md"><Typography variant="p" tone="error">Não foi possível carregar a rotina: {error}</Typography></Card>}
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Resumo da rotina"><RoutineSummaryCard label="Execução Média" value={`${average}%`} icon={TrendingUp} tone="blue"/><RoutineSummaryCard label="Em Dia" value={rows.filter(row=>row.status==='Em dia').length} icon={CheckCircle2} tone="green"/><RoutineSummaryCard label="Em Atenção" value={rows.filter(row=>row.status==='Atenção').length} icon={AlertTriangle} tone="amber"/><RoutineSummaryCard label="Críticos" value={rows.filter(row=>row.status==='Crítico').length} icon={XCircle} tone="red"/></section>
    <ManagerSectionCard><div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-800">Rotina — {format(parseISO(date), 'dd/MM/yyyy')}</h2></div>{filteredRows.length === 0 ? <div className="px-5 py-16 text-center text-sm text-gray-500">{rows.length ? 'Nenhum vendedor corresponde à busca.' : 'Nenhum vendedor vinculado a este gerente.'}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><thead className="border-b border-gray-100 bg-gray-50"><tr>{['Vendedor','Unidade','Execução','Follow-ups','Atualização','Agendamentos','Status','Ações'].map((label, index)=><th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${index === 7 ? 'text-right' : ''}`}>{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{filteredRows.map(row=><tr key={row.seller.id} className="transition-colors hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{row.seller.name}</td><td className="max-w-32 px-4 py-3 text-gray-500">{membership?.store?.name || 'Unidade vinculada'}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${row.execution >= 75 ? 'bg-emerald-500' : row.execution >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width:`${row.execution}%`}}/></div><span className="text-xs font-medium text-gray-700">{row.execution}%</span></div></td><td className="px-4 py-3 text-gray-700">{row.completed}/{row.planned}</td><td className="px-4 py-3 text-gray-700">{row.updated}/{row.completed}</td><td className={`px-4 py-3 font-semibold ${row.appointments===0?'text-red-600':row.appointments===1?'text-orange-500':'text-emerald-600'}`}>{row.appointments}</td><td className="px-4 py-3"><Badge variant={row.status==='Em dia'?'success':row.status==='Atenção'?'warning':'danger'}>{row.status}</Badge></td><td className="px-4 py-3"><div className="flex items-center justify-end gap-1.5 whitespace-nowrap"><button type="button" onClick={()=>setSelectedSellerId(row.seller.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"><Eye size={13}/>Ver rotina</button><button type="button" onClick={()=>void remind(row.seller.id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"><Megaphone size={13}/>Cobrar</button></div></td></tr>)}</tbody></table></div>}</ManagerSectionCard>
    <Card className="border border-border-subtle bg-white p-mx-lg shadow-mx-sm"><Typography variant="h3">Evolução da Execução Média</Typography><Typography variant="p" tone="muted" className="mt-mx-xs">O histórico comparativo será exibido quando houver snapshots oficiais consolidados para o período. Nenhum valor de rede é estimado no cliente.</Typography></Card>
    <Modal open={Boolean(selectedRow)} onClose={() => setSelectedSellerId(null)} title={selectedRow ? `Rotina de ${selectedRow.seller.name}` : 'Rotina do vendedor'} description={`Execução operacional de ${format(parseISO(date), 'dd/MM/yyyy')}.`}>
      {selectedRow && <div className="space-y-mx-md"><div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-4"><RoutineDetailMetric label="Execução" value={`${selectedRow.execution}%`} /><RoutineDetailMetric label="Concluídas" value={`${selectedRow.completed}/${selectedRow.planned}`} /><RoutineDetailMetric label="Agendamentos" value={`${selectedRow.appointments}`} /><RoutineDetailMetric label="Status" value={selectedRow.status} /></div><div><Typography variant="h3" className="mb-mx-sm">Ações do dia</Typography>{selectedActions.length ? <ul className="space-y-mx-xs">{selectedActions.map(action => <li key={action.id} className="flex items-center justify-between gap-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm"><span className="text-sm font-semibold text-text-primary">{action.title}</span><Badge variant={action.status === 'concluida' || action.status === 'justificada' ? 'success' : 'warning'}>{action.status.replaceAll('_', ' ')}</Badge></li>)}</ul> : <Typography variant="p" tone="muted">Nenhuma ação planejada para este vendedor na data selecionada.</Typography>}</div><div className="flex justify-end"><Button variant="outline" onClick={() => void remind(selectedRow.seller.id)}>Cobrar pendências</Button></div></div>}
    </Modal>
  </div></main>
}
function RoutineSkeleton(){return <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true"><Skeleton className="h-mx-20"/><div className="grid grid-cols-4 gap-mx-md">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-mx-32"/>)}</div><Skeleton className="h-[420px]"/></main>}
function RoutineDetailMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-mx-lg bg-surface-alt p-mx-sm"><Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider">{label}</Typography><Typography variant="h3" className="mt-mx-xs">{value}</Typography></div> }
function RoutineSummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof TrendingUp; tone: 'blue' | 'green' | 'amber' | 'red' }) { const styles = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600' }; return <article className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles[tone]}`}><Icon size={20}/></span><div><p className="text-2xl font-bold text-gray-800">{value}</p><p className="text-xs text-gray-500">{label}</p></div></article> }
