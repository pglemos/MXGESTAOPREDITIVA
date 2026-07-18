import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRightIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { useIsManagementVisual } from '@/components/visual/ManagementVisualContext'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const WEEKDAYS_MON_FIRST = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
const START_HOUR = 7
const END_HOUR = 20
const HOUR_HEIGHT = 56
const TIME_SLOTS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

type AgendaVisualClasses = {
  eventDot: string
  eventBlockBase: string
  eventBlockEvent: string
  eventBlockVisit: string
  eventCompactMin: string
  eventRegularMin: string
  eventRow: string
  eventDotSize: string
  card: string
  toolbar: string
  navButton: string
  toolbarCenter: string
  monthTitle: string
  todayButton: string
  timeHeader: string
  timeCorner: string
  dayHeaderButton: string
  selectedHeader: string
  dayCircle: string
  todayCircle: string
  normalDayText: string
  timeColumn: string
  timeSlot: string
  timeDayButton: string
  selectedTimeDay: string
  todayTimeDay: string
  gridSlot: string
  eventPosition: string
  weekdayHeader: string
  weekdayCell: string
  monthDayButton: string
  outsideMonth: string
  currentMonthHover: string
  selectedMonth: string
  todayMonth: string
  monthDayCircle: string
  todayMonthCircle: string
  currentMonthText: string
  outsideMonthText: string
  visitsList: string
  moreText: string
}

const managerAgendaVisual: AgendaVisualClasses = {
  eventDot: 'bg-blue-600',
  eventBlockBase: 'group/event min-w-0 overflow-hidden rounded-xl border px-2 py-1 text-left shadow-sm transition-colors',
  eventBlockEvent: 'border-blue-600/20 bg-blue-50 text-blue-600',
  eventBlockVisit: 'border-emerald-600/20 bg-emerald-50 text-gray-900',
  eventCompactMin: 'min-h-6',
  eventRegularMin: 'min-h-8',
  eventRow: 'flex min-w-0 items-center gap-2',
  eventDotSize: 'h-1 w-1 shrink-0 rounded-full',
  card: 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-none',
  toolbar: 'flex items-center gap-2 border-b border-gray-200 bg-white p-4 sm:p-6',
  navButton: 'flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800',
  toolbarCenter: 'flex min-w-0 items-center justify-center gap-2 px-2 sm:gap-4',
  monthTitle: 'truncate text-lg font-semibold normal-case tracking-normal text-gray-800 sm:text-xl',
  todayButton: 'rounded-2xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800',
  timeHeader: 'grid border-b border-gray-200 bg-white',
  timeCorner: 'border-r border-gray-100',
  dayHeaderButton: 'min-w-0 border-r border-gray-100 px-2 py-4 text-center transition-colors last:border-r-0 hover:bg-gray-50',
  selectedHeader: 'bg-emerald-50',
  dayCircle: 'mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
  todayCircle: 'bg-emerald-600 text-white',
  normalDayText: 'text-gray-800',
  timeColumn: 'border-r border-gray-100 bg-white',
  timeSlot: 'border-b border-gray-100 pr-2 pt-2 text-right',
  timeDayButton: 'relative border-r border-gray-100 bg-white text-left transition-colors last:border-r-0 hover:bg-gray-50/50',
  selectedTimeDay: 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-500/30',
  todayTimeDay: 'bg-emerald-50/35',
  gridSlot: 'border-b border-gray-100',
  eventPosition: 'absolute left-2 right-2',
  weekdayHeader: 'grid border-b border-gray-200 bg-white',
  weekdayCell: 'border-r border-gray-100 py-2 text-center last:border-r-0 sm:py-4',
  monthDayButton: 'relative flex min-h-24 flex-col items-start gap-2 border-b border-r border-gray-100 p-2 text-left transition-colors sm:min-h-32',
  outsideMonth: 'bg-gray-50/60 text-gray-500',
  currentMonthHover: 'hover:bg-gray-50',
  selectedMonth: 'bg-emerald-50 ring-1 ring-inset ring-emerald-500/30',
  todayMonth: 'bg-emerald-50/50',
  monthDayCircle: 'flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold',
  todayMonthCircle: 'bg-emerald-600 text-white',
  currentMonthText: 'text-gray-800',
  outsideMonthText: 'text-gray-500',
  visitsList: 'flex w-full flex-col gap-1',
  moreText: 'text-[11px] font-semibold leading-none text-gray-600',
}

