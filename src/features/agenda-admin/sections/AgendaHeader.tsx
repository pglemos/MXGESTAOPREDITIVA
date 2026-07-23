import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Popover from '@radix-ui/react-popover'
import {
  Ban, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  Filter, List, Plus, RefreshCw, Users, X
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import type { AgendaConsultant, DateFilter } from '@/hooks/agenda'
import { statusFilters } from '../data/agendaFilters'
import { AgendaSearchBar } from '../components/AgendaSearchBar'
import type { AdminCalendarViewMode } from './AgendaFiltersBar'

interface AgendaHeaderProps {
  monthLabel: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onTodayClick: () => void
  calendarViewMode: AdminCalendarViewMode
  setCalendarViewMode: (mode: AdminCalendarViewMode) => void
  dateFilter: DateFilter
  setDateFilter: (filter: DateFilter) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onCreateVisit: () => void
  onCreateEvent: () => void
  onCreateBlock: () => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  consultantFilter: string
  setConsultantFilter: (consultantId: string) => void
  activeFilters: number
  clearFilters: () => void
  consultants: AgendaConsultant[]
  canViewAllAgendas: boolean
}

const VIEW_OPTIONS: { key: AdminCalendarViewMode; label: string }[] = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'list', label: 'Lista' },
]

export function AgendaHeader({
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onTodayClick,
  calendarViewMode,
  setCalendarViewMode,
  dateFilter,
  setDateFilter,
  searchQuery,
  onSearchChange,
  onRefresh,
  onCreateVisit,
  onCreateEvent,
  onCreateBlock,
  statusFilter,
  setStatusFilter,
  consultantFilter,
  setConsultantFilter,
  activeFilters,
  clearFilters,
  consultants,
  canViewAllAgendas,
}: AgendaHeaderProps) {
  const handleViewModeChange = (mode: AdminCalendarViewMode) => {
    setCalendarViewMode(mode)
    if (mode === 'day') setDateFilter('hoje')
    else if (mode === 'week') setDateFilter('semana')
    else if (mode === 'month') setDateFilter('mes')
    else if (mode === 'list') setDateFilter('todos')
  }

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border-strong pb-3 bg-white select-none">
      {/* Unified Main Navigation Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section: Title & Date Navigation Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Brand Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mx-lg bg-brand-primary text-white shadow-xs">
              <CalendarDays size={19} />
            </div>
            <Typography variant="h1" className="text-xl font-extrabold tracking-tight text-text-primary">
              Agenda
            </Typography>
          </div>

          <div className="h-5 w-px bg-border-default hidden sm:block" />

          {/* Date Navigation (< Hoje > Month Name) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTodayClick}
              className="rounded-mx-lg border border-border-strong bg-white px-2.5 py-1 text-xs font-bold text-text-primary hover:bg-surface-alt transition-colors shadow-2xs"
            >
              Hoje
            </button>
            <div className="flex items-center">
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Anterior"
                className="flex h-7 w-7 items-center justify-center rounded-mx-md text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                aria-label="Próximo"
                className="flex h-7 w-7 items-center justify-center rounded-mx-md text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="text-sm font-bold text-text-primary capitalize min-w-[140px]">
              {monthLabel}
            </span>
          </div>
        </div>

        {/* Right Section: Search, View Mode, Filters, Refresh, Create Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <AgendaSearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />

          {/* View Mode Segmented Control */}
          <div className="flex rounded-mx-lg border border-border-strong bg-surface-alt/60 p-0.5 shrink-0">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => handleViewModeChange(option.key)}
                aria-pressed={calendarViewMode === option.key}
                className={cn(
                  'flex items-center gap-1 rounded-mx-md px-2.5 py-1 text-xs font-bold transition-all',
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

          {/* Advanced Filters Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Filtros avançados"
                className={cn(
                  'relative flex h-8 items-center gap-1.5 rounded-mx-lg border px-2.5 text-xs font-bold transition-colors',
                  activeFilters > 0
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-border-strong bg-white text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                )}
              >
                <Filter size={14} />
                <span className="hidden sm:inline">Filtros</span>
                {activeFilters > 0 && (
                  <Badge variant="brand" className="h-4 min-w-4 rounded-full p-0 text-[10px] items-center justify-center">
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
                      <label htmlFor="agenda-consultant-select" className="block text-xs font-semibold text-text-secondary mb-1">
                        Consultor
                      </label>
                      <Select
                        id="agenda-consultant-select"
                        value={consultantFilter}
                        onChange={(e) => setConsultantFilter(e.target.value)}
                        className="!h-8 !rounded-mx-lg text-xs"
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
                      Status da Visita
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

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            aria-label="Atualizar"
            className="h-8 w-8 shrink-0 rounded-mx-lg bg-white border-border-strong"
          >
            <RefreshCw size={14} />
          </Button>

          {/* Create Button */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="h-8 rounded-mx-lg bg-brand-primary px-3 font-bold text-xs text-white shadow-xs hover:bg-brand-primary/90">
                <Plus size={15} className="mr-1" />
                Criar
                <ChevronDown size={13} className="ml-1 opacity-80" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-[90] w-52 rounded-mx-xl border border-border-strong bg-white p-1.5 shadow-xl animate-in fade-in-80"
              >
                <DropdownMenu.Item
                  onSelect={onCreateVisit}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt"
                >
                  <Plus size={15} className="text-brand-primary" /> Agendar Visita
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={onCreateEvent}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt"
                >
                  <Users size={15} className="text-status-info" /> Evento / Aula
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
                <DropdownMenu.Item
                  onSelect={onCreateBlock}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt text-status-error"
                >
                  <Ban size={15} /> Bloquear Agenda
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  )
}
