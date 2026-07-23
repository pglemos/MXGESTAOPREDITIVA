import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Ban, CalendarDays, ChevronDown, Plus, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { AgendaSearchBar } from '../components/AgendaSearchBar'

interface AgendaHeaderProps {
  onRefresh: () => void
  onCreateVisit: () => void
  onCreateEvent: () => void
  onCreateBlock: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function AgendaHeader({
  onRefresh,
  onCreateVisit,
  onCreateEvent,
  onCreateBlock,
  searchQuery,
  onSearchChange,
}: AgendaHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border-strong pb-3 bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-mx-lg bg-brand-primary text-white shadow-xs">
            <CalendarDays size={20} />
          </div>
          <div>
            <Typography variant="h1" className="text-xl font-extrabold tracking-tight text-text-primary sm:text-2xl">
              Agenda MX
            </Typography>
            <Typography variant="tiny" tone="muted" className="block text-xs font-medium">
              Agendamentos e visitas de consultoria
            </Typography>
          </div>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Global Search Input */}
          <AgendaSearchBar searchQuery={searchQuery} onSearchChange={onSearchChange} />

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            aria-label="Atualizar agenda"
            className="h-9 w-9 shrink-0 rounded-mx-lg bg-white border-border-strong"
          >
            <RefreshCw size={15} />
          </Button>

          {/* Create Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="h-9 rounded-mx-lg bg-brand-primary px-3.5 font-bold text-xs text-white shadow-xs hover:bg-brand-primary/90">
                <Plus size={16} className="mr-1.5" />
                Criar Novo
                <ChevronDown size={14} className="ml-1.5 opacity-80" />
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
