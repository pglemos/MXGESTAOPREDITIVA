import { MessageSquare, RefreshCw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { PageHeader } from '@/components/molecules/PageHeader'
import { LastUpdated } from '@/components/molecules/LastUpdated'

interface VendedorHomeHeaderProps {
  firstName: string
  rankPosition: number | string
  lastUpdatedAt: Date | null
  isRefetching: boolean
  onShareWhatsApp: () => void
  onRefresh: () => void
}

/**
 * Cabeçalho do VendedorHome — saudação, ações (compartilhar/atualizar) e badge de ranking.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function VendedorHomeHeader({
  firstName,
  rankPosition,
  lastUpdatedAt,
  isRefetching,
  onShareWhatsApp,
  onRefresh,
}: VendedorHomeHeaderProps) {
  return (
    <PageHeader
      title={`Olá, ${firstName}`}
      description="Painel de performance individual"
      actions={
        <div className="flex flex-wrap items-center justify-end gap-mx-sm">
          <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
          <Button
            variant="outline"
            onClick={onShareWhatsApp}
            className="h-mx-12 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-status-success-surface text-status-success border-status-success/10 hover:bg-status-success hover:text-white transition-all px-mx-md"
            aria-label="Compartilhar no WhatsApp"
          >
            <MessageSquare size={18} />
            Compartilhar
          </Button>
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefetching}
            aria-label="Atualizar cockpit do vendedor"
            className="h-mx-12 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white border-border-default px-mx-md"
          >
            <RefreshCw size={18} className={cn(isRefetching && 'animate-spin')} />
            Atualizar
          </Button>
          <div className="flex items-center gap-mx-sm bg-white border border-border-default p-mx-xs px-6 rounded-mx-2xl sm:rounded-mx-3xl shadow-mx-sm h-mx-14">
            <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-status-warning text-white flex items-center justify-center shadow-mx-md">
              <Trophy size={16} className="fill-white/20" />
            </div>
            <div className="min-w-0">
              <Typography
                variant="tiny"
                tone="muted"
                className="mb-0 block uppercase font-black tracking-mx-wide text-mx-nano"
              >
                Ranking
              </Typography>
              <Typography
                variant="h3"
                className="text-sm sm:text-base font-black whitespace-nowrap uppercase leading-none"
              >
                {rankPosition}º LUGAR
              </Typography>
            </div>
          </div>
        </div>
      }
    />
  )
}

export default VendedorHomeHeader
