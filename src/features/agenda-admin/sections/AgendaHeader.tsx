import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Ban, CalendarDays, ChevronDown, List, Plus, RefreshCw, Users, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { AgendaSearchBar } from '../components/AgendaSearchBar'
import type { AdminCalendarViewMode } from './AgendaFiltersBar'

interface AgendaHeaderProps {
  onRefresh: () => void
  onCreateVisit: () => void
  onCreateEvent: () => void
  onCreateBlock: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  calendarViewMode: AdminCalendarViewMode
  setCalendarViewMode: (mode: AdminCalendarViewMode) => void
}

const VIEW_OPTIONS: { key: AdminCalendarViewMode; label: string }[] = [
  { key: 'day', label: 'Dia' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'list', label: 'Lista' },
]

export function AgendaHeader({
  onRefresh,
  onCreateVisit,
  onCreateEvent,
  onCreateBlock,
  searchQuery,
  onSearchChange,
  calendarViewMode,
  setCalendarViewMode,
}: AgendaHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-border-strong pb-4 bg-white">
      {/* Top Title & Primary Actions Row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Brand & Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mx-xl bg-brand-primary text-white shadow-sm">
            <CalendarDays size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Typography variant="h1" className="text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
                Agenda MX
              </Typography>
            </div>
            <Typography variant="tiny" tone="muted" className="block text-xs font-medium">
              Gestão inteligente de agendamentos e visitas de consultoria
            </Typography>
          </div>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Search Input */}
          <AgendaSearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />

          {/* View Mode Switcher */}
          <div className="flex rounded-mx-lg border border-border-strong bg-surface-alt/40 p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCalendarViewMode(option.key)}
                aria-pressed={calendarViewMode === option.key}
                className={cn(
                  'flex items-center gap-1 rounded-mx-md px-3 py-1.5 text-xs font-bold transition-all',
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

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            aria-label="Atualizar agenda"
            className="h-9 w-9 shrink-0 rounded-mx-lg bg-white border-border-strong"
          >
            <RefreshCw size={16} />
          </Button>

          {/* Create Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="h-9 rounded-mx-lg bg-brand-primary px-4 font-bold text-xs text-white shadow-sm hover:bg-brand-primary/90">
                <Plus size={16} className="mr-1.5" />
                Criar Novo
                <ChevronDown size={14} className="ml-1.5 opacity-80" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-[90] w-56 rounded-mx-xl border border-border-strong bg-white p-1.5 shadow-xl animate-in fade-in-80"
              >
                <DropdownMenu.Item
                  onSelect={onCreateVisit}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt"
                >
                  <Plus size={16} className="text-brand-primary" /> Agendar Visita
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={onCreateEvent}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt"
                >
                  <Users size={16} className="text-status-info" /> Evento / Aula
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
                <DropdownMenu.Item
                  onSelect={onCreateBlock}
                  className="flex cursor-pointer items-center gap-2 rounded-mx-lg px-3 py-2 text-xs font-bold text-text-primary outline-none transition-colors hover:bg-surface-alt text-status-error"
                >
                  <Ban size={16} /> Bloquear Agenda
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  )
}
