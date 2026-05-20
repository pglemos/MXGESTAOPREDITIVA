import { ChevronDown, Globe, RefreshCw, Target, Users } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { isPerfilInternoMx } from '@/hooks/useAuth'
import type { Store, UserRole } from '@/types/database'
import { format, parseISO } from 'date-fns'
import type { ViewMode } from '../hooks/useDashboardLojaData'

export type DashboardTab = 'performance' | 'metas' | 'equipe'

type DashboardHeaderProps = {
  role: UserRole | null
  isOwner: boolean
  storeName: string
  selectedStoreId: string | null
  selectableStores: Store[]
  setActiveStoreId: (id: string) => void
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  isRefetching: boolean
  syncWarning: string | null
  lastSyncAt: Date | null
  lastSyncLabel: string
  onRefresh: () => void
  // period selector
  viewMode: ViewMode
  setViewMode: (m: ViewMode) => void
  referenceDate: string
  startDate: string
  setStartDate: (d: string) => void
  endDate: string
  setEndDate: (d: string) => void
}

const LOJA_TABS = [
  { key: 'performance' as const, label: 'Performance', mobileLabel: 'Perf.', icon: Globe },
  { key: 'metas' as const, label: 'Metas', mobileLabel: 'Metas', icon: Target },
  { key: 'equipe' as const, label: 'Equipe', mobileLabel: 'Equipe', icon: Users },
]

const PERIODO_TABS = [
  { key: 'month' as const, label: 'Mês' },
  { key: 'day' as const, label: 'D-1' },
]

/**
 * Header do DashboardLoja — store selector, tabs, refresh, owner store switch,
 * sync warning e seletor de período (quando aba performance).
 * Extraído de DashboardLoja.tsx (Story 2.5).
 */