/* management-audit:seller-only-start */
const sellerAgendaVisual: AgendaVisualClasses = {
  eventDot: 'bg-status-info',
  eventBlockBase: 'group/event min-w-0 overflow-hidden rounded-mx-md border px-2 py-1 text-left shadow-mx-sm transition-colors',
  eventBlockEvent: 'border-status-info/20 bg-status-info-surface text-status-info',
  eventBlockVisit: 'border-brand-primary/20 bg-mx-green-50 text-brand-secondary',
  eventCompactMin: 'min-h-mx-6',
  eventRegularMin: 'min-h-mx-8',
  eventRow: 'flex min-w-0 items-center gap-mx-xs',
  eventDotSize: 'h-mx-tiny w-mx-tiny shrink-0 rounded-mx-full',
  card: 'overflow-hidden rounded-mx-lg border border-border-strong bg-white shadow-none',
  toolbar: 'flex items-center gap-mx-xs border-b border-border-strong bg-white p-mx-sm sm:p-mx-md',
  navButton: 'flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-white text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary',
  toolbarCenter: 'flex min-w-0 items-center justify-center gap-mx-xs px-mx-xs sm:gap-mx-sm',
  monthTitle: 'truncate text-lg font-semibold normal-case tracking-normal text-text-primary sm:text-xl',
  todayButton: 'rounded-mx-lg border border-border-strong bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary',
  timeHeader: 'grid border-b border-border-strong bg-white',
  timeCorner: 'border-r border-border-default',
  dayHeaderButton: 'min-w-0 border-r border-border-default px-mx-xs py-mx-sm text-center transition-colors last:border-r-0 hover:bg-surface-alt',
  selectedHeader: 'bg-mx-green-50',
  dayCircle: 'mx-auto mt-1 flex h-mx-9 w-mx-9 items-center justify-center rounded-mx-full text-sm font-semibold',
  todayCircle: 'bg-brand-primary text-white',
  normalDayText: 'text-text-primary',
  timeColumn: 'border-r border-border-default bg-white',
  timeSlot: 'border-b border-border-subtle pr-mx-xs pt-mx-xs text-right',
  timeDayButton: 'relative border-r border-border-default bg-white text-left transition-colors last:border-r-0 hover:bg-surface-alt/50',
  selectedTimeDay: 'bg-mx-green-50/60 ring-1 ring-brand-primary/30 ring-inset',
  todayTimeDay: 'bg-mx-green-50/35',
  gridSlot: 'border-b border-border-subtle',
  eventPosition: 'absolute left-mx-xs right-mx-xs',
  weekdayHeader: 'grid border-b border-border-strong bg-white',
  weekdayCell: 'border-r border-border-default py-mx-xs text-center last:border-r-0 sm:py-mx-sm',
  monthDayButton: 'relative flex min-h-mx-24 flex-col items-start gap-mx-xs border-b border-r border-border-subtle p-mx-xs text-left transition-colors sm:min-h-mx-32',
  outsideMonth: 'bg-surface-alt/60 text-text-tertiary',
  currentMonthHover: 'hover:bg-surface-alt',
  selectedMonth: 'bg-mx-green-50 ring-1 ring-brand-primary/30 ring-inset',
  todayMonth: 'bg-mx-green-50/50',
  monthDayCircle: 'flex h-mx-lg min-w-mx-lg items-center justify-center rounded-mx-full px-2 text-xs font-semibold',
  todayMonthCircle: 'bg-brand-primary text-white',
  currentMonthText: 'text-text-primary',
  outsideMonthText: 'text-text-tertiary',
  visitsList: 'flex w-full flex-col gap-mx-tiny',
  moreText: 'text-[11px] text-text-secondary leading-none font-semibold',
}
/* management-audit:seller-only-end */

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
  const visual = useIsManagementVisual() ? managerAgendaVisual : sellerAgendaVisual
  const dotColor = item.kind === 'event' ? visual.eventDot : getVisitDotColor(item.status)

  return (
    <div
      className={cn(
        visual.eventBlockBase,
        item.kind === 'event'
          ? visual.eventBlockEvent
          : visual.eventBlockVisit,
        compact ? visual.eventCompactMin : visual.eventRegularMin,
      )}
    >
      <div className={visual.eventRow}>
        <span className={cn(visual.eventDotSize, dotColor)} aria-hidden="true" />
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
  const visual = useIsManagementVisual() ? managerAgendaVisual : sellerAgendaVisual

  return (
    <Card className={cn(visual.card, className)}>
      <div className={cn(
        visual.toolbar,
        showNavigation ? 'justify-between' : 'justify-center',
      )}>
        {showNavigation && (
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mês anterior"
            className={visual.navButton}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className={visual.toolbarCenter}>
          <Typography variant="h3" className={visual.monthTitle}>
            {monthLabel}
          </Typography>
          {showTodayButton && (
            <button
              type="button"
              onClick={onToday}
              className={visual.todayButton}
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
            className={visual.navButton}
          >
            <ChevronRightIcon size={18} />
          </button>
        )}
      </div>

      {isTimeGrid ? (
        <>
          <div
            className={visual.timeHeader}
            style={{ gridTemplateColumns: viewMode === 'day' ? '4rem minmax(0, 1fr)' : '4rem repeat(7, minmax(7.5rem, 1fr))' }}
          >
            <div className={visual.timeCorner} aria-hidden="true" />
            {calendarDays.map((dayInfo) => {
              const isTodayDate = isToday(dayInfo.date)
              const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
              return (
                <button
                  key={format(dayInfo.date, 'yyyy-MM-dd')}
                  type="button"
                  aria-label={format(dayInfo.date, 'dd/MM/yyyy')}
                  onClick={() => {
                    onDateSelect(dayInfo.date)
                    onDateClick?.(dayInfo.date)
                  }}
                  className={cn(
                    visual.dayHeaderButton,
                    isSelected && visual.selectedHeader,
                  )}
                >
                  <Typography variant="tiny" tone="muted" className="block text-[10px] font-semibold uppercase tracking-normal">
                    {format(dayInfo.date, 'EEE', { locale: ptBR })}
                  </Typography>
                  <span className={cn(
                    visual.dayCircle,
                    isTodayDate ? visual.todayCircle : visual.normalDayText,
                  )}>
                    {dayInfo.day}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid overflow-x-auto" style={{ gridTemplateColumns: '4rem minmax(0, 1fr)' }}>
            <div className={visual.timeColumn}>
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className={visual.timeSlot} style={{ height: HOUR_HEIGHT }}>
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
                    aria-label={format(dayInfo.date, 'dd/MM/yyyy')}
                    onClick={() => {
                      onDateSelect(dayInfo.date)
                      onDateClick?.(dayInfo.date)
                    }}
                    className={cn(
                      visual.timeDayButton,
                      isSelected && visual.selectedTimeDay,
                      isTodayDate && !isSelected && visual.todayTimeDay,
                    )}
                    style={{ minHeight: timeGridHeight }}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div key={slot} className={visual.gridSlot} style={{ height: HOUR_HEIGHT }} aria-hidden="true" />
                    ))}
                    {dayVisits.length > 0 && (
                      dayVisits.map((item, index) => {
                        const position = getEventPosition(item)
                        return (
                          <div
                            key={`${item.kind}-${item.id}`}
                            className={visual.eventPosition}
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
          <div className={cn(visual.weekdayHeader, gridClassName)}>
            {weekdayLabels.map((d) => (
              <div key={d} className={visual.weekdayCell}>
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
                  aria-label={format(dayInfo.date, 'dd/MM/yyyy')}
                  onClick={() => {
                    onDateSelect(dayInfo.isCurrentMonth ? dayInfo.date : null)
                    if (dayInfo.isCurrentMonth) onDateClick?.(dayInfo.date)
                  }}
                  className={cn(
                    visual.monthDayButton,
                    !dayInfo.isCurrentMonth && visual.outsideMonth,
                    dayInfo.isCurrentMonth && visual.currentMonthHover,
                    isSelected && visual.selectedMonth,
                    isTodayDate && !isSelected && visual.todayMonth,
                  )}
                >
                  <span className={cn(
                    visual.monthDayCircle,
                    isTodayDate && visual.todayMonthCircle,
                    !isTodayDate && dayInfo.isCurrentMonth && visual.currentMonthText,
                    !dayInfo.isCurrentMonth && visual.outsideMonthText,
                  )}>
                    {dayInfo.day}
                  </span>

                  {hasVisits && (
                    <div className={visual.visitsList}>
                      {dayVisits.slice(0, 2).map((v, vi) => (
                        <GoogleEventBlock
                          key={`${v.kind}-${v.id}-${vi}`}
                          item={v}
                          getVisitDotColor={getVisitDotColor}
                          compact
                        />
                      ))}
                      {dayVisits.length > 2 && (
                        <Typography variant="tiny" className={visual.moreText}>
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
