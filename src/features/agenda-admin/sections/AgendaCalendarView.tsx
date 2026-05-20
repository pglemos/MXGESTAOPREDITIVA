import { AgendaCalendar } from '@/components/organisms/AgendaCalendar'
import { getVisitDotColor } from '../data/agendaHelpers'
import type { DateFilter } from '@/hooks/agenda'

interface AgendaCalendarViewProps {
  calendarDays: React.ComponentProps<typeof AgendaCalendar>['calendarDays']
  visitsByDate: React.ComponentProps<typeof AgendaCalendar>['visitsByDate']
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  monthLabel: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onTodayClick: () => void
  calendarViewMode: 'day' | 'week' | 'month'
  dateFilter: DateFilter
}

export function AgendaCalendarView({
  calendarDays, visitsByDate, selectedDate, onDateSelect,
  monthLabel, onPrevMonth, onNextMonth, onTodayClick,
  calendarViewMode, dateFilter,
}: AgendaCalendarViewProps) {
  return (
    <AgendaCalendar
      calendarDays={calendarDays}
      visitsByDate={visitsByDate}
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
      monthLabel={monthLabel}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      onToday={onTodayClick}
      getVisitDotColor={getVisitDotColor}
      viewMode={calendarViewMode}
      showNavigation={calendarViewMode === 'month'}
      showTodayButton={dateFilter !== 'hoje'}
    />
  )
}
