import { useEffect, useMemo, useState } from 'react'
import { endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns'
import { Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Typography } from '@/components/atoms/Typography'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import type { RankingEntry, Store } from '@/types/database'
import type { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { ManagerHomeReturnLink } from '@/features/manager/home/ManagerHomeReturnLink'
import { ManagerTeamKanban, type ManagerTeamAction } from './ManagerTeamKanban'
import { buildManagerTeamCard, type ManagerTeamView } from './manager-team-kanban'
import { buildManagerTeamActionTarget, buildManagerTeamContext } from './manager-team-navigation'
import { ManagerSellerProfileModal } from './ManagerSellerProfileModal'

type TeamPeriod = 'current' | 'previous' | 'last30'
type DashboardData = ReturnType<typeof useDashboardLojaData>

type SellerRow = RankingEntry & { checked_in?: boolean }

export function ManagerTeamPerformance({ data, storeName, selectableStores = [], onStoreChange }: { data: DashboardData; storeName: string; selectableStores?: Store[]; onStoreChange?: (storeId: string) => void }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<TeamPeriod>('current')
  const [view, setView] = useState<ManagerTeamView>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const openProfile = (row: SellerRow) => { setSelectedId(row.user_id) }
  const handleAction = (action: ManagerTeamAction, row: RankingEntry) => {
    try {
      sessionStorage.setItem('mx_contexto_navegacao', JSON.stringify(buildManagerTeamContext(row, period, view)))
    } catch {
      // Navegação contextual é uma melhoria; não bloqueia a ação se o storage estiver indisponível.
    }
    navigate(buildManagerTeamActionTarget(action, row, data.referenceDate))
  }

  if (data.loading) return <ManagerTeamLoadingState />

  return <section className="min-h-full bg-gray-50" aria-label="Performance da equipe">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
    <ManagerHomeReturnLink />
    <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-xl font-bold text-gray-800">Minha Equipe</h1><p className="mt-0.5 text-sm text-gray-500">Acompanhe a evolução da equipe e identifique onde sua atuação gerencial é necessária.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs text-gray-500">Buscar<div className="relative mt-1 w-full sm:w-52"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/><Input aria-label="Buscar vendedor" placeholder="Vendedor..." value={search} onChange={event => setSearch(event.target.value)} className="h-10 rounded-xl border-gray-200 pl-9"/></div></label><label className="text-xs text-gray-500">Período<select value={period} onChange={event => setPeriod(event.target.value as TeamPeriod)} aria-label="Período da equipe" className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"><option value="current">Mês atual</option><option value="previous">Mês anterior</option><option value="last30">Últimos 30 dias</option></select></label>{selectableStores.length > 1 && onStoreChange ? <label className="text-xs text-gray-500">Unidade<select aria-label="Unidade da equipe" value={data.selectedStoreId || ''} onChange={event => onStoreChange(event.target.value)} className="mt-1 block h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"><option value="">Todas</option>{selectableStores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label> : null}</div></div>
    </header>

    {filtered.length ? <ManagerTeamKanban cards={cards} view={view} storeName={storeName} onViewChange={setView} onOpenProfile={openProfile} onAction={handleAction}/> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center"><Users className="mx-auto text-text-tertiary"/><Typography variant="p" tone="muted" className="mt-2">{rows.length === 0 ? 'Nenhum vendedor vinculado a este gerente.' : 'Nenhum vendedor corresponde à busca.'}</Typography></div>}

    <ManagerSellerProfileModal
      open={Boolean(selected)}
      seller={selected}
      card={selectedCard}
      storeName={storeName}
      onClose={() => setSelectedId(null)}
      onOpenFeedback={() => selected && handleAction('feedback', selected)}
      onOpenRoutine={() => selected && handleAction('routine', selected)}
      onOpenTraining={() => selected && handleAction('training', selected)}
    />
    </div>
  </section>
}

function ManagerTeamLoadingState() {
  return <section className="min-h-full bg-gray-50" aria-label="Performance da equipe" aria-busy="true">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
      <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-52 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </header>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {['Críticos', 'Atenção', 'Em dia'].map(label => <section key={label} className="min-h-[280px] overflow-hidden rounded-2xl border border-gray-100 bg-white" aria-label={`Carregando coluna ${label}`}>
          <div className="h-14 animate-pulse bg-gray-100" />
          <div className="space-y-3 p-3">
            <div className="h-56 animate-pulse rounded-2xl bg-gray-50" />
          </div>
        </section>)}
      </div>
    </div>
  </section>
}
