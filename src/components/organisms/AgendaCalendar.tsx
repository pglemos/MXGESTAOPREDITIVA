import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRightIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const WEEKDAYS_MON_FIRST = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const START_HOUR = 7
const END_HOUR = 20
const HOUR_HEIGHT = 56
const TIME_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

export interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
}

export interface CalendarAgendaItem {
  id: string
  status: string
  title: string
  startsAt: string
  durationHours: number
  kind: 'visit' | 'event'
  subtitle?: string | null
}

export interface AgendaCalendarProps {
  calendarDays: CalendarDay[]
  visitsByDate: Record<string, CalendarAgendaItem[]>
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

function getEventPosition(item: CalendarAgendaItem) {
  const start = parseISO(item.startsAt)
  const startDecimal = start.getHours() + start.getMinutes() / 60
  const rawTop = (startDecimal - START_HOUR) * HOUR_HEIGHT
  const top = Math.max(4, rawTop)
  const height = Math.max(30, item.durationHours * HOUR_HEIGHT - 6)

  return { top, height }
}

function GoogleEventBlock({
  item,
  getVisitDotColor,
  compact = false,
}: {
  item: CalendarAgendaItem
  getVisitDotColor: (status: string) => string
  compact?: boolean
}) {
  const start = parseISO(item.startsAt)
  const dotColor = item.kind === 'event' ? 'bg-blue-600' : getVisitDotColor(item.status)

  return (
    <div
      className={cn(
        'group/event min-w-0 overflow-hidden rounded-xl border px-2 py-1 text-left shadow-sm transition-colors',
        item.kind === 'event'
          ? 'border-blue-600/20 bg-blue-50 text-blue-600'
          : 'border-emerald-600/20 bg-emerald-50 text-gray-900',
        compact ? 'min-h-6' : 'min-h-8',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn('h-1 w-1 shrink-0 rounded-full', dotColor)} aria-hidden="true" />
        <span className={cn('min-w-0 truncate font-semibold leading-tight', compact ? 'text-[11px]' : 'text-xs')}>
          {item.title}
        </span>
      </div>
      {!compact && (
        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] leading-none opacity-75">
          <Clock size={10} aria-hidden="true" />
          <span className="truncate">
            {format(start, 'HH:mm')}
            {item.subtitle ? ` · ${item.subtitle}` : ''}
          </span>
        </div>
      )}
    </div>
  )
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
    ? [format(calendarDays[0].date, 'EEE', { locale: ptBR }).toUpperCase()]
    : viewMode === 'week'
      ? WEEKDAYS_MON_FIRST
      : WEEKDAYS
  const gridClassName = viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'
  const isTimeGrid = viewMode === 'day' || viewMode === 'week'
  const timeGridHeight = TIME_SLOTS.length * HOUR_HEIGHT

  return (
    <Card className={cn('border border-gray-200 shadow-none bg-white overflow-hidden rounded-2xl', className)}>
      <div className={cn(
        'flex items-center gap-2 p-4 sm:p-6 border-b border-gray-200 bg-white',
        showNavigation ? 'justify-between' : 'justify-center',
      )}>
        {showNavigation && (
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mês anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="flex min-w-0 items-center justify-center gap-2 sm:gap-4 px-2">
          <Typography variant="h3" className="truncate text-lg font-semibold normal-case tracking-normal text-gray-800 sm:text-xl">
            {monthLabel}
          </Typography>
          {showTodayButton && (
            <button
              type="button"
              onClick={onToday}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <ChevronRightIcon size={18} />
          </button>
        )}
      </div>

      {isTimeGrid ? (
        <>
          <div
            className="grid border-b border-gray-200 bg-white"
            style={{ gridTemplateColumns: viewMode === 'day' ? '4rem minmax(0, 1fr)' : '4rem repeat(7, minmax(7.5rem, 1fr))' }}
          >
            <div className="border-r border-gray-100" aria-hidden="true" />
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
                    'min-w-0 border-r border-gray-100 px-2 py-4 text-center transition-colors last:border-r-0 hover:bg-gray-50',
                    isSelected && 'bg-emerald-50',
                  )}
                >
                  <Typography variant="tiny" tone="muted" className="block text-[10px] font-semibold uppercase tracking-normal">
                    {format(dayInfo.date, 'EEE', { locale: ptBR })}
                  </Typography>
                  <span className={cn(
                    'mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                    isTodayDate ? 'bg-emerald-600 text-white' : 'text-gray-800',
                  )}>
                    {dayInfo.day}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '4rem minmax(0, 1fr)' }}>
            <div className="border-r border-gray-100 bg-white">
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="border-b border-gray-100 pr-2 pt-2 text-right" style={{ height: HOUR_HEIGHT }}>
                  <Typography variant="tiny" tone="muted" className="text-[10px] font-medium">{`${String(slot).padStart(2, '0')}:00`}</Typography>
                </div>
              ))}
            </div>

            <div className={cn('grid', gridClassName)} style={{ minWidth: viewMode === 'week' ? '54rem' : undefined, height: timeGridHeight }}>
              {calendarDays.map((dayInfo) => {
                const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
                const dayVisits = [...(visitsByDate[dateKey] || [])].sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())
                const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
                const isTodayDate = isToday(dayInfo.date)

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
                      'relative border-r border-gray-100 bg-white text-left transition-colors last:border-r-0 hover:bg-gray-50/50',
                      isSelected && 'bg-emerald-50/60 ring-1 ring-emerald-500/30 ring-inset',
                      isTodayDate && !isSelected && 'bg-emerald-50/35',
                    )}
                    style={{ minHeight: timeGridHeight }}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot} className="border-b border-gray-100" style={{ height: HOUR_HEIGHT }} aria-hidden="true" />
                    ))}
                    {dayVisits.length > 0 && (
                      dayVisits.map((item, index) => {
                        const position = getEventPosition(item)
                        return (
                          <div
                            key={`${item.kind}-${item.id}`}
                            className="absolute left-2 right-2"
                            style={{
                              top: position.top + index * 3,
                              height: position.height,
                            }}
                          >
                            <GoogleEventBlock item={item} getVisitDotColor={getVisitDotColor} />
                          </div>
                        )
                      })
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={cn('grid border-b border-gray-200 bg-white', gridClassName)}>
            {weekdayLabels.map((d) => (
              <div key={d} className="border-r border-gray-100 py-2 text-center last:border-r-0 sm:py-4">
                <Typography variant="tiny" tone="muted" className="text-[10px] font-semibold uppercase tracking-normal">{d}</Typography>
              </div>
            ))}
          </div>

          <div className={cn('grid', gridClassName)}>
            {calendarDays.map((dayInfo) => {
              const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
              const dayVisits = [...(visitsByDate[dateKey] || [])].sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())
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
                    'relative flex min-h-24 flex-col items-start gap-2 border-b border-r border-gray-100 p-2 text-left transition-colors sm:min-h-32',
                    !dayInfo.isCurrentMonth && 'bg-gray-50/60 text-gray-500',
                    dayInfo.isCurrentMonth && 'hover:bg-gray-50',
                    isSelected && 'bg-emerald-50 ring-1 ring-emerald-500/30 ring-inset',
                    isTodayDate && !isSelected && 'bg-emerald-50/50',
                  )}
                >
                  <span className={cn(
                    'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold',
                    isTodayDate && 'bg-emerald-600 text-white',
                    !isTodayDate && dayInfo.isCurrentMonth && 'text-gray-800',
                    !dayInfo.isCurrentMonth && 'text-gray-500',
                  )}>
                    {dayInfo.day}
                  </span>

                  {hasVisits && (
                    <div className="flex w-full flex-col gap-1">
                      {dayVisits.slice(0, 2).map((v, vi) => (
                        <GoogleEventBlock
                          key={`${v.kind}-${v.id}-${vi}`}
                          item={v}
                          getVisitDotColor={getVisitDotColor}
                          compact
                        />
                      ))}
                      {dayVisits.length > 2 && (
                        <Typography variant="tiny" className="text-[11px] text-gray-600 leading-none font-semibold">
                          +{dayVisits.length - 2} mais
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
