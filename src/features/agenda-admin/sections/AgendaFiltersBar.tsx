import { CalendarDays, Filter, User } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Select } from '@/components/atoms/Select'
import { FilterBar } from '@/components/molecules/FilterBar'
import { cn } from '@/lib/utils'
import type { AgendaConsultant, DateFilter } from '@/hooks/agenda'
import { dateFilters, statusFilters } from '../data/agendaFilters'

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
}

export function AgendaFiltersBar({
  dateFilter, setDateFilter,
  statusFilter, setStatusFilter,
  consultantFilter, setConsultantFilter,
  activeFilters, clearFilters,
  consultants, canViewAllAgendas,
}: AgendaFiltersBarProps) {
  return (
    <Card className="p-mx-sm sm:p-mx-md border border-border-default shadow-none bg-white rounded-mx-2xl">
      <div className="flex flex-col gap-mx-sm">
        <FilterBar label="Período" icon={<CalendarDays size={16} className="text-brand-primary" />}>
          {dateFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setDateFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-mx-full text-xs font-black uppercase tracking-widest transition-all',
                dateFilter === f.key
                  ? 'bg-brand-primary text-white shadow-mx-sm'
                  : 'bg-white border border-border-default text-text-secondary hover:bg-surface-alt'
              )}
            >
              {f.label}
            </button>
          ))}
        </FilterBar>
        {canViewAllAgendas && (
          <FilterBar label="Consultor" icon={<User size={16} className="text-brand-primary" />}>
            <div className="w-full sm:w-mx-64">
              <Select
                id="agenda-consultant-filter"
                value={consultantFilter}
                onChange={(event) => setConsultantFilter(event.target.value)}
                className="!h-mx-10 !py-1.5 text-xs uppercase tracking-widest"
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
        <FilterBar label="Status" icon={<Filter size={16} className="text-brand-primary" />}>
          {statusFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-mx-full text-xs font-black uppercase tracking-widest transition-all',
                statusFilter === f.key
                  ? 'bg-brand-primary text-white shadow-mx-sm'
                  : 'bg-white border border-border-default text-text-secondary hover:bg-surface-alt'
              )}
            >
              {f.label}
            </button>
          ))}
          {activeFilters > 0 && (
            <>
              <Badge variant="brand" className="ml-mx-xs text-mx-micro font-black uppercase">
                {activeFilters} {activeFilters === 1 ? 'filtro' : 'filtros'}
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-mx-10 px-3 text-xs font-black uppercase">
                LIMPAR
              </Button>
            </>
          )}
        </FilterBar>
      </div>
    </Card>
  )
}
