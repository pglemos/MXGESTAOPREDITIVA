import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin, CheckinFormData, CheckinWithTotals, CheckinScope } from '@/types/database'
import { calcularTotais } from '@/lib/calculations'

export const CHECKIN_DEADLINE_MINUTES = 9 * 60 + 30
export const CHECKIN_EDIT_LIMIT_MINUTES = 9 * 60 + 45
export const CHECKIN_DEADLINE_LABEL = '09:30'
export const CHECKIN_EDIT_LIMIT_LABEL = '09:45'
const MX_TIMEZONE = 'America/Sao_Paulo'
const CHECKIN_SELECT = 'id, seller_user_id, store_id, reference_date, submitted_at, metric_scope, submission_status, is_venda_loja, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day, zero_reason, note, submitted_late, edit_locked_at, created_by, updated_at'

function withCheckinTotals(checkin: DailyCheckin): CheckinWithTotals {
    return { ...checkin, ...calcularTotais(checkin) }
}

function getSaoPauloParts(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: MX_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date)

    const byType = new Map(parts.map(part => [part.type, part.value]))
    return {
        year: Number(byType.get('year')),
        month: Number(byType.get('month')),
        day: Number(byType.get('day')),
        hour: Number(byType.get('hour')),
        minute: Number(byType.get('minute')),
    }
}

function formatDateParts(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function minutesSinceSaoPauloStartOfDay(date: Date) {
    const parts = getSaoPauloParts(date)
    return parts.hour * 60 + parts.minute
}

// Regra MX: envio acontece hoje, mas a produção declarada se refere sempre ao dia anterior.
export function calculateReferenceDate(baseDate = new Date()): string {
    const parts = getSaoPauloParts(baseDate)
    const saoPauloCalendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
    saoPauloCalendarDate.setUTCDate(saoPauloCalendarDate.getUTCDate() - 1)
    return saoPauloCalendarDate.toISOString().split('T')[0]
}

export function isCheckinLate(baseDate = new Date()): boolean {
    return minutesSinceSaoPauloStartOfDay(baseDate) > CHECKIN_DEADLINE_MINUTES
}

export function canEditCurrentCheckin(baseDate = new Date()): boolean {
    return minutesSinceSaoPauloStartOfDay(baseDate) <= CHECKIN_EDIT_LIMIT_MINUTES
}

export function getCheckinEditLockedAt(baseDate = new Date()): string {
    const parts = getSaoPauloParts(baseDate)
    const lockDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 45, 0, 0))
    return lockDate.toISOString()
}

export function validateCheckinSubmissionDate(finalDate: string, officialReferenceDate: string, scope: CheckinScope): string | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
        return 'Data de referência inválida.'
    }

    if (finalDate > officialReferenceDate) {
        return 'Lançamentos não podem usar data futura ou o dia corrente.'
    }

    if (scope === 'daily' && finalDate !== officialReferenceDate) {
        return 'Registro diário aceita somente a referência oficial. Use ajuste técnico para datas retroativas.'
    }

    return null
}