export function DashboardHeader({
  role,
  isOwner,
  storeName,
  selectedStoreId,
  selectableStores,
  setActiveStoreId,
  activeTab,
  onTabChange,
  isRefetching,
  syncWarning,
  lastSyncAt,
  lastSyncLabel,
  onRefresh,
  viewMode,
  setViewMode,
  referenceDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: DashboardHeaderProps) {
  const navigate = useNavigate()

  const periodContext = viewMode === 'day'
    ? {
        title: 'Leitura D-1',
        description: `Dados do dia de referência ${format(parseISO(referenceDate), 'dd/MM/yyyy')}. Intervalo manual fica desativado nesta leitura.`,
      }
    : {
        title: 'Intervalo manual',
        description: `Dados consolidados de ${format(parseISO(startDate), 'dd/MM/yyyy')} até ${format(parseISO(endDate), 'dd/MM/yyyy')}.`,
      }

  return (
    <>
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-mx-md md:gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-xs text-center xl:text-left min-w-0">
          <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60 text-mx-tiny">
            Status de Unidade
          </Typography>
          <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
            <div className="hidden sm:block w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            {isPerfilInternoMx(role) ? (
              <div className="relative group w-full mx-store-title-select-width max-w-mx-sidebar-expanded sm:max-w-mx-2xl">
                <select
                  id="store-dashboard-select"
                  name="store-dashboard-select"
                  aria-label="Selecionar unidade"
                  value={selectedStoreId || ''}
                  onChange={e => {
                    const newStoreId = e.target.value
                    const newStore = selectableStores.find(store => store.id === newStoreId)
                    if (newStore) {
                      if (!isPerfilInternoMx(role)) setActiveStoreId(newStoreId)
                      navigate(`/lojas/${slugify(newStore.name)}?id=${newStoreId}${activeTab === 'performance' ? '' : `&tab=${activeTab}`}`)
                    }
                  }}
                  className="w-full appearance-none bg-transparent text-2xl sm:text-4xl xl:text-5xl font-black text-text-primary tracking-tighter uppercase outline-none pr-10 cursor-pointer hover:text-brand-primary transition-colors truncate"
                >
                  {selectableStores.map(store => (
                    <option key={store.id} value={store.id} className="text-lg bg-white">
                      {store.name.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown size={24} className="absolute right-mx-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            ) : (
              <Typography variant="h1" className="max-w-full text-3xl sm:text-5xl font-black uppercase tracking-tighter break-words">
                {storeName}
              </Typography>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
          {isOwner && selectableStores.length > 1 && (
            <label htmlFor="owner-store-select" className="flex w-full flex-col gap-mx-tiny rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-xs shadow-mx-sm sm:w-mx-sidebar-expanded">
              <span className="text-mx-micro font-black uppercase tracking-widest text-text-secondary">Trocar unidade</span>
              <select
                id="owner-store-select"
                name="owner-store-select"
                value={selectedStoreId || ''}
                onChange={event => {
                  const newStoreId = event.target.value
                  const newStore = selectableStores.find(store => store.id === newStoreId)
                  if (!newStore) return
                  setActiveStoreId(newStoreId)
                  navigate(`/lojas/${slugify(newStore.name)}?id=${newStoreId}${activeTab === 'performance' ? '' : `&tab=${activeTab}`}`)
                }}
                className="min-w-0 bg-transparent text-sm font-black uppercase text-text-primary outline-none"
              >
                {selectableStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </label>
          )}
          <TabNavPill tabs={LOJA_TABS} activeTab={activeTab} onTabChange={onTabChange} className="mx-store-dashboard-tabs max-w-full overflow-x-auto" buttonClassName="h-mx-8 sm:h-mx-10 px-2 sm:px-6 shrink-0" aria-label="Abas da loja" />

          {activeTab === 'performance' && (
            <Button variant="outline" onClick={onRefresh} aria-label={`Atualizar performance. ${lastSyncLabel}`} title={lastSyncLabel} className="h-mx-10 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white px-mx-md">
              <RefreshCw size={18} className={cn(isRefetching && 'animate-spin')} />
              Atualizar
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
        <LastUpdated value={lastSyncAt} />
        {syncWarning && (
          <div role="alert" className="rounded-mx-xl border border-status-warning/20 bg-status-warning-surface px-mx-md py-mx-sm text-mx-tiny font-black uppercase tracking-tight text-status-warning">
            {syncWarning}
          </div>
        )}
      </div>

      {activeTab === 'performance' && (
        <Card className="border border-border-default bg-white p-mx-md shadow-mx-sm">
          <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[auto_1fr_auto] xl:items-center">
            <div className="min-w-0">
              <Typography variant="h3" className="uppercase tracking-tight">{periodContext.title}</Typography>
              <Typography variant="p" tone="muted" className="mt-mx-tiny text-sm">{periodContext.description}</Typography>
            </div>
            <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center">
              <TabNavPill tabs={PERIODO_TABS} activeTab={viewMode} onTabChange={(m) => setViewMode(m as ViewMode)} buttonClassName="h-mx-11 px-5" aria-label="Período do dashboard" />
              <div className={cn(
                'grid grid-cols-1 gap-mx-sm rounded-mx-xl border border-border-default bg-surface-alt p-mx-sm sm:grid-cols-2',
                viewMode === 'day' && 'opacity-50'
              )}>
                <label className="space-y-mx-tiny">
                  <span className="block text-mx-micro font-black uppercase tracking-widest text-text-secondary">Início</span>
                  <input type="date" aria-label="Data inicial do período" disabled={viewMode === 'day'} value={startDate} onChange={e => { setStartDate(e.target.value); setViewMode('month') }} className="h-mx-12 w-full min-w-mx-40 rounded-mx-lg border border-border-default bg-white px-mx-sm text-sm font-black text-text-primary outline-none focus:border-brand-primary" />
                </label>
                <label className="space-y-mx-tiny">
                  <span className="block text-mx-micro font-black uppercase tracking-widest text-text-secondary">Fim</span>
                  <input type="date" aria-label="Data final do período" disabled={viewMode === 'day'} value={endDate} onChange={e => { setEndDate(e.target.value); setViewMode('month') }} className="h-mx-12 w-full min-w-mx-40 rounded-mx-lg border border-border-default bg-white px-mx-sm text-sm font-black text-text-primary outline-none focus:border-brand-primary" />
                </label>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => onTabChange('metas')} className="h-mx-11 rounded-mx-xl bg-white">
              <Target size={16} className="mr-2" />
              Metas que alimentam a leitura
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}

export default DashboardHeader
