import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
    EMPTY_CRM_DERIVED_TOTALS,
    addDaysDateOnly,
    deriveCrmDerivedTotals,
    getSaoPauloDayRange,
} from '../lib/crm-derived-totals'

export interface CrmDerivedTotals {
    leads: number
    leads_cart: number
    leads_net: number
    vnd_porta: number
    vnd_cart: number
    vnd_net: number
    visitas: number
    visitas_porta: number
    visitas_cart: number
    visitas_net: number
    agd_cart: number
    agd_net: number
    /** True when at least one CRM value is non-zero */
    hasCrmData: boolean
    loading: boolean
}

const EMPTY: CrmDerivedTotals = {
    ...EMPTY_CRM_DERIVED_TOTALS,
    loading: false,
}

/**
 * useCrmDerivedTotals — queries CRM tables to auto-populate D-1 checkin fields.
 *
 * - referenceDate: the date being reported on (YYYY-MM-DD, "D-1" date)
 * - today: used to count agendamentos scheduled for the current day
 *
 * Returns zero-filled defaults when no CRM data exists so the form remains
 * backward-compatible.
 */
export function useCrmDerivedTotals(referenceDate: string): CrmDerivedTotals {
    const { supabaseUser } = useAuth()
    const [totals, setTotals] = useState<CrmDerivedTotals>({ ...EMPTY, loading: true })

    const derive = useCallback(async () => {
        if (!supabaseUser || !referenceDate) {
            setTotals({ ...EMPTY, loading: false })
            return
        }

        setTotals(prev => ({ ...prev, loading: true }))

        const referenceRange = getSaoPauloDayRange(referenceDate)
        const agendaDate = addDaysDateOnly(referenceDate, 1)
        const agendaRange = getSaoPauloDayRange(agendaDate)

        const [clientesResult, opResult, atResult, agdResult] = await Promise.all([
            supabase
                .from('clientes')
                .select('id, created_at, canal_origem')
                .eq('seller_user_id', supabaseUser.id)
                .gte('created_at', referenceRange.startIso)
                .lt('created_at', referenceRange.endIso),

            supabase
                .from('oportunidades')
                .select('id, etapa, canal, closed_at')
                .eq('seller_user_id', supabaseUser.id)
                .eq('etapa', 'ganho')
                .gte('closed_at', referenceRange.startIso)
                .lt('closed_at', referenceRange.endIso),

            supabase
                .from('atendimentos')
                .select('id, data, canal')
                .eq('seller_user_id', supabaseUser.id)
                .eq('data', referenceDate),

            supabase
                .from('agendamentos')
                .select('id, canal, data_hora')
                .eq('seller_user_id', supabaseUser.id)
                .gte('data_hora', agendaRange.startIso)
                .lt('data_hora', agendaRange.endIso),
        ])

        if (clientesResult.error || opResult.error || atResult.error || agdResult.error) {
            setTotals({ ...EMPTY, loading: false })
            return
        }

        setTotals({
            ...deriveCrmDerivedTotals({
                referenceDate,
                clientes: clientesResult.data ?? [],
                oportunidades: opResult.data ?? [],
                atendimentos: atResult.data ?? [],
                agendamentos: agdResult.data ?? [],
            }),
            loading: false,
        })
    }, [supabaseUser, referenceDate])

    useEffect(() => { void derive() }, [derive])

    return totals
}