export function useCheckins(storeIdOverride?: string) {
    const { profile, storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [todayCheckin, setTodayCheckin] = useState<CheckinWithTotals | null>(null)

    const referenceDate = calculateReferenceDate()

    const fetchCheckins = useCallback(async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)

        // Otimização: Selecionar apenas colunas de métricas e identificação
        let query = supabase.from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('store_id', storeId)
            .order('reference_date', { ascending: false })

        if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
        if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
        if (filters?.userId) query = query.eq('seller_user_id', filters.userId)

        const { data, error } = await query
        if (!error && data) {
            setCheckins((data as DailyCheckin[]).map(withCheckinTotals))
        }
        setLoading(false)
    }, [storeId])

    const fetchTodayCheckin = useCallback(async () => {
        if (!profile || !storeId) {
            setTodayCheckin(null)
            return
        }
        const { data } = await supabase
            .from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('seller_user_id', profile.id)
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)
            .eq('metric_scope', 'daily')
            .maybeSingle()
        
        if (data) setTodayCheckin(withCheckinTotals(data as DailyCheckin))
        else setTodayCheckin(null)
    }, [profile, storeId, referenceDate])

    const fetchCheckinByDate = useCallback(async (date: string, scope: string = 'daily') => {
        if (!profile || !storeId) return null
        const { data } = await supabase
            .from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('seller_user_id', profile.id)
            .eq('store_id', storeId)
            .eq('reference_date', date)
            .eq('metric_scope', scope)
            .maybeSingle()
        
        return data ? withCheckinTotals(data as DailyCheckin) : null
    }, [profile, storeId])

    const saveCheckin = async (formData: CheckinFormData, scope: CheckinScope = 'daily', customDate?: string): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }
        
        const finalDate = customDate || formData.reference_date || referenceDate
        const dateError = validateCheckinSubmissionDate(finalDate, referenceDate, scope)
        if (dateError) return { error: dateError }

        const isDaily = scope === 'daily' && finalDate === referenceDate

        if (isDaily && todayCheckin && !canEditCurrentCheckin()) {
            return { error: `Correções do lançamento diário ficam disponíveis somente até ${CHECKIN_EDIT_LIMIT_LABEL}.` }
        }

        const sanitize = (str?: string | null) => str ? str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m] || m)) : null

        const submittedAt = new Date()
        const payload = {
            seller_user_id: profile.id,
            store_id: storeId,
            reference_date: finalDate,
            submitted_at: submittedAt.toISOString(),
            metric_scope: scope,
            submitted_late: isDaily ? isCheckinLate(submittedAt) : false,
            submission_status: isDaily ? (isCheckinLate(submittedAt) ? 'late' : 'on_time') : 'on_time',
            edit_locked_at: isDaily ? getCheckinEditLockedAt(submittedAt) : null,
            leads_prev_day: formData.leads_prev_day ?? formData.leads,
            agd_cart_prev_day: formData.agd_cart_prev_day ?? formData.agd_cart_prev,
            agd_net_prev_day: formData.agd_net_prev_day ?? formData.agd_net_prev,
            agd_cart_today: formData.agd_cart_today ?? formData.agd_cart,
            agd_net_today: formData.agd_net_today ?? formData.agd_net,
            vnd_porta_prev_day: formData.vnd_porta_prev_day ?? formData.vnd_porta,
            vnd_cart_prev_day: formData.vnd_cart_prev_day ?? formData.vnd_cart,
            vnd_net_prev_day: formData.vnd_net_prev_day ?? formData.vnd_net,
            visit_prev_day: formData.visit_prev_day ?? formData.visitas,
            zero_reason: sanitize(formData.zero_reason) || null,
            note: sanitize(formData.note) || null,
        }

        const { error } = await supabase.from('lancamentos_diarios').upsert(payload, {
            onConflict: 'seller_user_id,store_id,reference_date,metric_scope'
        })

        if (error) return { error: error.message }
        await fetchTodayCheckin()
        return { error: null }
    }

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
        refetch: fetchTodayCheckin, // Alias para consistência MX
        referenceDate, 
        fetchCheckinByDate 
    }
}


export function useMyCheckins() {
    const { profile, storeId } = useAuth()
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
        if (!profile || !storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        let query = supabase.from('lancamentos_diarios').select(CHECKIN_SELECT)
            .eq('seller_user_id', profile.id).eq('store_id', storeId).order('reference_date', { ascending: false })
        if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
        if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
        const { data } = await query
        if (data) setCheckins((data as DailyCheckin[]).map(withCheckinTotals))
        setLoading(false)
    }, [profile, storeId])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, refetch: fetch }
}

export function useCheckinsByDateRange(storeId: string | null, startDate: string, endDate: string) {
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)

    const fetch = useCallback(async () => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('store_id', storeId)
            .eq('metric_scope', 'daily')
            .gte('reference_date', startDate)
            .lte('reference_date', endDate)
            .order('reference_date', { ascending: false })

        if (!error && data) {
            setCheckins((data as DailyCheckin[]).map(withCheckinTotals))
        }
        setLoading(false)
    }, [storeId, startDate, endDate])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, refetch: fetch }
}
