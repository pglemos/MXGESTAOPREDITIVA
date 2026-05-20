/**
 * useCheckins — shim compositor.
 *
 * @deprecated Use os sub-hooks de `@/hooks/checkins/*` diretamente quando possível.
 * Este hook permanece como API pública estável que compõe:
 *   - useCheckinsList
 *   - useCheckinsToday
 *   - useCheckinsByDate
 *   - useCheckinsSubmit
 *
 * Split realizado pela Story 2.10 (UX-002 / ADR-0051 — god-hook split).
 * Contrato público preservado: NADA muda do ponto de vista dos consumidores.
 */
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
    calculateReferenceDate,
    useCheckinsList,
    useCheckinsToday,
    useCheckinsByDate,
    useCheckinsSubmit,
} from './checkins'

// Re-exports de constantes/utilitários (mantém compatibilidade com imports legados)
export {
    CHECKIN_DEADLINE_MINUTES,
    CHECKIN_EDIT_LIMIT_MINUTES,
    CHECKIN_DEADLINE_LABEL,
    CHECKIN_EDIT_LIMIT_LABEL,
    MX_TIMEZONE,
    CHECKIN_ZERO_REASONS,
    CHECKIN_MAX_INPUT_VALUE,
    calculateReferenceDate,
    isCheckinLate,
    canEditCurrentCheckin,
    getCheckinEditLockedAt,
    validateCheckinSubmissionDate,
} from './checkins'

// Re-exports de hooks auxiliares
export { useMyCheckins, useCheckinsByDateRange } from './checkins'

export function useCheckins(storeIdOverride?: string) {
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId

    const referenceDate = calculateReferenceDate()

    const {
        checkins,
        loading,
        error: listError,
        setError: setListError,
        fetchCheckins,
    } = useCheckinsList(storeId)

    const {
        todayCheckin,
        error: todayError,
        fetchTodayCheckin,
    } = useCheckinsToday(profile, storeId, referenceDate)

    const { fetchCheckinByDate } = useCheckinsByDate(profile, storeId, setListError)

    const { saveCheckin } = useCheckinsSubmit({
        profile,
        storeId,
        role,
        referenceDate,
        afterSubmit: async () => {
            await Promise.all([fetchTodayCheckin(), fetchCheckins()])
        },
    })

    useEffect(() => { fetchCheckins() }, [fetchCheckins])
    useEffect(() => { fetchTodayCheckin() }, [fetchTodayCheckin])

    return {
        checkins,
        todayCheckin,
        loading,
        fetchCheckins,
        fetchTodayCheckin,
        saveCheckin,
        submitCheckin: saveCheckin, // Alias para consistência MX
        refetch: fetchCheckins,     // Alias para consistência MX
        referenceDate,
        fetchCheckinByDate,
        error: listError || todayError,
    }
}
