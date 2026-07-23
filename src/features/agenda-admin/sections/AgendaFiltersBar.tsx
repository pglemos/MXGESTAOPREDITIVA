import { CalendarDays, Filter, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { cn } from '@/lib/utils'
import type { AgendaConsultant, DateFilter } from '@/hooks/agenda'
import type { CalendarViewMode } from '@/components/organisms/AgendaCalendar'
import { dateFilters, statusFilters } from '../data/agendaFilters'

export type AdminCalendarViewMode = CalendarViewMode | 'list'

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
}: AgendaFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-1">
      {/* Date Period Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-text-tertiary pr-2 shrink-0">
          <CalendarDays size={14} className="text-brand-primary" />
          <span>Período:</span>
        </div>
        {dateFilters.map((f) => {
          const isActive = dateFilter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setDateFilter(f.key)}
              className={cn(
                'rounded-mx-lg px-3 py-1 text-xs font-semibold shrink-0 transition-all',
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

      {/* Active Filters Summary & Reset */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="brand" className="text-xs font-semibold px-2 py-0.5">
            <Filter size={12} className="mr-1" />
            {activeFilters} filtro{activeFilters > 1 ? 's' : ''} ativo{activeFilters > 1 ? 's' : ''}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs font-semibold text-text-tertiary hover:text-text-primary"
          >
            <X size={13} className="mr-1" /> Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
