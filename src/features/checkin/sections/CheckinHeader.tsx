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
    <header className="shrink-0 border-b border-border-default pb-mx-md">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col gap-mx-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-mx-sm">
              <div className="h-mx-10 w-mx-xs rounded-mx-full bg-brand-primary shadow-mx-md" aria-hidden="true" />
              <Typography variant="h1" className="text-4xl leading-tight">
                Terminal <span className="text-mx-green-700">MX</span>
              </Typography>
            </div>
            <Typography variant="caption" tone="muted" className="mt-mx-xs block pl-6">
              Referência operacional: {dateStr}
            </Typography>
          </div>

          <div className="flex shrink-0 items-center gap-mx-md">
            <div className="grid h-mx-12 place-items-center rounded-mx-lg bg-brand-primary px-mx-lg text-sm font-semibold uppercase text-white shadow-mx-sm">
              {metricScope === 'adjustment' ? 'Correções até 09:45' : `Até ${CHECKIN_DEADLINE_LABEL}`}
            </div>
            <div className="flex h-mx-12 items-center gap-mx-sm rounded-mx-lg border border-brand-primary/20 bg-status-success-surface px-mx-lg text-sm font-semibold uppercase text-brand-primary">
              {statusText}
              <Info size={16} />
            </div>
          </div>
        </div>

        <div className="mt-mx-md flex flex-wrap items-center gap-mx-lg pl-6">
          <div className="inline-flex h-mx-12 overflow-hidden rounded-mx-xl border border-border-default bg-white p-mx-tiny shadow-mx-sm">
            <TabButton active={metricScope === 'daily'} onClick={() => setMetricScope('daily')}>
              Registro Diário
            </TabButton>
            <TabButton active={metricScope === 'adjustment'} onClick={() => setMetricScope('adjustment')}>
              Ajuste Técnico
            </TabButton>
          </div>

          <label className="flex h-mx-12 w-48 items-center gap-mx-sm rounded-mx-xl border border-border-default bg-white px-mx-md shadow-mx-sm">
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
        'relative h-full w-44 whitespace-nowrap rounded-mx-lg px-mx-md text-sm font-semibold uppercase tracking-normal transition-all',
        active ? 'bg-white text-text-primary shadow-mx-sm' : 'text-text-tertiary hover:text-text-primary',
      )}
    >
      {children}
      {active && <span className="absolute inset-x-mx-md bottom-0 h-0.5 rounded-full bg-brand-primary" />}
    </button>
  )
}
