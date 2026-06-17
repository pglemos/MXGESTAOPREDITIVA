import { motion } from 'motion/react'
import { RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Typography } from '@/components/atoms/Typography'
import { CheckinHeader } from './sections/CheckinHeader'
import { CheckinForm } from './sections/CheckinForm'
import { CheckinAdjustmentTab } from './sections/CheckinAdjustmentTab'
import { CheckinErrorBoundary } from './components/CheckinErrorBoundary'
import { useCheckinPage } from './hooks/useCheckinPage'

/**
 * Checkin.container — orquestra a tela de lançamento diário (UX-001 / ADR-0050).
 * Mantém estados intermediários (loading, sem permissão) e compõe header/form.
 */
export function Checkin() {
    const { role } = useAuth()
    const ctx = useCheckinPage()
    const {
        hookLoading,
        referenceDate,
        checkinLoadError,
        showConfetti,
        totals,
        isLate,
        historicalCheckin,
        canEditExisting,
        metricScope,
        setMetricScope,
        customReferenceDate,
        setCustomReferenceDate,
        deadlineMessage,
        handleExit,
    } = ctx

    if (hookLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
                <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
                <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Terminal...</Typography>
            </div>
        )
    }

    if (role !== 'vendedor') {
        return (
            <main className="h-full w-full flex flex-col items-center justify-center text-center p-mx-xl bg-white">
                <ShieldCheck size={64} className="text-text-tertiary/20 mb-8" aria-hidden="true" />
                <Typography variant="h2" className="mb-4">Acesso Reservado</Typography>
                <Typography variant="p" tone="muted" className="max-w-sm mx-auto uppercase tracking-widest leading-relaxed opacity-60">O lançamento diário operacional é restrito ao corpo de vendas. Gestores e equipe MX auditam via malha de rede.</Typography>
            </main>
        )
    }

    const todayDisplay = new Date(referenceDate + 'T12:00:00')
    const dateStr = todayDisplay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <main className="w-full h-full flex flex-col gap-mx-md p-mx-sm md:p-mx-md overflow-y-auto no-scrollbar bg-surface-alt relative">
            {checkinLoadError && (
                <div role="alert" className="rounded-mx-2xl border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm text-sm font-bold text-status-error">
                    {checkinLoadError}
                </div>
            )}

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm" aria-hidden="true">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.25, 1], rotate: 0 }} className="flex h-mx-32 w-mx-32 items-center justify-center rounded-mx-4xl bg-brand-primary text-white shadow-mx-2xl">
                        <Sparkles size={64} aria-hidden="true" />
                    </motion.div>
                </div>
            )}

            <CheckinErrorBoundary section="header">
                <CheckinHeader
                    dateStr={dateStr}
                    metricScope={metricScope}
                    setMetricScope={setMetricScope}
                    customReferenceDate={customReferenceDate}
                    setCustomReferenceDate={setCustomReferenceDate}
                    isLate={isLate}
                    historicalCheckin={historicalCheckin}
                    canEditExisting={canEditExisting}
                    deadlineMessage={deadlineMessage}
                    handleExit={handleExit}
                />
            </CheckinErrorBoundary>

            <CheckinErrorBoundary section="form">
                {metricScope === 'daily' ? (
                    <CheckinForm ctx={ctx} totalsAgd={totals.agd_total} totalsVnd={totals.vnd_total} />
                ) : (
                    <CheckinAdjustmentTab ctx={ctx} />
                )}
            </CheckinErrorBoundary>
        </main>
    )
}

export default Checkin
