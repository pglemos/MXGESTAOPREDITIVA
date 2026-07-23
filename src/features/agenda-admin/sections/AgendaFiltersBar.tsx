import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, Filter, List, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
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
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  consultantFilter,
  setConsultantFilter,
  activeFilters,
  clearFilters,
  consultants,
  canViewAllAgendas,
  calendarViewMode,
  setCalendarViewMode,
}: AgendaFiltersBarProps) {
  const handleViewModeChange = (mode: AdminCalendarViewMode) => {
    setCalendarViewMode(mode)
    if (mode === 'day') setDateFilter('hoje')
    else if (mode === 'week') setDateFilter('semana')
    else if (mode === 'month') setDateFilter('mes')
    else if (mode === 'list') setDateFilter('todos')
  }

  const handlePeriodChange = (filter: DateFilter) => {
    setDateFilter(filter)
    if (filter === 'hoje') setCalendarViewMode('day')
    else if (filter === 'semana' || filter === 'proxima_semana') setCalendarViewMode('week')
    else if (filter === 'mes') setCalendarViewMode('month')
    else if (filter === 'todos') setCalendarViewMode('list')
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      {/* Left: View Mode Segment & Period Filters */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
        {/* View Mode Switcher */}
        <div className="flex rounded-mx-lg border border-border-strong bg-surface-alt/50 p-1 shrink-0">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleViewModeChange(option.key)}
              aria-pressed={calendarViewMode === option.key}
              className={cn(
                'flex items-center gap-1 rounded-mx-md px-3 py-1 text-xs font-bold transition-all',
                calendarViewMode === option.key
                  ? 'bg-brand-primary text-white shadow-2xs'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              )}
            >
              {option.key === 'list' && <List size={13} />}
              {option.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border-default hidden sm:block" />

        {/* Date Period Filter Pills */}
        <div className="flex items-center gap-1 shrink-0">
          <CalendarDays size={14} className="text-brand-primary mr-1" />
          {dateFilters.map((f) => {
            const isActive = dateFilter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handlePeriodChange(f.key)}
                className={cn(
                  'rounded-mx-lg px-2.5 py-1 text-xs font-semibold shrink-0 transition-all',
                  isActive
                    ? 'bg-brand-primary text-white shadow-2xs'
                    : 'border border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Additional Filters (Consultant, Status) & Clear */}
      <div className="flex items-center gap-2">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Filtros avançados"
              className={cn(
                'relative flex h-8 items-center gap-1.5 rounded-mx-lg border px-3 text-xs font-semibold transition-colors',
                activeFilters > 0
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              )}
            >
              <Filter size={14} />
              <span>Filtros</span>
              {activeFilters > 0 && (
                <Badge variant="brand" className="ml-1 h-4 min-w-4 rounded-full p-0 text-[10px] items-center justify-center">
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
              className="z-[90] w-72 rounded-mx-xl border border-border-strong bg-white p-4 shadow-xl animate-in fade-in-80"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Filtros Avançados
                  </span>
                  {activeFilters > 0 && (
                    <button type="button" onClick={clearFilters} className="text-xs text-brand-primary font-semibold hover:underline">
                      Limpar
                    </button>
                  )}
                </div>

                {canViewAllAgendas && (
                  <div>
                    <label htmlFor="agenda-consultant-filter" className="block text-xs font-semibold text-text-secondary mb-1">
                      Consultor
                    </label>
                    <Select
                      id="agenda-consultant-filter"
                      value={consultantFilter}
                      onChange={(event) => setConsultantFilter(event.target.value)}
                      className="!h-9 !rounded-mx-lg text-xs"
                      aria-label="Filtrar por consultor"
                    >
                      <option value="todos">Todos os consultores</option>
                      {consultants.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <span className="block text-xs font-semibold text-text-secondary mb-1">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {statusFilters.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setStatusFilter(f.key)}
                        className={cn(
                          'rounded-mx-md px-2.5 py-1 text-xs font-medium transition-colors',
                          statusFilter === f.key
                            ? 'bg-brand-primary text-white font-bold'
                            : 'border border-border-strong bg-white text-text-secondary hover:bg-surface-alt',
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {activeFilters > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs font-semibold text-text-tertiary hover:text-text-primary"
          >
            <X size={13} className="mr-1" /> Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
