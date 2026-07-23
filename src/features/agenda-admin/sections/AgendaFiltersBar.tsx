import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import type { AgendaConsultant, DateFilter } from '@/hooks/agenda'
import type { CalendarViewMode } from '@/components/organisms/AgendaCalendar'

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
  activeFilters,
  clearFilters,
}: AgendaFiltersBarProps) {
  if (activeFilters === 0) return null

  return (
    <div className="flex items-center justify-between py-1 px-1 bg-brand-primary/5 rounded-mx-lg border border-brand-primary/10 my-1">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary">
        <Filter size={13} />
        <span>{activeFilters} filtro{activeFilters > 1 ? 's' : ''} ativo{activeFilters > 1 ? 's' : ''}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clearFilters}
        className="h-6 text-xs font-semibold text-brand-primary hover:bg-brand-primary/10"
      >
        <X size={12} className="mr-1" /> Limpar filtros
      </Button>
    </div>
  )
}
