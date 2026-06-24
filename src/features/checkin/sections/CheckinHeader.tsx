import { useState } from 'react'
import { CalendarDays, History, Info } from 'lucide-react'

import { Typography } from '@/components/atoms/Typography'
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
  isLate,
  historicalCheckin,
  canEditExisting,
  deadlineMessage,
}: CheckinHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)
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
    <header className="shrink-0 border-b border-border-default pb-mx-sm">
      <div className="flex min-w-0 flex-col gap-mx-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-mx-xs">
          <Typography variant="h1" className="min-w-0 break-words !text-xl !font-extrabold !leading-none uppercase tracking-normal text-text-primary">
            Fechamento Diário
          </Typography>
          <div className="inline-flex max-w-full items-center gap-mx-xs rounded-mx-full border border-border-default bg-white px-mx-sm py-1 text-[11px] font-semibold text-text-secondary shadow-mx-xs">
            <CalendarDays size={13} className="shrink-0 text-brand-primary" />
            <span className="truncate">{dateStr}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-mx-xs lg:justify-end">
          <div className="grid h-8 place-items-center whitespace-nowrap rounded-mx-full border border-brand-primary/15 bg-brand-primary px-mx-sm text-[11px] font-semibold uppercase text-white shadow-mx-xs">
            {metricScope === 'adjustment' ? 'Correções até 09:45' : `Até ${CHECKIN_DEADLINE_LABEL}`}
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex h-8 min-w-0 items-center gap-mx-xs rounded-mx-full border border-brand-primary/20 bg-status-success-surface px-mx-sm text-[11px] font-semibold uppercase text-brand-primary"
              aria-expanded={infoOpen}
              aria-controls="checkin-status-info"
              onClick={() => setInfoOpen(current => !current)}
            >
              {statusText}
              <Info size={13} />
            </button>
            {infoOpen && (
              <div
                id="checkin-status-info"
                role="status"
                className="absolute right-0 top-10 z-20 w-64 rounded-mx-lg border border-border-default bg-white p-mx-sm text-xs font-medium normal-case leading-relaxed text-text-secondary shadow-mx-lg"
              >
                Status do prazo de edição. Finalize até o horário limite ou solicite liberação ao gerente quando o prazo estiver bloqueado.
              </div>
            )}
          </div>
          <button
            type="button"
            className="flex h-8 items-center gap-mx-xs whitespace-nowrap rounded-mx-full border border-border-default bg-white px-mx-sm text-[11px] font-semibold text-text-secondary shadow-mx-xs transition-colors hover:text-brand-primary"
          >
            <History size={13} />
            Histórico
          </button>
        </div>
      </div>
    </header>
  )
}
