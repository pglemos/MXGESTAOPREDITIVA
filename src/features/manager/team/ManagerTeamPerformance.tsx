import { useEffect, useMemo, useState } from 'react'
import { endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns'
import { BarChart3, BookOpen, CheckCircle2, MessageSquare, Search, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { Modal } from '@/components/organisms/Modal'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import type { RankingEntry } from '@/types/database'
import type { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { ManagerTeamKanban, type ManagerTeamAction } from './ManagerTeamKanban'
import { buildManagerTeamCard, type ManagerTeamView } from './manager-team-kanban'

type TeamTab = 'overview' | 'performance' | 'routine' | 'feedbacks' | 'training'
type TeamPeriod = 'current' | 'previous' | 'last30'
type DashboardData = ReturnType<typeof useDashboardLojaData>

type SellerRow = RankingEntry & { checked_in?: boolean }

export function ManagerTeamPerformance({ data, storeName }: { data: DashboardData; storeName: string }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<TeamPeriod>('current')
  const [view, setView] = useState<ManagerTeamView>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TeamTab>('overview')
  const rows = data.metrics.ranking
  const filtered = useMemo(() => rows.filter(row => row.user_name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))), [rows, search])
  const cards = useMemo(() => filtered.map(buildManagerTeamCard), [filtered])
  const selected = useMemo(() => rows.find(row => row.user_id === selectedId) ?? null, [rows, selectedId])
  const selectedCard = useMemo(() => selected ? buildManagerTeamCard(selected) : null, [selected])

  useEffect(() => {
    const reference = parseISO(data.referenceDate)
    data.setViewMode('month')
    if (period === 'previous') {
      const previous = subMonths(reference, 1)
      data.setStartDate(format(startOfMonth(previous), 'yyyy-MM-dd'))
      data.setEndDate(format(endOfMonth(previous), 'yyyy-MM-dd'))
    } else if (period === 'last30') {
      data.setStartDate(format(subDays(reference, 29), 'yyyy-MM-dd'))
      data.setEndDate(data.referenceDate)
    } else {
      data.setStartDate(format(startOfMonth(reference), 'yyyy-MM-dd'))
      data.setEndDate(data.referenceDate)
    }
  }, [data.referenceDate, data.setEndDate, data.setStartDate, data.setViewMode, period])

  useEffect(() => () => data.setViewMode('day'), [data.setViewMode])

  const openProfile = (row: SellerRow) => { setSelectedId(row.user_id); setTab('overview') }
  const handleAction = (action: ManagerTeamAction) => {
    if (action === 'routine') navigate('/gerente/rotina-equipe')
    if (action === 'feedback') navigate('/gerente/feedbacks-pdis?tab=feedbacks')
    if (action === 'closing') navigate('/gerente/fechamento-diario')
    if (action === 'training') navigate('/gerente/universidade-mx')
  }

  return <section className="min-h-full bg-gray-50" aria-label="Performance da equipe">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
    <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-xl font-bold text-gray-800">Minha Equipe</h1><p className="mt-0.5 text-sm text-gray-500">Acompanhe a evolução da equipe e identifique onde sua atuação gerencial é necessária.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-gray-500">Buscar<div className="relative mt-1 w-full sm:w-52"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/><Input aria-label="Buscar vendedor" placeholder="Vendedor..." value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-gray-200 pl-9"/></div></label><label className="text-xs text-gray-500">Período<select value={period} onChange={event => setPeriod(event.target.value as TeamPeriod)} aria-label="Período da equipe" className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"><option value="current">Mês atual</option><option value="previous">Mês anterior</option><option value="last30">Últimos 30 dias</option></select></label></div></div>
    </header>

    {filtered.length ? <ManagerTeamKanban cards={cards} view={view} storeName={storeName} onViewChange={setView} onOpenProfile={openProfile} onAction={handleAction}/> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center"><Users className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-2">Nenhum vendedor corresponde à busca.</Typography></div>}

    <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected?.user_name || 'Perfil do vendedor'} description={storeName} size="lg">
      {selected && selectedCard && <div className="space-y-mx-md"><TabNavPill<TeamTab> tabs={[
        { key: 'overview', label: 'Visão Geral', mobileLabel: 'Geral', icon: Users },
        { key: 'performance', label: 'Performance', mobileLabel: 'Resultado', icon: BarChart3 },
        { key: 'routine', label: 'Rotina', icon: CheckCircle2 },
        { key: 'feedbacks', label: 'Feedbacks', mobileLabel: 'Feedback', icon: MessageSquare },
        { key: 'training', label: 'Treinamentos', mobileLabel: 'Trilha', icon: BookOpen },
      ]} activeTab={tab} onTabChange={setTab} />
        {tab === 'overview' && <div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-3"><MetricCard label="Vendas no período" value={selected.vnd_total}/><MetricCard label="Meta individual" value={selected.meta || '—'}/><MetricCard label="% da meta" value={selectedCard.result === null ? '—' : `${Math.round(selectedCard.result)}%`}/><MetricCard label="Rotina" value={selectedCard.routine === null ? 'Sem dados' : `${selectedCard.routine}%`}/><MetricCard label="Agendamentos" value={selected.agd_total}/><MetricCard label="Disciplina" value={selectedCard.discipline === null ? 'Sem dados' : `${selectedCard.discipline}%`}/></div>}
        {tab === 'performance' && <div className="grid grid-cols-2 gap-mx-sm sm:grid-cols-4"><MetricCard label="Leads" value={selected.leads}/><MetricCard label="Agendamentos" value={selected.agd_total}/><MetricCard label="Visitas" value={selected.visitas}/><MetricCard label="Vendas" value={selected.vnd_total}/></div>}
        {tab === 'routine' && <div className="rounded-xl bg-slate-50 p-5"><Typography variant="h3">Rotina do período</Typography><Typography variant="p" tone="muted" className="mt-2">{selectedCard.routine === null ? 'Ainda não há ações oficiais suficientes para calcular a execução da rotina.' : `Execução verificada: ${selectedCard.routine}%.`}</Typography><Button variant="outline" className="mt-4" onClick={() => navigate('/gerente/rotina-equipe')}>Abrir Rotina da Equipe</Button></div>}
        {tab === 'feedbacks' && <ActionPanel icon={MessageSquare} title="Feedbacks do vendedor" detail="Consulte devolutivas e registre novos compromissos na central gerencial." action="Abrir Feedbacks" onClick={() => navigate('/gerente/feedbacks-pdis?tab=feedbacks')} />}
        {tab === 'training' && <ActionPanel icon={BookOpen} title="Treinamentos do vendedor" detail="Acompanhe progresso, matriz da equipe e planos de reforço." action="Abrir Universidade MX" onClick={() => navigate('/gerente/universidade-mx')} />}
      </div>}
    </Modal>
    </div>
  </section>
}

function MetricCard({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><Typography variant="tiny" tone="muted" className="font-bold uppercase tracking-wide">{label}</Typography><Typography variant="h2" className="mt-2">{value}</Typography></div> }
function ActionPanel({ icon: Icon, title, detail, action, onClick }: { icon: typeof TrendingUp; title: string; detail: string; action: string; onClick: () => void }) { return <div className="rounded-xl bg-slate-50 p-5"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-primary shadow-sm"><Icon/></span><div><Typography variant="h3">{title}</Typography><Typography variant="p" tone="muted" className="mt-1">{detail}</Typography></div></div><Button className="mt-5" onClick={onClick}>{action}</Button></div> }
