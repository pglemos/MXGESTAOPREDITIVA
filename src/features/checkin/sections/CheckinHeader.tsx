import { CalendarDays, Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import { CHECKIN_DEADLINE_LABEL } from '@/hooks/useCheckins'
import type { DailyCheckin } from '@/types/database'

interface CheckinHeaderProps {
  dateStr: string
  metricScope: 'daily' | 'adjustment'
  setMetricScope: (scope: 'daily' | 'adjustment') => void
  customReferenceDate: string
  setCustomReferenceDate: (value: string) => void
  isLate: boolean
  historicalCheckin: DailyCheckin | null
  canEditExisting: boolean
  deadlineMessage: string
  handleExit: () => void
}

export function CheckinHeader({
  dateStr,
  metricScope,
  setMetricScope,
  customReferenceDate,
  setCustomReferenceDate,
  isLate,
  historicalCheckin,
  canEditExisting,
  deadlineMessage,
}: CheckinHeaderProps) {
  const statusText =
    metricScope === 'adjustment'
      ? 'NO PRAZO. EDIÇÃO BLOQUEIA EM 09:45.'
      : canEditExisting
        ? deadlineMessage
        : historicalCheckin
          ? 'REGISTRO FINALIZADO'
          : isLate
            ? 'FORA DO PRAZO'
            : 'NO PRAZO. EDIÇÃO BLOQUEIA EM 09:45.'

  return (
  <header className="shrink-0 border-b border-border-default pb-mx-lg">
      <div className="w-full">
        <div className="flex min-w-0 flex-col gap-mx-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-mx-sm">
              <div className="h-mx-10 w-mx-xs rounded-mx-full bg-brand-primary shadow-mx-md" aria-hidden="true" />
              <Typography variant="h1" className="min-w-0 break-words text-3xl leading-tight md:text-[2rem] xl:text-4xl">
                Fechamento <span className="text-mx-green-700">Diário</span>
              </Typography>
            </div>
            <Typography variant="caption" tone="muted" className="mt-mx-xs block pl-6">
              Referência operacional: {dateStr}
            </Typography>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-mx-sm lg:justify-end">
            <div className="grid h-11 place-items-center whitespace-nowrap rounded-mx-lg bg-brand-primary px-mx-md text-xs font-semibold uppercase text-white shadow-mx-sm sm:text-sm">
              {metricScope === 'adjustment' ? 'Correções até 09:45' : `Até ${CHECKIN_DEADLINE_LABEL}`}
            </div>
            <div className="flex h-11 min-w-0 items-center gap-mx-xs rounded-mx-lg border border-brand-primary/20 bg-status-success-surface px-mx-md text-xs font-semibold uppercase text-brand-primary sm:text-sm">
              {statusText}
              <Info size={16} />
            </div>
          </div>
        </div>

        <div className="mt-mx-md flex flex-wrap items-center gap-mx-sm pl-0 sm:gap-mx-md sm:pl-6">
          <div className="inline-flex min-h-mx-12 w-full max-w-md overflow-hidden rounded-mx-xl border border-border-default bg-white p-mx-tiny shadow-mx-sm sm:w-auto">
            <TabButton active={metricScope === 'daily'} onClick={() => setMetricScope('daily')}>
              Fechamento Diário
            </TabButton>
            <TabButton active={metricScope === 'adjustment'} onClick={() => setMetricScope('adjustment')}>
              Ajuste Técnico
            </TabButton>
          </div>

          <label className="flex h-mx-12 w-full max-w-[12rem] items-center gap-mx-sm rounded-mx-xl border border-border-default bg-white px-mx-md shadow-mx-sm sm:w-48">
            <CalendarDays size={16} className="text-brand-primary" />
            <input
              type="date"
              value={customReferenceDate}
              onChange={event => setCustomReferenceDate(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none"
            />
          </label>
        </div>
      </div>
    </header>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative min-h-11 min-w-0 flex-1 rounded-mx-lg px-mx-xs text-[11px] font-semibold uppercase leading-tight tracking-normal transition-all sm:w-40 sm:flex-none sm:px-mx-sm sm:text-xs lg:w-44',
        active ? 'bg-white text-text-primary shadow-mx-sm' : 'text-text-tertiary hover:text-text-primary',
      )}
    >
      <span className="block whitespace-normal break-words">{children}</span>
      {active && <span className="absolute inset-x-mx-md bottom-0 h-0.5 rounded-full bg-brand-primary" />}
    </button>
  )
}
