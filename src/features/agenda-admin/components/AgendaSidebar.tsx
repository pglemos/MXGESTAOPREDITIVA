import { Calendar, Users, CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react'
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
  const statusOptions = [
    { key: 'todas', label: 'Todas', count: metrics.total, color: 'bg-text-tertiary', icon: Calendar },
    { key: 'agendada', label: 'Agendadas', count: metrics.agendadas, color: 'bg-brand-primary', icon: Clock },
    { key: 'em_andamento', label: 'Em Andamento', count: metrics.emAndamento, color: 'bg-status-warning', icon: PlayCircle },
    { key: 'concluida', label: 'Concluídas', count: metrics.concluidas, color: 'bg-status-success', icon: CheckCircle2 },
    { key: 'cancelada', label: 'Canceladas', count: metrics.canceladas, color: 'bg-status-error', icon: XCircle },
  ]

  return (
    <div className="flex flex-col gap-4 w-full lg:w-64 shrink-0 select-none">
      {/* Interactive Mini Calendar */}
      <MiniCalendar
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        hasEventsOnDate={hasEventsOnDate}
      />

      {/* Metrics & Status Filters */}
      <div className="rounded-mx-xl border border-border-strong bg-white p-3 shadow-sm">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-2 px-1">
          Status dos Agendamentos
        </h4>
        <div className="space-y-1">
          {statusOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = statusFilter === opt.key

            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onStatusChange(opt.key)}
                className={cn(
                  'flex w-full items-center justify-between px-2.5 py-1.5 rounded-mx-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-brand-primary text-white font-bold shadow-2xs'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isActive ? 'text-white' : 'text-text-tertiary'} />
                  <span>{opt.label}</span>
                </div>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold',
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

      {/* Consultant / Team Filter */}
      {canViewAllAgendas && consultants.length > 0 && (
        <div className="rounded-mx-xl border border-border-strong bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
              <Users size={13} /> Equipe de Consultores
            </h4>
            {consultantFilter !== 'todos' && (
              <button
                type="button"
                onClick={() => onConsultantChange('todos')}
                className="text-[10px] font-semibold text-brand-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
            <button
              type="button"
              onClick={() => onConsultantChange('todos')}
              className={cn(
                'flex w-full items-center justify-between px-2.5 py-1.5 rounded-mx-lg text-xs font-medium transition-colors',
                consultantFilter === 'todos'
                  ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              )}
            >
              <span>Todos os consultores</span>
            </button>

            {consultants.map((c) => {
              const isSelected = consultantFilter === c.id

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onConsultantChange(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-2.5 py-1.5 rounded-mx-lg text-xs font-medium transition-colors text-left truncate',
                    isSelected
                      ? 'bg-brand-primary text-white font-bold shadow-2xs'
                      : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
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
        </div>
      )}
    </div>
  )
}
