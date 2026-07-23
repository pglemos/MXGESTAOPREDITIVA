import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Ban, CalendarDays, ChevronDown, Plus, RefreshCw, Users } from 'lucide-react'
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
            Agendamentos e visitas de consultoria
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

        <div className="flex w-full items-center gap-mx-xs sm:w-auto sm:justify-end">
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Atualizar" className="shrink-0 rounded-mx-lg bg-white">
            <RefreshCw size={18} />
          </Button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="min-w-0 flex-1 rounded-mx-lg bg-brand-secondary px-4 sm:flex-none">
                <Plus size={18} className="mr-2" />
                Criar
                <ChevronDown size={14} className="ml-2 opacity-70" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-[90] w-56 rounded-mx-lg border border-border-strong bg-white p-1 shadow-mx-lg"
              >
                <DropdownMenu.Item
                  onSelect={onCreateVisit}
                  className="flex cursor-pointer items-center gap-mx-xs rounded-mx-md px-3 py-2 text-sm font-semibold text-text-primary outline-none transition-colors data-[highlighted]:bg-surface-alt"
                >
                  <Plus size={16} className="text-brand-primary" /> Agendar visita
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={onCreateEvent}
                  className="flex cursor-pointer items-center gap-mx-xs rounded-mx-md px-3 py-2 text-sm font-semibold text-text-primary outline-none transition-colors data-[highlighted]:bg-surface-alt"
                >
                  <Users size={16} className="text-status-info" /> Evento / aula
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
                <DropdownMenu.Item
                  onSelect={onCreateBlock}
                  className="flex cursor-pointer items-center gap-mx-xs rounded-mx-md px-3 py-2 text-sm font-semibold text-text-primary outline-none transition-colors data-[highlighted]:bg-surface-alt"
                >
                  <Ban size={16} className="text-status-error" /> Bloquear agenda
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  )
}
