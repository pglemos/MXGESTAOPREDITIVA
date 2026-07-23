import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, Filter, List } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Select } from '@/components/atoms/Select'
import { FilterBar } from '@/components/molecules/FilterBar'
import { cn } from '@/lib/utils'
import type { AgendaConsultant, DateFilter } from '@/hooks/agenda'
import type { CalendarViewMode } from '@/components/organisms/AgendaCalendar'
import { dateFilters, statusFilters } from '../data/agendaFilters'

export type AdminCalendarViewMode = CalendarViewMode | 'list'

const VIEW_OPTIONS: { key: AdminCalendarViewMode; label: string }[] = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'list', label: 'Lista' },
]

interface AgendaFiltersBarProps {
  dateFilter: DateFilter
  setDateFilter: (value: DateFilter) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  consultantFilter: string
  setConsultantFilter: (value: string) => void
  activeFilters: number
  clearFilters: () => void
  consultants: AgendaConsultant[]
  canViewAllAgendas: boolean
  calendarViewMode: AdminCalendarViewMode
  setCalendarViewMode: (value: AdminCalendarViewMode) => void
}

export function AgendaFiltersBar({
  dateFilter, setDateFilter,
  statusFilter, setStatusFilter,
  consultantFilter, setConsultantFilter,
  activeFilters, clearFilters,
  consultants, canViewAllAgendas,
  calendarViewMode, setCalendarViewMode,
}: AgendaFiltersBarProps) {
  return (
    <Card className="rounded-mx-lg border border-border-strong bg-white p-mx-sm shadow-none sm:p-mx-md">
      <div className="flex flex-col gap-mx-sm">
        <div className="flex flex-wrap items-center justify-between gap-mx-sm">
          <FilterBar label="Período" icon={<CalendarDays size={16} className="text-brand-primary" />}>
            {dateFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setDateFilter(f.key)}
                className={cn(
                  'rounded-mx-lg px-3 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors',
                  dateFilter === f.key
                    ? 'bg-brand-primary text-white'
                    : 'border border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary'
                )}
              >
                {f.label}
              </button>
            ))}
          </FilterBar>

          <div className="flex items-center gap-mx-xs">
            <div className="flex rounded-mx-lg border border-border-strong bg-white p-0.5">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCalendarViewMode(option.key)}
                  aria-pressed={calendarViewMode === option.key}
                  className={cn(
                    'flex items-center gap-1 rounded-mx-md px-2.5 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors',
                    calendarViewMode === option.key
                      ? 'bg-brand-primary text-white'
                      : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                  )}
                >
                  {option.key === 'list' && <List size={13} />}
                  {option.label}
                </button>
              ))}
            </div>

            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Filtros de status e consultor"
                  className={cn(
                    'relative flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-lg border transition-colors',
                    activeFilters > 0
                      ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                      : 'border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                  )}
                >
                  <Filter size={16} />
                  {activeFilters > 0 && (
                    <Badge variant="brand" className="absolute -right-1 -top-1 h-mx-5 min-w-mx-5 items-center justify-center rounded-mx-full p-0 text-[9px]">
                      {activeFilters}
                    </Badge>
                  )}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="z-[90] w-80 rounded-mx-lg border border-border-strong bg-white p-mx-md shadow-mx-lg"
                >
                  <div className="flex flex-col gap-mx-sm">
                    {canViewAllAgendas && (
                      <FilterBar label="Consultor" icon={undefined}>
                        <div className="w-full">
                          <Select
                            id="agenda-consultant-filter"
                            value={consultantFilter}
                            onChange={(event) => setConsultantFilter(event.target.value)}
                            className="!h-mx-10 !rounded-mx-lg !py-1.5 text-xs font-semibold normal-case tracking-normal"
                            aria-label="Filtrar por consultor"
                          >
                            <option value="todos">Todos</option>
                            {consultants.map((consultant) => (
                              <option key={consultant.id} value={consultant.id}>{consultant.name}</option>
                            ))}
                          </Select>
                        </div>
                      </FilterBar>
                    )}
                    <FilterBar label="Status" icon={undefined}>
                      <div className="flex flex-wrap gap-mx-xs">
                        {statusFilters.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => setStatusFilter(f.key)}
                            className={cn(
                              'rounded-mx-lg px-3 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors',
                              statusFilter === f.key
                                ? 'bg-brand-primary text-white'
                                : 'border border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary'
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </FilterBar>
                    {activeFilters > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="self-start text-xs font-semibold normal-case">
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>
      </div>
    </Card>
  )
}
