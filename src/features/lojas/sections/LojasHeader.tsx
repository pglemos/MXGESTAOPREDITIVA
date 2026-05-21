import { Plus, RefreshCw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
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
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
      <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
          <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
          <Typography variant="h1">
            {isOwner ? 'Visão Executiva da Rede' : <>Gestão de <span className="text-mx-green-700">Lojas</span></>}
          </Typography>
        </div>
        <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">
          {isOwner
            ? 'COMPARE LOJAS, PRIORIZE DECISÕES E ACOMPANHE EXECUÇÃO'
            : 'CONTROLE DE UNIDADES & GOVERNANÇA MX'}
        </Typography>
      </div>

      <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
        <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
        <Button
          variant="outline"
          onClick={onRefresh}
          className="hidden sm:flex rounded-mx-xl shadow-mx-sm h-mx-xl px-mx-md bg-white border-border-strong"
          aria-label="Atualizar lista de lojas"
        >
          <RefreshCw size={20} className={cn(isRefetching && 'animate-spin')} aria-hidden="true" />
          {OPERATIONAL_ACTION_LABELS.refresh}
        </Button>
        <div className="relative group w-full sm:w-mx-sidebar-expanded order-2 sm:order-none">
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
          <div className="flex w-full sm:w-auto gap-mx-sm order-1 sm:order-none">
            <TabNavPill
              tabs={[
                { key: 'ativas', label: `Ativas (${storeStatusCounts.active})` },
                { key: 'arquivadas', label: `Arquivadas (${storeStatusCounts.archived})` },
              ]}
              activeTab={filterActive ? 'ativas' : 'arquivadas'}
              onTabChange={k => onFilterChange(k === 'ativas')}
              className="flex-1 sm:flex-none mr-0 sm:mr-2"
            />
            <Button
              onClick={onOpenCreate}
              className="flex-1 sm:flex-none h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs"
            >
              <Plus size={18} className="mr-2" aria-hidden="true" /> NOVA LOJA
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
