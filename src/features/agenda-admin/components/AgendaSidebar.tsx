import { useState } from 'react'
import { Calendar, Users, CheckCircle2, Clock, PlayCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgendaConsultant } from '@/hooks/agenda'
import { MiniCalendar } from './MiniCalendar'

type Metrics = {
  total: number
  agendadas: number
  emAndamento: number
  concluidas: number
  canceladas: number
}

interface AgendaSidebarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  hasEventsOnDate?: (date: Date) => boolean
  consultants: AgendaConsultant[]
  consultantFilter: string
  onConsultantChange: (consultantId: string) => void
  statusFilter: string
  onStatusChange: (status: string) => void
  metrics: Metrics
  canViewAllAgendas: boolean
}

export function AgendaSidebar({
  selectedDate,
  onDateSelect,
  hasEventsOnDate,
  consultants,
  consultantFilter,
  onConsultantChange,
  statusFilter,
  onStatusChange,
  metrics,
  canViewAllAgendas,
}: AgendaSidebarProps) {
  const [consultantsExpanded, setConsultantsExpanded] = useState(true)

  const statusOptions = [
    { key: 'todos', label: 'Todas', count: metrics.total, color: 'bg-text-tertiary', icon: Calendar },
    { key: 'agendada', label: 'Agendadas', count: metrics.agendadas, color: 'bg-brand-primary', icon: Clock },
    { key: 'em_andamento', label: 'Em Andamento', count: metrics.emAndamento, color: 'bg-status-warning', icon: PlayCircle },
    { key: 'concluida', label: 'Concluídas', count: metrics.concluidas, color: 'bg-status-success', icon: CheckCircle2 },
    { key: 'cancelada', label: 'Canceladas', count: metrics.canceladas, color: 'bg-status-error', icon: XCircle },
  ]

  return (
    <div className="flex flex-col gap-3 w-full lg:w-56 shrink-0">
      {/* Interactive Mini Calendar */}
      <MiniCalendar
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        hasEventsOnDate={hasEventsOnDate}
      />

      {/* Status Filters - Compact */}
      <div className="rounded-mx-xl border border-border-strong bg-white p-3 shadow-sm">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2">
          Status
        </h4>
        <div className="flex flex-wrap gap-1">
          {statusOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = statusFilter === opt.key

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onStatusChange(opt.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-mx-md px-2 py-1 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-brand-primary text-white font-bold shadow-2xs'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                )}
              >
                <Icon size={12} className={isActive ? 'text-white' : 'text-text-tertiary'} />
                <span>{opt.label}</span>
                <span
                  className={cn(
                    'px-1 py-0.5 rounded-full text-[9px] font-mono font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-alt text-text-secondary',
                  )}
                >
                  {opt.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Consultant Filter - Collapsible */}
      {canViewAllAgendas && consultants.length > 0 && (
        <div className="rounded-mx-xl border border-border-strong bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setConsultantsExpanded(!consultantsExpanded)}
            className="flex w-full items-center justify-between mb-2"
          >
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
              <Users size={12} /> Consultores
            </h4>
            {consultantsExpanded ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
          </button>

          {consultantsExpanded && (
            <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => onConsultantChange('todos')}
                className={cn(
                  'flex w-full items-center px-2 py-1.5 rounded-mx-lg text-[11px] font-medium transition-colors',
                  consultantFilter === 'todos'
                    ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                )}
              >
                Todos
              </button>

              {consultants.map((c) => {
                const isSelected = consultantFilter === c.id

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onConsultantChange(c.id)}
                    className={cn(
                      'flex w-full items-center gap-1.5 px-2 py-1.5 rounded-mx-lg text-[11px] font-medium transition-colors text-left truncate',
                      isSelected
                        ? 'bg-brand-primary text-white font-bold shadow-2xs'
                        : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                        isSelected ? 'bg-white text-brand-primary' : 'bg-brand-primary/10 text-brand-primary',
                      )}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
