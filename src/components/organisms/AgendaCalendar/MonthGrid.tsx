import { addDays, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { AgendaEventCompactChip } from './AgendaEventCard'
import type { CalendarAgendaItem, CalendarDay } from './types'

const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, index) =>
  format(addDays(weekStart, index), 'EEE', { locale: ptBR }).toUpperCase(),
)

interface MonthGridProps {
  days: CalendarDay[]
  visitsByDate: Record<string, CalendarAgendaItem[]>
  getVisitDotColor: (status: string) => string
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  onDateClick?: (date: Date) => void
  onEventClick?: (item: CalendarAgendaItem) => void
}

export function MonthGrid({
  days,
  visitsByDate,
  getVisitDotColor,
  selectedDate,
  onDateSelect,
  onDateClick,
  onEventClick,
}: MonthGridProps) {
  return (
    <div className="overflow-hidden rounded-mx-lg border border-border-strong bg-white">
      <div className="grid grid-cols-7 border-b border-border-strong bg-white">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="border-r border-border-default py-mx-xs text-center last:border-r-0 sm:py-mx-sm">
            <Typography variant="tiny" tone="muted" className="text-[10px] font-semibold uppercase tracking-normal">{label}</Typography>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((dayInfo) => {
          const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
          const dayVisits = [...(visitsByDate[dateKey] || [])].sort(
            (a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
          )
          const hasVisits = dayVisits.length > 0
          const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
          const isTodayDate = isToday(dayInfo.date)

          return (
            <div
              key={dateKey}
              role="button"
              tabIndex={0}
              onClick={() => {
                onDateSelect(dayInfo.isCurrentMonth ? dayInfo.date : null)
                if (dayInfo.isCurrentMonth) onDateClick?.(dayInfo.date)
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onDateSelect(dayInfo.isCurrentMonth ? dayInfo.date : null)
                if (dayInfo.isCurrentMonth) onDateClick?.(dayInfo.date)
              }}
              className={cn(
                'relative flex min-h-mx-24 flex-col items-start gap-mx-xs border-b border-r border-border-subtle p-mx-xs text-left transition-colors overflow-hidden sm:min-h-mx-32',
                !dayInfo.isCurrentMonth && 'bg-surface-alt/60 text-text-tertiary',
                dayInfo.isCurrentMonth && 'hover:bg-surface-alt cursor-pointer',
                isSelected && 'bg-mx-green-50 ring-1 ring-brand-primary/30 ring-inset',
                isTodayDate && !isSelected && 'bg-mx-green-50/50',
              )}
            >
              <span className={cn(
                'flex h-mx-lg min-w-mx-lg items-center justify-center rounded-mx-full px-2 text-xs font-semibold',
                isTodayDate && 'bg-brand-primary text-white',
                !isTodayDate && dayInfo.isCurrentMonth && 'text-text-primary',
                !dayInfo.isCurrentMonth && 'text-text-tertiary',
              )}>
                {dayInfo.day}
              </span>

              {hasVisits && (
                <div className="flex w-full flex-col gap-mx-tiny">
                  {dayVisits.slice(0, 3).map((item) => (
                    <AgendaEventCompactChip
                      key={`${item.kind}-${item.id}`}
                      item={item}
                      getVisitDotColor={getVisitDotColor}
                      onOpen={() => onEventClick?.(item)}
                    />
                  ))}
                  {dayVisits.length > 3 && (
                    <Typography variant="tiny" className="px-1 text-[11px] font-semibold leading-none text-text-secondary">
                      +{dayVisits.length - 3} mais
                    </Typography>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
