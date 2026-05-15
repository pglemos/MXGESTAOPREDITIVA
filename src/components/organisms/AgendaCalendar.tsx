import { format, isToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_MON_FIRST = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']

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
  viewMode?: 'day' | 'week' | 'month'
  showNavigation?: boolean
  showTodayButton?: boolean
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
  viewMode = 'month',
  showNavigation = true,
  showTodayButton = true,
  className,
}: AgendaCalendarProps) {
  const weekdayLabels = viewMode === 'day' && calendarDays[0]
    ? [WEEKDAYS[calendarDays[0].date.getDay()]]
    : viewMode === 'week'
      ? WEEKDAYS_MON_FIRST
      : WEEKDAYS
  const gridClassName = viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'
  const isTimeGrid = viewMode === 'day' || viewMode === 'week'

  return (
    <Card className={cn('border border-border-default shadow-mx-sm bg-white overflow-hidden rounded-mx-2xl', className)}>
      <div className={cn(
        'flex items-center gap-mx-xs p-mx-sm sm:p-mx-md border-b border-border-default bg-white',
        showNavigation ? 'justify-between' : 'justify-center',
      )}>
        {showNavigation && (
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mês anterior"
            className="w-mx-10 h-mx-10 rounded-mx-full bg-white border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="flex min-w-0 items-center justify-center gap-mx-xs sm:gap-mx-sm px-mx-xs">
          <Typography variant="h3" className="truncate text-sm sm:text-base font-black uppercase tracking-normal">
            {monthLabel}
          </Typography>
          {showTodayButton && (
            <button
              type="button"
              onClick={onToday}
              className="px-3 py-1.5 rounded-mx-full bg-white text-brand-primary border border-brand-primary/20 text-mx-micro font-black uppercase tracking-widest hover:bg-brand-primary/10 transition-all"
            >
              Hoje
            </button>
          )}
        </div>

        {showNavigation && (
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Próximo mês"
            className="w-mx-10 h-mx-10 rounded-mx-full bg-white border border-border-default flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
          >
            <ChevronRightIcon size={18} />
          </button>
        )}
      </div>

      {isTimeGrid ? (
        <>
          <div
            className="grid border-b border-border-default bg-white"
            style={{ gridTemplateColumns: viewMode === 'day' ? '3.5rem minmax(0, 1fr)' : '3.5rem repeat(7, minmax(0, 1fr))' }}
          >
            <div className="border-r border-border-default" aria-hidden="true" />
            {calendarDays.map((dayInfo) => {
              const isTodayDate = isToday(dayInfo.date)
              const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
              return (
                <button
                  key={format(dayInfo.date, 'yyyy-MM-dd')}
                  type="button"
                  aria-label={format(dayInfo.date, "dd/MM/yyyy")}
                  onClick={() => {
                    onDateSelect(dayInfo.date)
                    onDateClick?.(dayInfo.date)
                  }}
                  className={cn(
                    'min-w-0 border-r border-border-default p-mx-sm text-center transition-colors last:border-r-0 hover:bg-surface-alt',
                    isSelected && 'bg-brand-primary/5',
                  )}
                >
                  <Typography variant="tiny" tone="muted" className="block uppercase tracking-widest text-mx-micro">
                    {format(dayInfo.date, 'EEE', { locale: ptBR })}
                  </Typography>
                  <span className={cn(
                    'mx-auto mt-1 flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-full text-sm font-black',
                    isTodayDate ? 'bg-brand-primary text-white shadow-mx-sm' : 'text-text-primary',
                  )}>
                    {dayInfo.day}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '3.5rem minmax(0, 1fr)' }}>
            <div className="bg-white border-r border-border-default">
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="h-mx-20 border-b border-border-subtle pr-mx-xs pt-mx-xs text-right">
                  <Typography variant="tiny" tone="muted" className="text-mx-micro font-bold">{slot}</Typography>
                </div>
              ))}
            </div>

            <div className={cn('grid', gridClassName)} style={{ minWidth: viewMode === 'week' ? '36rem' : undefined }}>
              {calendarDays.map((dayInfo) => {
                const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
                const dayVisits = visitsByDate[dateKey] || []
                const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
                const isTodayDate = isToday(dayInfo.date)
                const firstTone = dayVisits[0] ? getVisitDotColor(dayVisits[0].status) : 'bg-brand-primary'

                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={format(dayInfo.date, "dd/MM/yyyy")}
                    onClick={() => {
                      onDateSelect(dayInfo.date)
                      onDateClick?.(dayInfo.date)
                    }}
                    className={cn(
                      'relative min-h-mx-96 border-r border-border-default bg-white text-left transition-colors last:border-r-0 hover:bg-surface-alt/50',
                      isSelected && 'bg-brand-primary/5 ring-2 ring-brand-primary/30 ring-inset',
                      isTodayDate && !isSelected && 'bg-brand-primary/[0.03]',
                    )}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot} className="h-mx-20 border-b border-border-subtle" aria-hidden="true" />
                    ))}
                    {dayVisits.length > 0 && (
                      <div className="absolute left-mx-xs right-mx-xs top-mx-sm">
                        <div className={cn(
                          'flex min-h-mx-9 items-center gap-mx-xs rounded-mx-md border bg-white px-mx-xs py-1 shadow-mx-sm',
                          isSelected ? 'border-brand-primary/40' : 'border-border-default',
                        )}>
                          <span className={cn('h-mx-xs w-mx-xs rounded-mx-full shrink-0', firstTone)} aria-hidden="true" />
                          <span className="min-w-0 truncate text-mx-micro font-black uppercase tracking-widest text-text-primary">
                            {dayVisits.length} {dayVisits.length === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={cn('grid border-b border-border-default bg-white', gridClassName)}>
            {weekdayLabels.map((d) => (
              <div key={d} className="py-mx-xs sm:py-mx-sm text-center border-r border-border-default last:border-r-0">
                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-micro">{d}</Typography>
              </div>
            ))}
          </div>

          <div className={cn('grid', gridClassName)}>
            {calendarDays.map((dayInfo) => {
              const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
              const dayVisits = visitsByDate[dateKey] || []
              const hasVisits = dayVisits.length > 0
              const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
              const isTodayDate = isToday(dayInfo.date)

              return (
                <button
                  key={dateKey}
                  type="button"
                  aria-label={format(dayInfo.date, "dd/MM/yyyy")}
                  onClick={() => {
                    onDateSelect(dayInfo.isCurrentMonth ? dayInfo.date : null)
                    if (dayInfo.isCurrentMonth) onDateClick?.(dayInfo.date)
                  }}
                  className={cn(
                    'relative min-h-mx-24 sm:min-h-mx-32 p-mx-xs flex flex-col items-start gap-mx-xs border-b border-r border-border-subtle transition-all text-left',
                    !dayInfo.isCurrentMonth && 'bg-surface-alt/50 opacity-50',
                    dayInfo.isCurrentMonth && 'hover:bg-brand-primary/5',
                    isSelected && 'bg-brand-primary/10 ring-2 ring-brand-primary/40 ring-inset',
                    isTodayDate && !isSelected && 'bg-brand-primary/5',
                  )}
                >
                  <span className={cn(
                    'h-mx-lg min-w-mx-lg rounded-mx-full px-2 flex items-center justify-center text-xs font-black',
                    isTodayDate && 'bg-brand-primary text-white',
                    !isTodayDate && dayInfo.isCurrentMonth && 'text-text-primary',
                    !dayInfo.isCurrentMonth && 'text-text-tertiary',
                  )}>
                    {dayInfo.day}
                  </span>

                  {hasVisits && (
                    <div className="flex w-full flex-col gap-mx-tiny">
                      {dayVisits.slice(0, 2).map((v, vi) => (
                        <div
                          key={vi}
                          className="flex min-h-mx-6 items-center gap-mx-tiny rounded-mx-sm bg-surface-alt px-1.5"
                        >
                          <span className={cn('h-mx-tiny w-mx-tiny rounded-mx-full shrink-0', getVisitDotColor(v.status))} aria-hidden="true" />
                          <span className="truncate text-mx-micro font-bold text-text-primary">
                            Item agenda
                          </span>
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <Typography variant="tiny" className="text-mx-micro text-text-secondary leading-none font-black">
                          +{dayVisits.length - 2}
                        </Typography>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
