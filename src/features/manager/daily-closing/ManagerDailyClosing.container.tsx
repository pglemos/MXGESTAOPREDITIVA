import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useSellersByStore } from '@/hooks/useStores'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'
import { useNotifications } from '@/hooks/useData'
import { calculateReferenceDate } from '@/hooks/checkins/types'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { classifyDiscipline, getClosingStatus } from '@/features/manager/shared/manager-metrics'
import { AgendaD1Panel } from '@/features/manager/daily-closing/AgendaD1Panel'
import { CorrigirLeadsModal } from '@/features/manager/daily-closing/CorrigirLeadsModal'
import { ManagerMetricCard, ManagerSectionCard, ManagerStatusGauge } from '@/features/manager/shared/ManagerVisualPrimitives'
import type { buildLeadCorrectionPayload } from '@/features/manager/daily-closing/corrigir-leads'
import type { CheckinCorrectionRequest, CheckinWithTotals } from '@/types/database'
import { toast } from '@/lib/toast'

type PendingRequest = CheckinCorrectionRequest & { seller?: { name?: string | null; avatar_url?: string | null } | null }

export default function ManagerDailyClosing() {
  const { storeId } = useAuth()
  const [date, setDate] = useState(calculateReferenceDate)
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [requestError, setRequestError] = useState<string | null>(null)
  const [agenda, setAgenda] = useState<{ open: boolean; sellerId?: string }>({ open: false })
  const [leadCorrection, setLeadCorrection] = useState<{ sellerName: string; checkin: CheckinWithTotals } | null>(null)
  const [reminding, setReminding] = useState(false)
  const { sellers, loading: sellersLoading, refetch: refetchSellers } = useSellersByStore(storeId)
  const { checkins, loading: checkinsLoading, error, refetch } = useCheckinsByDateRange(storeId, date, date)
  const auditor = useCheckinAuditor(storeId || undefined)
  const { sendNotification } = useNotifications()

  const loadRequests = useCallback(async () => {
    setRequestError(null)
    try {
      setRequests((await auditor.fetchPendingRequests()) as PendingRequest[])
    } catch (requestError) {
      setRequests([])
      setRequestError(requestError instanceof Error ? requestError.message : 'Falha ao carregar regularizações.')
    }
  }, [auditor.fetchPendingRequests])
  useEffect(() => { void loadRequests() }, [loadRequests])

  const requestsBySeller = useMemo(() => new Set(requests.map(request => request.seller_id)), [requests])
  const checkinBySeller = useMemo(() => new Map(checkins.map(checkin => [checkin.seller_user_id, checkin])), [checkins])
  const rows = useMemo(() => sellers.map(seller => ({ seller, checkin: checkinBySeller.get(seller.id), status: getClosingStatus(checkinBySeller.get(seller.id), requestsBySeller.has(seller.id)) })), [sellers, checkinBySeller, requestsBySeller])
  const submitted = rows.filter(row => row.checkin).length
  const pending = rows.length - submitted
  const pendingRows = rows.filter(row => !row.checkin)
  const appointments = checkins.reduce((sum, item) => sum + item.agd_cart_today + item.agd_net_today, 0)
  const disciplineValues = checkins.map(item => item.pontuacao_disciplina_final).filter((value): value is number => typeof value === 'number')
  const discipline = disciplineValues.length ? Math.round(disciplineValues.reduce((a, b) => a + b, 0) / disciplineValues.length) : null

  const refreshAll = async () => {
    await Promise.all([refetch(), refetchSellers(), loadRequests()])
    toast.success('Fechamento da equipe atualizado.')
  }

  const remindPending = async () => {
    if (!pendingRows.length) return
    setReminding(true)
    const results = await Promise.all(pendingRows.map(({ seller }) => sendNotification({
      recipient_id: seller.id,
      title: 'Fechamento Diário pendente',
      message: `Seu fechamento de ${format(parseISO(date), 'dd/MM/yyyy')} ainda não foi enviado. Regularize a entrega e atualize o gerente.`,
      type: 'checkin',
      priority: 'high',
      link: '/vendedor/terminal-mx',
    })))
    const failures = results.filter(result => result.error).length
    if (failures) toast.error(`${failures} cobrança(s) não puderam ser registradas.`)
    else toast.success(`Cobrança enviada para ${pendingRows.length} vendedor(es).`)
    setReminding(false)
  }

  const applyLeadCorrection = async (payload: ReturnType<typeof buildLeadCorrectionPayload>, reason: string) => {
    if (!leadCorrection) return { error: 'Nenhum fechamento selecionado.' }
    const requested = await auditor.requestCorrection(leadCorrection.checkin.id, payload, reason)
    if (requested.error || !requested.id) return { error: requested.error || 'Não foi possível registrar a correção.' }
    const applied = await auditor.approveRequest({ id: requested.id } as PendingRequest)
    if (applied.error) return { error: applied.error }
    toast.success('Leads corrigidos com auditoria registrada.')
    await Promise.all([refetch(), loadRequests()])
    return { error: null }
  }

  const decide = async (request: PendingRequest, action: 'approve' | 'reject') => {
    const result = action === 'approve' ? await auditor.approveRequest(request) : await auditor.rejectRequest(request.id, 'Recusado pelo gerente na central de fechamento.')
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(action === 'approve' ? 'Regularização aprovada.' : 'Regularização recusada.')
    await loadRequests()
    await refetch()
  }

  if (sellersLoading || checkinsLoading) return <ManagerClosingSkeleton />

  return (
    <main className="min-h-full bg-surface-alt p-mx-md sm:p-mx-lg" id="main-content">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-mx-lg pb-20">
      <SellerPageHeader icon={CalendarDays} title="Fechamento Diário" subtitle="Acompanhe a entrega da equipe" actions={<div className="flex w-full flex-wrap items-end gap-mx-sm sm:w-auto"><div className="min-w-[168px] flex-1 sm:flex-none"><label className="mb-1 block text-mx-tiny font-bold text-text-secondary" htmlFor="manager-closing-date">Data de referência</label><input id="manager-closing-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="h-mx-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"/></div><Button variant="outline" className="h-mx-11 flex-1 rounded-xl bg-white shadow-sm sm:flex-none" onClick={refreshAll}><RefreshCw size={17} />Atualizar</Button></div>} />
      {(error || requestError) && <Card className="border border-status-error/30 bg-status-error-surface p-mx-md"><Typography variant="p" tone="error">{error || `Não foi possível carregar as regularizações: ${requestError}`} Use Atualizar para tentar novamente.</Typography></Card>}
      <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do fechamento">
        <ManagerMetricCard title="Agendamentos" value={appointments} icon={CalendarDays} detail={appointments === 0 ? 'Ruim · sem agenda para o dia' : 'Agenda da equipe para o dia'} tone={appointments === 0 ? 'danger' : 'success'} actionLabel="Ver Agenda D+1" onAction={() => setAgenda({ open: true })} />
        <ManagerMetricCard title="Pendentes Hoje" value={pending} icon={Clock3} detail={pending === 0 ? 'Toda a equipe entregou' : 'Vendedores sem envio'} tone={pending ? 'warning' : 'success'} />
        <ManagerMetricCard title="Regularizações" value={requests.length} icon={ShieldCheck} detail="Aguardando sua aprovação" tone={requests.length ? 'warning' : 'neutral'} />
        <ManagerMetricCard title="Disciplina Média" value={discipline === null ? '—' : `${discipline}%`} icon={CheckCircle2} detail={discipline === null ? 'Dados insuficientes' : classifyDiscipline(discipline)} tone={discipline === null ? 'neutral' : discipline >= 85 ? 'success' : discipline >= 70 ? 'warning' : 'danger'}>
          {discipline !== null && <ManagerStatusGauge value={discipline} label={classifyDiscipline(discipline)} ariaLabel="Disciplina média da equipe" />}
        </ManagerMetricCard>
      </section>
      {(pending > 0 || requests.length > 0) && <div className="flex flex-col gap-mx-sm rounded-mx-xl border border-status-warning/20 bg-status-warning-surface p-mx-md shadow-mx-xs sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-mx-sm"><span className="grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-mx-lg bg-white text-status-warning"><AlertTriangle size={19} aria-hidden="true" /></span><div><Typography variant="h3" className="text-sm normal-case tracking-normal">A operação exige acompanhamento</Typography><Typography variant="caption" tone="muted">{pending} fechamento(s) pendente(s) e {requests.length} regularização(ões) aguardando decisão.</Typography></div></div><div className="flex flex-wrap gap-mx-xs"><Button variant="outline" className="min-h-11 bg-white" disabled={!pendingRows.length || reminding} onClick={() => void remindPending()}>{reminding ? 'Enviando…' : 'Cobrar pendentes'}</Button><Button variant="outline" className="min-h-11 bg-white" onClick={() => document.getElementById('manager-closing-movement')?.scrollIntoView({ behavior: 'smooth' })}>Revisar movimento</Button></div></div>}
      <ManagerSectionCard>
        <div id="manager-closing-movement" />
        <div className="flex flex-wrap items-center justify-between gap-mx-sm border-b border-border-subtle p-mx-md"><div><Typography variant="h3">Movimento da Equipe — {format(parseISO(date), 'dd/MM/yyyy')}</Typography><Typography variant="tiny" tone="muted">{submitted} enviados · {pending} pendentes</Typography></div><Badge variant={pending ? 'warning' : 'success'}>{rows.length} vendedores</Badge></div>
        {rows.length === 0 ? <Empty text="Nenhum vendedor vinculado a este gerente." /> : <div className="overflow-x-auto"><table className="w-full min-w-[920px]"><thead className="bg-surface-alt"><tr>{['Vendedor','Status','Entrega','Leads','Qualif.','Agend.','Atendi.','Venda','Disc.','Ações'].map(label => <th key={label} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-wider text-text-tertiary">{label}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{rows.map(({ seller, checkin, status }) => <ClosingRow key={seller.id} name={seller.name} checkin={checkin} status={status} request={requests.find(request => request.seller_id === seller.id)} onDecide={decide} onOpenAgenda={() => setAgenda({ open: true, sellerId: seller.id })} onCorrigirLeads={checkin ? () => setLeadCorrection({ sellerName: seller.name, checkin }) : undefined} />)}</tbody></table></div>}
      </ManagerSectionCard>
      <AgendaD1Panel open={agenda.open} onClose={() => setAgenda({ open: false })} referenceDate={date} sellers={sellers.map(seller => ({ id: seller.id, name: seller.name }))} initialSellerId={agenda.sellerId} />
      <CorrigirLeadsModal open={Boolean(leadCorrection)} onClose={() => setLeadCorrection(null)} sellerName={leadCorrection?.sellerName || ''} checkin={leadCorrection?.checkin || null} onSubmit={applyLeadCorrection} />
      </div>
    </main>
  )
}

function ClosingRow({ name, checkin, status, request, onDecide, onOpenAgenda, onCorrigirLeads }: { name: string; checkin?: CheckinWithTotals; status: string; request?: PendingRequest; onDecide: (request: PendingRequest, action: 'approve' | 'reject') => Promise<void>; onOpenAgenda: () => void; onCorrigirLeads?: () => void }) {
  const appointments = checkin ? checkin.agd_cart_today + checkin.agd_net_today : 0
  const sales = checkin ? checkin.vnd_porta_prev_day + checkin.vnd_cart_prev_day + checkin.vnd_net_prev_day : 0
  const visits = checkin?.visit_prev_day || 0
  const discipline = checkin?.pontuacao_disciplina_final
  return <tr><td className="px-mx-md py-mx-sm font-bold text-text-primary">{name}</td><td className="px-mx-md py-mx-sm"><Badge variant={status === 'Finalizado' ? 'success' : status === 'Pendente' ? 'danger' : 'warning'}>{status}</Badge></td><td className="px-mx-md py-mx-sm text-sm">{checkin?.submitted_at ? format(parseISO(checkin.submitted_at), 'HH:mm') : '—'}</td><NumberCell value={checkin ? checkin.leads_prev_day + checkin.leads_net_prev_day : 0}/><NumberCell value={0} muted/><td className="px-mx-md py-mx-sm"><button type="button" className={`rounded-mx-sm px-mx-xs font-black underline decoration-dotted underline-offset-4 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action ${appointments === 0 ? 'text-status-error' : appointments === 1 ? 'text-status-warning' : 'text-status-success'}`} aria-label={`Abrir Agenda D+1 de ${name}`} onClick={onOpenAgenda}>{appointments}</button></td><NumberCell value={visits}/><NumberCell value={sales}/><td className="px-mx-md py-mx-sm font-black">{typeof discipline === 'number' ? `${discipline}%` : '—'}</td><td className="px-mx-md py-mx-sm">{request ? <div className="flex gap-mx-xs"><Button size="xs" variant="success" onClick={() => onDecide(request,'approve')}>Aprovar</Button><Button size="xs" variant="danger" onClick={() => onDecide(request,'reject')}>Recusar</Button></div> : onCorrigirLeads ? <Button size="xs" variant="outline" onClick={onCorrigirLeads}>Corrigir leads</Button> : <Typography variant="tiny" tone="muted">Somente consulta</Typography>}</td></tr>
}

function NumberCell({ value, tone, muted }: { value: number; tone?: 'error'|'warning'|'success'; muted?: boolean }) { return <td className={`px-mx-md py-mx-sm font-black ${tone === 'error' ? 'text-status-error' : tone === 'warning' ? 'text-status-warning' : tone === 'success' ? 'text-status-success' : muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{value}</td> }
function Empty({ text }: { text: string }) { return <div className="p-mx-xl text-center"><Users className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-mx-sm">{text}</Typography></div> }
function ManagerClosingSkeleton() { return <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true"><Skeleton className="h-mx-20"/><div className="grid grid-cols-4 gap-mx-md">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-mx-32"/>)}</div><Skeleton className="h-[420px]"/></main> }
