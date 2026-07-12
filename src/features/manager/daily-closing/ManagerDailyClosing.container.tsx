import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Megaphone,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
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
import { classifyDiscipline, getClosingStatus } from '@/features/manager/shared/manager-metrics'
import { AgendaD1Panel } from '@/features/manager/daily-closing/AgendaD1Panel'
import { CorrigirLeadsModal } from '@/features/manager/daily-closing/CorrigirLeadsModal'
import { ManagerSectionCard, ManagerStatusGauge } from '@/features/manager/shared/ManagerVisualPrimitives'
import type { buildLeadCorrectionPayload } from '@/features/manager/daily-closing/corrigir-leads'
import type { CheckinCorrectionRequest, CheckinWithTotals } from '@/types/database'
import { toast } from '@/lib/toast'
import { averageDiscipline, buildClosingSummary, buildDisciplineTrend } from './manager-closing-metrics'

type PendingRequest = CheckinCorrectionRequest & { seller?: { name?: string | null; avatar_url?: string | null } | null }

export default function ManagerDailyClosing() {
  const { storeId, membership } = useAuth()
  const [date, setDate] = useState(calculateReferenceDate)
  const [search, setSearch] = useState('')
  const [historyRange, setHistoryRange] = useState<7 | 15 | 30>(7)
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [requestError, setRequestError] = useState<string | null>(null)
  const [agenda, setAgenda] = useState<{ open: boolean; sellerId?: string }>({ open: false })
  const [leadCorrection, setLeadCorrection] = useState<{ sellerName: string; checkin: CheckinWithTotals } | null>(null)
  const [reminding, setReminding] = useState(false)
  const historyStart = format(subDays(parseISO(date), historyRange - 1), 'yyyy-MM-dd')
  const { sellers, loading: sellersLoading, refetch: refetchSellers } = useSellersByStore(storeId)
  const { checkins, loading: checkinsLoading, error, refetch } = useCheckinsByDateRange(storeId, date, date)
  const { checkins: historyCheckins, refetch: refetchHistory } = useCheckinsByDateRange(storeId, historyStart, date)
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

  const rows = useMemo(() => getClosingRows(sellers, checkins, requests), [sellers, checkins, requests])
  const visibleRows = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR')
    return normalized ? rows.filter(row => row.seller.name.toLocaleLowerCase('pt-BR').includes(normalized)) : rows
  }, [rows, search])
  const submitted = rows.filter(row => row.checkin).length
  const pending = rows.length - submitted
  const pendingRows = rows.filter(row => !row.checkin)
  const appointments = checkins.reduce((sum, item) => sum + item.agd_cart_today + item.agd_net_today, 0)
  const disciplineValues = checkins.map(item => item.pontuacao_disciplina_final).filter((value): value is number => typeof value === 'number')
  const discipline = disciplineValues.length ? Math.round(disciplineValues.reduce((a, b) => a + b, 0) / disciplineValues.length) : null
  const firstCorrectable = rows.find(row => row.checkin)?.checkin
  const firstCorrectableSeller = rows.find(row => row.checkin)?.seller.name
  const trend = useMemo(() => buildDisciplineTrend(historyCheckins, historyStart, date), [historyCheckins, historyStart, date])
  const historicalAverage = averageDiscipline(trend.map(point => point.value).filter((value): value is number => value !== null))
  const summary = useMemo(() => buildClosingSummary(checkins), [checkins])

  const refreshAll = async () => {
    await Promise.all([refetch(), refetchHistory(), refetchSellers(), loadRequests()])
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
    await Promise.all([refetch(), refetchHistory(), loadRequests()])
    return { error: null }
  }

  const decide = async (request: PendingRequest, action: 'approve' | 'reject') => {
    const result = action === 'approve' ? await auditor.approveRequest(request) : await auditor.rejectRequest(request.id, 'Recusado pelo gerente na central de fechamento.')
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(action === 'approve' ? 'Regularização aprovada.' : 'Regularização recusada.')
    await Promise.all([loadRequests(), refetch(), refetchHistory()])
  }

  const openLeadCorrection = () => {
    if (!firstCorrectable || !firstCorrectableSeller) {
      toast.info('A correção de leads ficará disponível após um vendedor enviar o fechamento da data selecionada.')
      return
    }
    setLeadCorrection({ sellerName: firstCorrectableSeller, checkin: firstCorrectable })
  }

  if (sellersLoading || checkinsLoading) return <ManagerClosingSkeleton />

  return (
    <main className="min-h-full bg-surface-alt p-mx-md sm:p-mx-lg" id="main-content">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-mx-lg pb-20">
        <section className="rounded-mx-xl border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
          <div className="flex flex-col gap-mx-lg xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-black tracking-tight text-text-primary">Fechamento Diário</h1>
              <p className="mt-mx-xs text-sm leading-6 text-text-secondary">Acompanhe o movimento comercial informado pelos vendedores, regularize fechamentos fora do horário e corrija volumes oficiais de leads.</p>
            </div>
            <div className="grid w-full gap-mx-sm sm:grid-cols-2 xl:w-auto xl:grid-cols-[148px_180px_170px_auto]">
              <Field label="Data"><input id="manager-closing-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="h-mx-11 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" /></Field>
              <Field label="Unidade"><select aria-label="Unidade" value={storeId || ''} disabled className="h-mx-11 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold disabled:opacity-100"><option value={storeId || ''}>{membership?.store?.name || 'Unidade atual'}</option></select></Field>
              <Field label="Buscar"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Vendedor..." className="h-mx-11 w-full rounded-xl border border-border-subtle bg-white pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary" /></div></Field>
              <Button variant="success" className="h-mx-11 self-end rounded-xl" onClick={refreshAll}><RefreshCw size={17} />Atualizar</Button>
            </div>
          </div>
        </section>

        {(error || requestError) && <Card className="border border-status-error/30 bg-status-error-surface p-mx-md"><Typography variant="p" tone="error">{error || `Não foi possível carregar as regularizações: ${requestError}`} Use Atualizar para tentar novamente.</Typography></Card>}

        <section className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do fechamento">
          <TeamOverview total={rows.length} submitted={submitted} pending={pending} />
          <SummaryCard title="Regularizações" value={requests.length} detail={requests.length ? 'aguardando decisão' : 'nenhuma pendência'} icon={ShieldCheck} tone={requests.length ? 'warning' : 'neutral'} />
          <SummaryCard title="Agendamentos" value={appointments} detail={appointments ? 'agenda da equipe para D+1' : 'Necessário para 1 venda: sem parâmetro'} icon={CalendarDays} tone={appointments ? 'success' : 'danger'} action="Ver Agenda D+1" onAction={() => setAgenda({ open: true })} />
          <SummaryCard title="Disciplina Média" value={discipline === null ? '—' : `${discipline}%`} detail={discipline === null ? 'dados insuficientes' : classifyDiscipline(discipline)} icon={CheckCircle2} tone={discipline === null ? 'neutral' : discipline >= 85 ? 'success' : discipline >= 70 ? 'warning' : 'danger'}>{discipline !== null && <ManagerStatusGauge value={discipline} label={classifyDiscipline(discipline)} ariaLabel="Disciplina média da equipe" />}</SummaryCard>
        </section>

        <section className="flex flex-col gap-mx-sm rounded-mx-xl border border-border-subtle bg-white p-mx-md shadow-mx-sm sm:flex-row sm:items-center sm:justify-between">
          <Badge variant={pending ? 'warning' : 'success'}>{pending ? `${pending} fechamentos pendentes` : 'Equipe em dia'}</Badge>
          <div className="flex flex-wrap gap-mx-xs">
            <Button variant="outline" disabled={!pendingRows.length || reminding} onClick={() => void remindPending()}><Megaphone size={16} />{reminding ? 'Enviando…' : 'Cobrar Pendentes'}</Button>
            <Button variant="outline" disabled={!requests.length} onClick={() => document.getElementById('manager-closing-movement')?.scrollIntoView({ behavior: 'smooth' })}><Eye size={16} />Ver Regularizações</Button>
            <Button variant="outline" onClick={openLeadCorrection}><Wrench size={16} />Corrigir Leads</Button>
          </div>
        </section>

        <ManagerSectionCard>
          <div id="manager-closing-movement" />
          <div className="flex flex-wrap items-center justify-between gap-mx-sm border-b border-border-subtle p-mx-md"><div><Typography variant="h3">Movimento da Equipe — {format(parseISO(date), 'dd/MM/yyyy')}</Typography><Typography variant="tiny" tone="muted">Ordenado por entrega (mais recente)</Typography></div><Badge variant={pending ? 'warning' : 'success'}>{visibleRows.length} vendedor(es)</Badge></div>
          {visibleRows.length === 0 ? <Empty text={search ? 'Nenhum vendedor encontrado para a busca.' : 'Nenhum vendedor vinculado a este gerente.'} /> : submitted === 0 && requests.length === 0 && !search ? <Empty text="Ainda não há fechamentos enviados para a data selecionada." /> : <div className="overflow-x-auto"><table className="w-full min-w-[920px]"><thead className="bg-surface-alt"><tr>{['Vendedor','Status','Entrega','Leads','Qualif.','Agend.','Atendi.','Venda','Disc.','Ações'].map(label => <th key={label} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-wider text-text-tertiary">{label}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{visibleRows.map(({ seller, checkin, status }) => <ClosingRow key={seller.id} name={seller.name} checkin={checkin} status={status} request={requests.find(request => request.seller_id === seller.id)} onDecide={decide} onOpenAgenda={() => setAgenda({ open: true, sellerId: seller.id })} onCorrigirLeads={checkin ? () => setLeadCorrection({ sellerName: seller.name, checkin }) : undefined} />)}</tbody></table></div>}
        </ManagerSectionCard>

        <DisciplineTrendCard trend={trend} range={historyRange} onRange={setHistoryRange} />

        <section className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2">
          <ManagerSectionCard className="p-mx-lg"><h2 className="text-lg font-bold text-text-primary">Comparativo de Disciplina do Fechamento</h2><p className="mt-1 text-sm text-text-secondary">Comparação com equipes da rede da consultoria</p><div className="mt-mx-lg space-y-mx-sm"><ComparisonRow label="Sua Equipe" value={historicalAverage} /><ComparisonRow label="Média da Rede" value={null} /><ComparisonRow label="Top 25% da Rede" value={null} /></div><p className="mt-mx-md text-xs text-text-tertiary">Comparativos de rede aparecem quando houver snapshots oficiais disponíveis.</p></ManagerSectionCard>
          <ManagerSectionCard className="p-mx-lg"><h2 className="text-lg font-bold text-text-primary">Resumo do Fechamento</h2><div className="mt-mx-lg grid grid-cols-2 gap-mx-md sm:grid-cols-3"><SummaryGroup label="Showroom" items={[['Atendimentos', summary.showroomVisits]]} /><SummaryGroup label="Carteira" items={[['Leads', summary.carteiraLeads], ['Atendimentos', summary.carteiraVisits]]} /><SummaryGroup label="Internet" items={[['Leads', summary.internetLeads], ['Atendimentos', summary.internetVisits]]} /><SummaryGroup label="Vendas" items={[['Total', summary.sales]]} /><SummaryGroup label="Qualificados" items={[['Total', null]]} /><SummaryGroup label="Garantia" items={[['Total', null]]} /></div><p className="mt-mx-md text-xs text-text-tertiary">Os leads podem ser corrigidos pelo gerente com registro em auditoria. Demais dados permanecem sob responsabilidade do vendedor.</p></ManagerSectionCard>
        </section>

        <AgendaD1Panel open={agenda.open} onClose={() => setAgenda({ open: false })} referenceDate={date} sellers={sellers.map(seller => ({ id: seller.id, name: seller.name }))} initialSellerId={agenda.sellerId} />
        <CorrigirLeadsModal open={Boolean(leadCorrection)} onClose={() => setLeadCorrection(null)} sellerName={leadCorrection?.sellerName || ''} checkin={leadCorrection?.checkin || null} onSubmit={applyLeadCorrection} />
      </div>
    </main>
  )
}

function getClosingRows(sellers: Array<{ id: string; name: string }>, checkins: CheckinWithTotals[], requests: PendingRequest[]) {
  const requestsBySeller = new Set(requests.map(request => request.seller_id))
  const checkinBySeller = new Map(checkins.map(checkin => [checkin.seller_user_id, checkin]))
  return sellers.map(seller => ({ seller, checkin: checkinBySeller.get(seller.id), status: getClosingStatus(checkinBySeller.get(seller.id), requestsBySeller.has(seller.id)) }))
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-mx-tiny font-bold text-text-secondary"><span className="mb-1 block">{label}</span>{children}</label> }

function TeamOverview({ total, submitted, pending }: { total: number; submitted: number; pending: number }) { return <Card className="rounded-mx-xl border border-border-subtle bg-white p-mx-md shadow-mx-sm"><div className="grid h-full grid-cols-3 divide-x divide-border-subtle"><OverviewStat label="Equipe" value={total} icon={Users} tone="brand" /><OverviewStat label="Enviados hoje" value={submitted} icon={CheckCircle2} tone="success" /><OverviewStat label="Pendentes hoje" value={pending} icon={Clock3} tone="warning" /></div></Card> }

function OverviewStat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Users; tone: 'brand' | 'success' | 'warning' }) { const toneClass = { brand: 'bg-accent-blue-soft text-brand-primary', success: 'bg-status-success-surface text-status-success', warning: 'bg-status-warning-surface text-status-warning' }[tone]; return <div className="flex flex-col items-center px-mx-xs text-center"><span className={`grid h-mx-10 w-mx-10 place-items-center rounded-mx-lg ${toneClass}`}><Icon size={18} /></span><strong className="mt-mx-xs text-2xl text-text-primary">{value}</strong><span className="mt-1 text-xs text-text-secondary">{label}</span></div> }

function SummaryCard({ title, value, detail, icon: Icon, tone, action, onAction, children }: { title: string; value: string | number; detail: string; icon: typeof Users; tone: 'success' | 'warning' | 'danger' | 'neutral'; action?: string; onAction?: () => void; children?: ReactNode }) { const colors = { success: 'border-status-success/20 text-status-success', warning: 'border-status-warning/20 text-status-warning', danger: 'border-status-error/20 text-status-error', neutral: 'border-border-subtle text-text-secondary' }[tone]; return <Card className={`rounded-mx-xl border bg-white p-mx-md shadow-mx-sm ${colors}`}><div className="flex items-center justify-between gap-mx-sm"><span className="grid h-mx-10 w-mx-10 place-items-center rounded-mx-lg bg-surface-alt"><Icon size={18} /></span>{children}</div><div className="mt-mx-sm flex items-end justify-between gap-mx-sm"><div><strong className="text-3xl text-text-primary">{value}</strong><h2 className="mt-1 text-sm font-bold text-text-primary">{title}</h2><p className="mt-1 text-xs text-text-secondary">{detail}</p></div>{action && onAction && <button type="button" onClick={onAction} className="text-xs font-bold text-brand-primary">{action}</button>}</div></Card> }

function DisciplineTrendCard({ trend, range, onRange }: { trend: Array<{ date: string; label: string; value: number | null }>; range: 7 | 15 | 30; onRange: (range: 7 | 15 | 30) => void }) { const points = trend.map((point, index) => point.value === null ? null : `${trend.length === 1 ? 50 : 5 + (index * 90) / (trend.length - 1)},${90 - point.value * 0.75}`).filter((point): point is string => Boolean(point)).join(' '); return <ManagerSectionCard className="p-mx-lg"><div className="flex flex-col gap-mx-sm sm:flex-row sm:items-start sm:justify-between"><div><h2 className="flex items-center gap-mx-xs text-lg font-bold text-text-primary"><TrendingUp size={19} className="text-status-success" />Evolução da Disciplina do Fechamento</h2><p className="mt-1 text-sm text-text-secondary">Acompanhe se a equipe está mantendo consistência na prestação de contas diária.</p></div><div className="flex rounded-xl bg-surface-alt p-1">{([7, 15, 30] as const).map(option => <button key={option} type="button" onClick={() => onRange(option)} className={`rounded-lg px-3 py-2 text-xs font-bold ${range === option ? 'bg-brand-primary text-white' : 'text-text-secondary'}`}>{option} dias</button>)}</div></div><div className="mt-mx-lg min-h-[220px] rounded-xl bg-surface-alt p-mx-md">{points ? <><svg viewBox="0 0 100 100" className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Evolução percentual da disciplina"><line x1="5" x2="95" y1="90" y2="90" stroke="var(--color-border-subtle)" /><line x1="5" x2="95" y1="52.5" y2="52.5" stroke="var(--color-border-subtle)" strokeDasharray="2 2" /><line x1="5" x2="95" y1="15" y2="15" stroke="var(--color-border-subtle)" strokeDasharray="2 2" /><polyline points={points} fill="none" stroke="var(--color-status-success)" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg><div className="flex justify-between overflow-hidden text-[10px] text-text-tertiary"><span>{trend[0]?.label}</span><span>{trend[Math.floor(trend.length / 2)]?.label}</span><span>{trend.at(-1)?.label}</span></div></> : <div className="grid h-48 place-items-center text-center text-sm text-text-secondary">Ainda não há histórico de disciplina no período selecionado.</div>}</div><p className="mt-mx-sm text-xs text-text-tertiary">O dia atual pode aparecer como parcial enquanto houver fechamentos pendentes ou regularizações em aberto.</p></ManagerSectionCard> }

function ComparisonRow({ label, value }: { label: string; value: number | null }) { return <div className="grid grid-cols-[minmax(120px,1fr)_3fr_auto] items-center gap-mx-sm"><span className="text-sm font-semibold text-text-secondary">{label}</span><div className="h-3 overflow-hidden rounded-full bg-surface-alt"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${value || 0}%` }} /></div><strong className="w-12 text-right text-sm text-text-primary">{value === null ? '—' : `${value}%`}</strong></div> }

function SummaryGroup({ label, items }: { label: string; items: Array<[string, number | null]> }) { return <div className="rounded-xl bg-surface-alt p-mx-md"><h3 className="text-xs font-black uppercase tracking-wide text-text-primary">{label}</h3>{items.map(([item, value]) => <div key={item} className="mt-mx-sm flex justify-between gap-mx-xs text-sm"><span className="text-text-secondary">{item}</span><strong>{value === null ? '—' : value}</strong></div>)}</div> }

function ClosingRow({ name, checkin, status, request, onDecide, onOpenAgenda, onCorrigirLeads }: { name: string; checkin?: CheckinWithTotals; status: string; request?: PendingRequest; onDecide: (request: PendingRequest, action: 'approve' | 'reject') => Promise<void>; onOpenAgenda: () => void; onCorrigirLeads?: () => void }) {
  const appointments = checkin ? checkin.agd_cart_today + checkin.agd_net_today : 0
  const sales = checkin ? checkin.vnd_porta_prev_day + checkin.vnd_cart_prev_day + checkin.vnd_net_prev_day : 0
  const visits = checkin?.visit_prev_day || 0
  const discipline = checkin?.pontuacao_disciplina_final
  return <tr><td className="px-mx-md py-mx-sm font-bold text-text-primary">{name}</td><td className="px-mx-md py-mx-sm"><Badge variant={status === 'Finalizado' ? 'success' : status === 'Pendente' ? 'danger' : 'warning'}>{status}</Badge></td><td className="px-mx-md py-mx-sm text-sm">{checkin?.submitted_at ? format(parseISO(checkin.submitted_at), 'HH:mm') : '—'}</td><NumberCell value={checkin ? checkin.leads_prev_day + checkin.leads_net_prev_day : 0}/><NumberCell value={0} muted/><td className="px-mx-md py-mx-sm"><button type="button" className={`rounded-mx-sm px-mx-xs font-black underline decoration-dotted underline-offset-4 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action ${appointments === 0 ? 'text-status-error' : appointments === 1 ? 'text-status-warning' : 'text-status-success'}`} aria-label={`Abrir Agenda D+1 de ${name}`} onClick={onOpenAgenda}>{appointments}</button></td><NumberCell value={visits}/><NumberCell value={sales}/><td className="px-mx-md py-mx-sm font-black">{typeof discipline === 'number' ? `${discipline}%` : '—'}</td><td className="px-mx-md py-mx-sm">{request ? <div className="flex gap-mx-xs"><Button size="xs" variant="success" onClick={() => onDecide(request,'approve')}>Aprovar</Button><Button size="xs" variant="danger" onClick={() => onDecide(request,'reject')}>Recusar</Button></div> : onCorrigirLeads ? <Button size="xs" variant="outline" onClick={onCorrigirLeads}>Corrigir leads</Button> : <Typography variant="tiny" tone="muted">Somente consulta</Typography>}</td></tr>
}

function NumberCell({ value, tone, muted }: { value: number; tone?: 'error'|'warning'|'success'; muted?: boolean }) { return <td className={`px-mx-md py-mx-sm font-black ${tone === 'error' ? 'text-status-error' : tone === 'warning' ? 'text-status-warning' : tone === 'success' ? 'text-status-success' : muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{value}</td> }
function Empty({ text }: { text: string }) { return <div className="p-mx-xl text-center"><Users className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-mx-sm">{text}</Typography></div> }
function ManagerClosingSkeleton() { return <main className="space-y-mx-lg bg-surface-alt p-mx-lg" aria-busy="true"><Skeleton className="h-mx-20"/><div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-mx-32"/>)}</div><Skeleton className="h-[420px]"/></main> }
