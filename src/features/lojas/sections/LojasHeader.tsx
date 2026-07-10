import { Plus, RefreshCw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { PageHeading } from '@/components/molecules/PageHeading'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { OPERATIONAL_ACTION_LABELS } from '@/lib/ui/actionLabels'

interface LojasHeaderProps {
  isOwner: boolean
  isAdminMx: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  filterActive: boolean
  onFilterChange: (active: boolean) => void
  storeStatusCounts: { active: number; archived: number }
  isRefetching: boolean
  lastUpdatedAt: Date | null
  onRefresh: () => void
  onOpenCreate: () => void
}

/**
 * Cabeçalho da page Lojas: título, busca, filtro de status, refresh e CTA "Nova Loja".
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
export function LojasHeader({
  isOwner,
  isAdminMx,
  searchTerm,
  onSearchChange,
  filterActive,
  onFilterChange,
  storeStatusCounts,
  isRefetching,
  lastUpdatedAt,
  onRefresh,
  onOpenCreate,
}: LojasHeaderProps) {
  return (
    <PageHeading
      title={isOwner ? 'Visão Executiva da Rede' : <>Gestão de <span className="text-brand-primary">Lojas</span></>}
      subtitle={isOwner ? 'COMPARE LOJAS, PRIORIZE DECISÕES E ACOMPANHE EXECUÇÃO' : 'CONTROLE DE UNIDADES & GOVERNANÇA MX'}
      actions={(
        <>
          <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
          <Button
            variant="outline"
            onClick={onRefresh}
            className="hidden sm:flex rounded-mx-lg shadow-mx-sm h-mx-xl px-mx-md bg-white border-border-subtle hover:bg-surface-alt text-text-secondary"
            aria-label="Atualizar lista de lojas"
          >
            <RefreshCw size={20} className={cn(isRefetching && 'animate-spin')} aria-hidden="true" />
            {OPERATIONAL_ACTION_LABELS.refresh}
          </Button>
          <div className="relative group w-full sm:w-mx-sidebar-expanded">
            <Search
              size={16}
              className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors"
              aria-hidden="true"
            />
            <label htmlFor="search-lojas" className="sr-only">
              Buscar unidade por nome
            </label>
            <Input
              id="search-lojas"
              placeholder="LOCALIZAR LOJA..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="!pl-mx-11 !h-mx-12 uppercase tracking-mx-wide text-mx-nano font-black"
            />
          </div>
          {isAdminMx && (
            <>
              <TabNavPill
                tabs={[
                  { key: 'ativas', label: `Ativas (${storeStatusCounts.active})` },
                  { key: 'arquivadas', label: `Arquivadas (${storeStatusCounts.archived})` },
                ]}
                activeTab={filterActive ? 'ativas' : 'arquivadas'}
                onTabChange={k => onFilterChange(k === 'ativas')}
                className="mr-0 sm:mr-2 w-full sm:w-auto"
              />
              <Button
                onClick={onOpenCreate}
                className="h-mx-xl px-8 shadow-mx-lg bg-brand-primary hover:bg-brand-primary-hover text-white rounded-mx-lg uppercase font-black tracking-widest text-xs w-full sm:w-auto"
              >
                <Plus size={18} className="mr-2" aria-hidden="true" /> NOVA LOJA
              </Button>
            </>
          )}
        </>
      )}
    />
  )
}
