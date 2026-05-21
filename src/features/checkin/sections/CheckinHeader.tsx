import { CalendarDays, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
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

/**
 * CheckinHeader — toolbar superior com identidade da página, alternância
 * entre registro/ajuste, seleção de data e status do prazo.
 */
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
    handleExit,
}: CheckinHeaderProps) {
    return (
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-8 shrink-0">
            <div className="flex flex-col gap-mx-tiny">
                <div className="flex items-center gap-mx-sm">
                    <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                    <Typography variant="h1">Terminal <span className="text-mx-green-700">MX</span></Typography>
                </div>
                <Typography variant="caption" tone="muted" className="pl-0 sm:pl-6">
                    Referência operacional: {dateStr}
                </Typography>
                <div className="flex flex-col items-stretch gap-mx-sm pl-0 mt-2 sm:flex-row sm:items-center sm:pl-6">
                    <div className="flex w-full p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm sm:w-auto" role="group" aria-label="Tipo de lançamento">
                        <Button
                            variant={metricScope === 'daily' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setMetricScope('daily')}
                            className="h-mx-9 flex-1 px-4 rounded-mx-full text-mx-tiny uppercase font-black sm:flex-none sm:px-6"
                        >
                            REGISTRO DIÁRIO
                        </Button>
                        <Button
                            variant={metricScope === 'adjustment' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setMetricScope('adjustment')}
                            disabled
                            title="Ajuste técnico é restrito a gestores e perfis internos MX."
                            className={cn('h-mx-9 flex-1 px-4 rounded-mx-full text-mx-tiny uppercase font-black sm:flex-none sm:px-6', metricScope === 'adjustment' && 'bg-mx-amber-400 text-mx-black')}
                        >
                            AJUSTE TÉCNICO
                        </Button>
                    </div>
                    <label htmlFor="checkin-reference-date" className="flex w-full items-center gap-mx-xs bg-white border border-border-default px-5 h-mx-12 rounded-mx-full shadow-mx-sm sm:w-auto">
                        <CalendarDays size={16} className="text-brand-primary" />
                        <input
                            id="checkin-reference-date"
                            name="reference_date"
                            type="date"
                            value={customReferenceDate}
                            onChange={e => setCustomReferenceDate(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-black uppercase text-text-primary outline-none sm:w-mx-32 sm:text-mx-tiny"
                            aria-label="Data de referência do lançamento"
                        />
                    </label>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                <Badge variant={isLate ? 'warning' : 'success'} className="px-5 py-2 rounded-mx-full uppercase tracking-widest font-black">
                    {isLate ? `Após ${CHECKIN_DEADLINE_LABEL}` : `Até ${CHECKIN_DEADLINE_LABEL}`}
                </Badge>
                {historicalCheckin && (
                    <Badge variant={canEditExisting || metricScope === 'adjustment' ? 'success' : 'outline'} className="px-6 py-2 rounded-mx-full uppercase tracking-widest font-black">
                        {canEditExisting || metricScope === 'adjustment' ? 'Edição Habilitada' : 'Visualização Somente'}
                    </Badge>
                )}
                <div className={cn(
                    'w-full rounded-mx-xl border px-mx-md py-mx-sm text-left sm:w-auto',
                    canEditExisting ? 'border-status-success/20 bg-status-success-surface' : 'border-status-error/20 bg-status-error-surface',
                )}>
                    <Typography variant="tiny" tone={canEditExisting ? 'success' : 'error'} className="font-black uppercase tracking-tight">
                        {deadlineMessage}
                    </Typography>
                </div>
                <Button variant="outline" size="icon" onClick={handleExit} aria-label="Voltar ao início" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm">
                    <X size={24} />
                </Button>
            </div>
        </header>
    )
}
