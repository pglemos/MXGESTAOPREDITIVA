import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CalendarCheck, CheckCircle2, RefreshCw, Users } from 'lucide-react'
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
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { Modal } from '@/components/organisms/Modal'
import { classifyRoutine, percent } from '@/features/manager/shared/manager-metrics'
import { ManagerMetricCard, ManagerSectionCard } from '@/features/manager/shared/ManagerVisualPrimitives'

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
  const selectedRow = rows.find(row => row.seller.id === selectedSellerId) || null
  const selectedActions = actions.filter(action => action.seller_id === selectedSellerId)

  const remind = async (sellerId: string) => {
    const { error: notificationError } = await sendNotification({ recipient_id: sellerId, title: 'Pendências na Rotina do Dia', message: 'Você possui pendências na Rotina do Dia. Conclua as ações planejadas e atualize o Plano de Ataque.', type: 'routine', priority: 'high', link: '/central-execucao' })
    if (notificationError) toast.error('Não foi possível registrar a cobrança.')
    else toast.success('Cobrança registrada e enviada.')
  }

  if (loading || sellersLoading) return <RoutineSkeleton />
  const refresh = async () => { await Promise.all([fetchRoutine(), refetchSellers()]); toast.success('Rotina da equipe atualizada.') }

  return <main className="min-h-full bg-surface-alt p-mx-md sm:p-mx-lg" id="main-content"><div className="mx-auto flex w-full max-w-[1680px] flex-col gap-mx-lg pb-20">
    <SellerPageHeader icon={CalendarCheck} title="Rotina da Equipe" subtitle="Execução das atividades comerciais" actions={<div className="flex w-full gap-mx-sm sm:w-auto"><label className="sr-only" htmlFor="manager-routine-date">Data</label><input id="manager-routine-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="h-mx-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold shadow-sm sm:flex-none"/><Button variant="outline" className="h-mx-11 flex-1 rounded-xl bg-white shadow-sm sm:flex-none" onClick={refresh}><RefreshCw size={17}/>Atualizar</Button></div>} />
    {error && <Card className="border border-status-error/30 bg-status-error-surface p-mx-md"><Typography variant="p" tone="error">Não foi possível carregar a rotina: {error}</Typography></Card>}
    <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da rotina"><ManagerMetricCard title="Execução Média" value={`${average}%`} detail="Ações concluídas no dia" icon={CalendarCheck} tone={average >= 75 ? 'success' : average >= 50 ? 'warning' : 'danger'}/><ManagerMetricCard title="Em Dia" value={rows.filter(row=>row.status==='Em dia').length} detail="Execução acima de 75%" icon={CheckCircle2} tone="success"/><ManagerMetricCard title="Em Atenção" value={rows.filter(row=>row.status==='Atenção').length} detail="Execução entre 50% e 74%" icon={AlertTriangle} tone="warning"/><ManagerMetricCard title="Críticos" value={rows.filter(row=>row.status==='Crítico').length} detail="Abaixo de 50% de execução" icon={Users} tone="danger"/></section>
    <ManagerSectionCard><div className="border-b border-border-subtle p-mx-md"><Typography variant="h3">Rotina — {format(parseISO(date), 'dd/MM/yyyy')}</Typography><Typography variant="caption" tone="muted">Central de execução consolidada por vendedor</Typography></div>{rows.length === 0 ? <div className="p-mx-xl text-center"><Typography variant="p" tone="muted">Nenhum vendedor vinculado a este gerente.</Typography></div> : <div className="overflow-x-auto"><table className="w-full min-w-[860px]"><thead className="bg-surface-alt"><tr>{['Vendedor','Unidade','Execução','Follow-ups','Atualização','Agendamentos','Status','Ações'].map(label=><th key={label} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-wider text-text-tertiary">{label}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{rows.map(row=><tr key={row.seller.id} className="transition-colors hover:bg-surface-alt"><td className="px-mx-md py-mx-sm font-bold">{row.seller.name}</td><td className="px-mx-md py-mx-sm">{membership?.store?.name || 'Unidade vinculada'}</td><td className="px-mx-md py-mx-sm"><div className="flex items-center gap-mx-sm"><div className="h-mx-xs w-mx-24 overflow-hidden rounded-mx-full bg-surface-alt"><div className="h-full bg-brand-primary" style={{width:`${row.execution}%`}}/></div><strong>{row.execution}%</strong></div></td><td className="px-mx-md py-mx-sm font-black">{row.completed}/{row.planned}</td><td className="px-mx-md py-mx-sm font-black">{row.updated}/{row.completed}</td><td className={`px-mx-md py-mx-sm font-black ${row.appointments===0?'text-status-error':row.appointments===1?'text-status-warning':'text-status-success'}`}>{row.appointments}</td><td className="px-mx-md py-mx-sm"><Badge variant={row.status==='Em dia'?'success':row.status==='Atenção'?'warning':'danger'}>{row.status}</Badge></td><td className="px-mx-md py-mx-sm"><div className="flex gap-mx-xs"><Button size="xs" variant="outline" onClick={()=>setSelectedSellerId(row.seller.id)}>Ver rotina</Button><Button size="xs" variant="outline" onClick={()=>remind(row.seller.id)}>Cobrar</Button></div></td></tr>)}</tbody></table></div>}</ManagerSectionCard>
    <Card className="border border-border-subtle bg-white p-mx-lg shadow-mx-sm"><Typography variant="h3">Evolução da Execução Média</Typography><Typography variant="p" tone="muted" className="mt-mx-xs">O histórico comparativo será exibido quando houver snapshots oficiais consolidados para o período. Nenhum valor de rede é estimado no cliente.</Typography></Card>
    <Modal open={Boolean(selectedRow)} onClose={() => setSelectedSellerId(null)} title={selectedRow ? `Rotina de ${selectedRow.seller.name}` : 'Rotina do vendedor'} description={`Execução operacional de ${format(parseISO(date), 'dd/MM/yyyy')}.`}>
      {selectedRow && <div className="space-y-mx-md"><div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-4"><RoutineDetailMetric label="Execução" value={`${selectedRow.execution}%`} /><RoutineDetailMetric label="Concluídas" value={`${selectedRow.completed}/${selectedRow.planned}`} /><RoutineDetailMetric label="Agendamentos" value={`${selectedRow.appointments}`} /><RoutineDetailMetric label="Status" value={selectedRow.status} /></div><div><Typography variant="h3" className="mb-mx-sm">Ações do dia</Typography>{selectedActions.length ? <ul className="space-y-mx-xs">{selectedActions.map(action => <li key={action.id} className="flex items-center justify-between gap-mx-sm rounded-mx-lg border border-border-subtle bg-surface-alt p-mx-sm"><span className="text-sm font-semibold text-text-primary">{action.title}</span><Badge variant={action.status === 'concluida' || action.status === 'justificada' ? 'success' : 'warning'}>{action.status.replaceAll('_', ' ')}</Badge></li>)}</ul> : <Typography variant="p" tone="muted">Nenhuma ação planejada para este vendedor na data selecionada.</Typography>}</div><div className="flex justify-end"><Button variant="outline" onClick={() => void remind(selectedRow.seller.id)}>Cobrar pendências</Button></div></div>}
    </Modal>
  </div></main>
}
function RoutineSkeleton(){return <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true"><Skeleton className="h-mx-20"/><div className="grid grid-cols-4 gap-mx-md">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-mx-32"/>)}</div><Skeleton className="h-[420px]"/></main>}
function RoutineDetailMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-mx-lg bg-surface-alt p-mx-sm"><Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wider">{label}</Typography><Typography variant="h3" className="mt-mx-xs">{value}</Typography></div> }
