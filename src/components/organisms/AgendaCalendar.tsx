import { type ReactNode } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
}

export interface AgendaCalendarProps {
  calendarDays: CalendarDay[]
  visitsByDate: Record<string, { status: string }[]>
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
  onDateClick?: (date: Date) => void
  monthLabel: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  getVisitDotColor: (status: string) => string
  className?: string
}

export function AgendaCalendar({
  calendarDays,
  visitsByDate,
  selectedDate,
  onDateSelect,
  onDateClick,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onToday,
  getVisitDotColor,
  className,
}: AgendaCalendarProps) {
  return (
    <Card className={cn('border-none shadow-mx-md bg-white overflow-hidden', className)}>
      <div className="flex items-center justify-between p-mx-md border-b border-border-default">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-default transition-all"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-mx-sm">
          <Typography variant="h3" className="text-sm font-black uppercase tracking-widest capitalize">
            {monthLabel}
          </Typography>
          <button
            type="button"
            onClick={onToday}
            className="px-2 py-1 rounded-mx-md bg-brand-primary/10 text-brand-primary text-mx-micro font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
          >
            Hoje
          </button>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-default transition-all"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border-default">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-mx-sm text-center">
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{d}</Typography>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((dayInfo, idx) => {
          const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
          const dayVisits = visitsByDate[dateKey] || []
          const hasVisits = dayVisits.length > 0
          const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
          const isTodayDate = isToday(dayInfo.date)

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => {
                onDateSelect(dayInfo.isCurrentMonth ? dayInfo.date : null)
                if (dayInfo.isCurrentMonth) onDateClick?.(dayInfo.date)
              }}
              className={cn(
                'relative min-h-mx-4xl p-mx-xs flex flex-col items-center gap-mx-xs border-b border-r border-border-subtle transition-all',
                !dayInfo.isCurrentMonth && 'bg-surface-alt/50 opacity-40',
                dayInfo.isCurrentMonth && 'hover:bg-brand-primary/5',
                isSelected && 'bg-brand-primary/10 ring-2 ring-brand-primary ring-inset',
                isTodayDate && !isSelected && 'bg-brand-primary/5',
              )}
            >
              <span className={cn(
                'w-mx-lg h-mx-lg rounded-mx-full flex items-center justify-center text-xs font-black',
                isTodayDate && 'bg-brand-primary text-white',
                !isTodayDate && dayInfo.isCurrentMonth && 'text-text-primary',
                !dayInfo.isCurrentMonth && 'text-text-tertiary',
              )}>
                {dayInfo.day}
              </span>

              {hasVisits && (
                <div className="flex flex-col items-center gap-px w-full px-px">
                  {dayVisits.slice(0, 3).map((v, vi) => (
                    <div
                      key={vi}
                      className={cn('w-full rounded-sm h-1', getVisitDotColor(v.status))}
                    />
                  ))}
                  {dayVisits.length > 3 && (
                    <Typography variant="tiny" className="text-mx-micro text-text-tertiary leading-none">
                      +{dayVisits.length - 3}
                    </Typography>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
