import { Ban, CalendarDays, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
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
  onCreateBlock: () => void
}

export function AgendaHeader({ metrics, onRefresh, onCreateVisit, onCreateEvent, onCreateBlock }: AgendaHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-mx-md border-b border-border-strong pb-mx-md lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-mx-sm">
        <div className="flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-lg bg-brand-primary text-white">
          <CalendarDays size={20} />
        </div>
        <div className="min-w-0">
          <Typography variant="h1" className="truncate text-2xl font-semibold tracking-normal text-text-primary sm:text-3xl">
            Agenda MX
          </Typography>
          <Typography variant="tiny" tone="muted" className="block text-xs font-medium normal-case tracking-normal">
            Agendamentos, visitas e eventos sincronizados
          </Typography>
        </div>
      </div>

      <div className="flex w-full flex-col gap-mx-sm lg:w-auto lg:items-end">
        <div className="flex w-full gap-mx-xs overflow-x-auto pb-1 lg:w-auto lg:pb-0">
          {metricCards.map((metric) => (
            <div
              key={metric.key}
              className="flex min-w-max items-center gap-mx-xs rounded-mx-lg border border-border-strong bg-white px-3 py-1.5"
            >
              <Typography variant="tiny" tone="muted" className="text-[10px] font-semibold normal-case tracking-normal">
                {metric.label}
              </Typography>
              <span className={cn('font-mono-numbers text-sm font-semibold', metric.className)}>
                {metrics[metric.valueKey]}
              </span>
            </div>
          ))}
        </div>

        <div className="grid w-full grid-cols-[auto_1fr] gap-mx-xs sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-mx-sm">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Atualizar" className="rounded-mx-lg bg-white">
            <RefreshCw size={18} />
          </Button>

          <Button className="min-w-0 rounded-mx-lg bg-brand-secondary px-4" onClick={onCreateVisit}>
            <Plus size={18} className="mr-2" />
            Agendar visita
          </Button>
          <Button variant="outline" className="col-span-2 min-w-0 rounded-mx-lg bg-white px-4 sm:col-span-1" onClick={onCreateBlock}>
            <Ban size={18} className="mr-2" />
            Bloquear agenda
          </Button>
          <Button variant="outline" className="col-span-2 min-w-0 rounded-mx-lg bg-white px-4 sm:col-span-1" onClick={onCreateEvent}>
            <Plus size={18} className="mr-2" />
            Evento/aula
          </Button>
        </div>
      </div>
    </header>
  )
}
