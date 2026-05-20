import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { PageHeader } from '@/components/molecules/PageHeader'
import { cn } from '@/lib/utils'
import { metricCards } from '../data/agendaFilters'

type Metrics = {
  total: number
  agendadas: number
  emAndamento: number
  concluidas: number
  canceladas: number
}

interface AgendaHeaderProps {
  metrics: Metrics
  onRefresh: () => void
  onCreateVisit: () => void
  onCreateEvent: () => void
}

export function AgendaHeader({ metrics, onRefresh, onCreateVisit, onCreateEvent }: AgendaHeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-mx-md sm:gap-mx-lg border-b border-border-default pb-mx-lg sm:pb-8 shrink-0">
      <PageHeader
        title="Agenda MX"
        description="AGENDAMENTOS E VISITAS DE CONSULTORIA"
        className="min-w-0"
      />

      <div className="flex w-full flex-col gap-mx-sm lg:w-auto">
        <div className="grid w-full grid-cols-2 gap-mx-xs sm:grid-cols-3 xl:grid-cols-5 lg:w-auto">
          {metricCards.map((metric, index) => (
            <Card
              key={metric.key}
              className={cn(
                'min-w-0 p-mx-sm sm:p-mx-md border border-border-default shadow-none bg-white text-center',
                index === 0 && 'col-span-2 sm:col-span-1',
              )}
            >
              <Typography variant="tiny" tone="muted" className="block text-mx-micro leading-tight tracking-widest">
                {metric.label}
              </Typography>
              <Typography variant="h2" className={cn('mt-1 text-2xl sm:text-3xl', metric.className)}>
                {metrics[metric.valueKey]}
              </Typography>
            </Card>
          ))}
        </div>

        <div className="grid w-full grid-cols-[auto_1fr] gap-mx-xs sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-mx-sm">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Atualizar" className="rounded-mx-xl bg-white">
            <RefreshCw size={18} />
          </Button>

          <Button className="bg-brand-secondary min-w-0 px-4" onClick={onCreateVisit}>
            <Plus size={18} className="mr-2" />
            AGENDAR VISITA
          </Button>
          <Button variant="outline" className="col-span-2 bg-white min-w-0 px-4 sm:col-span-1" onClick={onCreateEvent}>
            <Plus size={18} className="mr-2" />
            EVENTO/AULA
          </Button>
        </div>
      </div>
    </header>
  )
}
