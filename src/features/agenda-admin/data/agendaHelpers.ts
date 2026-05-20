import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AgendaScheduleEvent } from '@/hooks/agenda'

export function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

export function getVisitDotColor(status: string) {
  switch (status) {
    case 'agendada': return 'bg-brand-primary'
    case 'em_andamento': return 'bg-status-info'
    case 'concluida': return 'bg-status-success'
    case 'cancelada': return 'bg-status-error'
    default: return 'bg-text-tertiary'
  }
}

export function getEventTypeLabel(type: AgendaScheduleEvent['event_type']) {
  switch (type) {
    case 'aula': return 'AULA'
    case 'evento_online': return 'EVENTO ONLINE'
    case 'evento_presencial': return 'EVENTO PRESENCIAL'
    case 'bloqueio': return 'BLOQUEIO'
    default: return 'EVENTO'
  }
}
