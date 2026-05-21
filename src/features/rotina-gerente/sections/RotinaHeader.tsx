import { BarChart3, RefreshCw, ShieldAlert, Store, Target, Zap } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { cn } from '@/lib/utils'
import type { RoutineTab } from '../data/types'

type Loja = { id: string; name: string }

type Props = {
  tab: RoutineTab
  onTabChange: (tab: RoutineTab) => void
  pendingRequestsCount: number
  isRefetching: boolean
  onRefresh: () => void
  isAdmin: boolean
  selectedStoreId: string
  onClearStore: () => void
  lojas: Loja[]
  membership?: { store?: { name?: string | null } | null } | null
}

/**
 * Cabeçalho do Centro de Comando com TabNav (Diário/Semanal/Mensal/Ajustes),
 * indicador da unidade ativa (admin) e refresh.
 */
export function RotinaHeader({
  tab,
  onTabChange,
  pendingRequestsCount,
  isRefetching,
  onRefresh,
  isAdmin,
  selectedStoreId,
  onClearStore,
  lojas,
  membership,
}: Props) {
  const rotinaTabs = [
    { key: 'diario' as const, label: 'Diário', icon: Zap },
    { key: 'semanal' as const, label: 'Semanal', icon: BarChart3 },
    { key: 'mensal' as const, label: 'Mensal', icon: Target },
    { key: 'ajustes' as const, label: 'Ajustes', icon: ShieldAlert, badge: pendingRequestsCount },
  ]

  return (
    <>
      {isAdmin && selectedStoreId && (
        <div className="flex items-center gap-mx-sm bg-white rounded-mx-full px-6 py-2 shadow-mx-sm border border-border-default self-start">
          <Store size={16} className="text-brand-primary" />
          <Typography
            variant="tiny"
            className="font-black uppercase tracking-widest text-text-tertiary"
          >
            Unidade:
          </Typography>
          <Typography
            variant="tiny"
            className="font-black uppercase tracking-widest text-brand-primary"
          >
            {lojas.find((s) => s.id === selectedStoreId)?.name || '...'}
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearStore}
            className="h-mx-10 px-4 text-xs uppercase font-black ml-2"
          >
            Trocar
          </Button>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div
              className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md"
              aria-hidden="true"
            />
            <Typography variant="h1">
              Centro de <span className="text-mx-green-700">Comando</span>
            </Typography>
          </div>
          <Typography
            variant="caption"
            className="pl-mx-md uppercase tracking-widest font-black"
          >
            GESTÃO DE UNIDADE • CICLO OPERACIONAL MX
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
          <TabNavPill
            tabs={rotinaTabs}
            activeTab={tab}
            onTabChange={onTabChange}
            buttonClassName="h-mx-10 px-8"
            className="mr-4"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            aria-label="Atualizar"
            className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm bg-white"
          >
            <RefreshCw size={20} className={cn(isRefetching && 'animate-spin')} />
          </Button>
        </div>
      </header>

      {!isAdmin && membership?.store?.name && (
        <Card className="border border-border-default bg-white p-mx-md shadow-mx-sm">
          <div className="flex flex-col gap-mx-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-mx-sm">
              <Store size={18} className="text-brand-primary" aria-hidden="true" />
              <Typography variant="p" className="font-black uppercase">
                Unidade atual: {membership.store.name}
              </Typography>
            </div>
            <Typography
              variant="tiny"
              tone="muted"
              className="font-black uppercase tracking-widest"
            >
              Contexto vindo do seu vínculo de gerente
            </Typography>
          </div>
        </Card>
      )}
    </>
  )
}

export default RotinaHeader
