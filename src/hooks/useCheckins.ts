import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin, CheckinFormData, CheckinWithTotals, CheckinScope } from '@/types/database'
import { calcularTotais } from '@/lib/calculations'
import { canCreateAdjustment } from '@/lib/auth/capabilities'

export const CHECKIN_DEADLINE_MINUTES = 9 * 60 + 30
export const CHECKIN_EDIT_LIMIT_MINUTES = 9 * 60 + 45
export const CHECKIN_DEADLINE_LABEL = '09:30'
export const CHECKIN_EDIT_LIMIT_LABEL = '09:45'
export const MX_TIMEZONE = 'America/Sao_Paulo'
export const CHECKIN_ZERO_REASONS = ['Folga', 'Treinamento', 'Feriado', 'Dia administrativo', 'Outro'] as const
export const CHECKIN_MAX_INPUT_VALUE = 999
const CHECKIN_SELECT = 'id, seller_user_id, store_id, reference_date, submitted_at, metric_scope, submission_status, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day, zero_reason, note, submitted_late, edit_locked_at, created_by, updated_at'

function withCheckinTotals(checkin: DailyCheckin): CheckinWithTotals {
    const normalized = { ...checkin, is_venda_loja: checkin.is_venda_loja ?? false }
    return { ...normalized, ...calcularTotais(normalized) }
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
    // Atraso começa depois de 09:30; exatamente 09:30 ainda é no prazo.
    return minutesSinceSaoPauloStartOfDay(baseDate) > CHECKIN_DEADLINE_MINUTES
}

export function canEditCurrentCheckin(baseDate = new Date()): boolean {
    // Edição/envio diário é permitido até 09:45 inclusive; 09:46 bloqueia.
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
    const { profile, storeId: authStoreId, role } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [todayCheckin, setTodayCheckin] = useState<CheckinWithTotals | null>(null)
    const [error, setError] = useState<string | null>(null)

    const referenceDate = calculateReferenceDate()

    const fetchCheckins = useCallback(async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)

        // Otimização: Selecionar apenas colunas de métricas e identificação
        let query = supabase.from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('store_id', storeId)
            .order('reference_date', { ascending: false })

        if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
        if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
        if (filters?.userId) query = query.eq('seller_user_id', filters.userId)

        const { data, error } = await query
        if (error) {
            console.error('Audit Error [useCheckins]: fetchCheckins fail ->', error.message)
            setError('Não foi possível carregar os lançamentos.')
            setCheckins([])
        } else if (data) {
            setCheckins((data as DailyCheckin[]).map(withCheckinTotals))
        }
        setLoading(false)
    }, [storeId])

    const fetchTodayCheckin = useCallback(async () => {
        if (!profile || !storeId) {
            setTodayCheckin(null)
            return
        }
        const { data, error } = await supabase
            .from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('seller_user_id', profile.id)
            .eq('store_id', storeId)
            .eq('reference_date', referenceDate)
            .eq('metric_scope', 'daily')
            .maybeSingle()
        
        if (error) {
            console.error('Audit Error [useCheckins]: fetchTodayCheckin fail ->', error.message)
            setError('Não foi possível carregar o lançamento oficial do dia.')
            setTodayCheckin(null)
        } else if (data) setTodayCheckin(withCheckinTotals(data as DailyCheckin))
        else setTodayCheckin(null)
    }, [profile, storeId, referenceDate])

    const fetchCheckinByDate = useCallback(async (date: string, scope: string = 'daily') => {
        if (!profile || !storeId) return null
        const { data, error } = await supabase
            .from('lancamentos_diarios')
            .select(CHECKIN_SELECT)
            .eq('seller_user_id', profile.id)
            .eq('store_id', storeId)
            .eq('reference_date', date)
            .eq('metric_scope', scope)
            .maybeSingle()
        
        if (error) {
            console.error('Audit Error [useCheckins]: fetchCheckinByDate fail ->', error.message)
            setError('Não foi possível carregar o lançamento desta data.')
            return null
        }
        return data ? withCheckinTotals(data as DailyCheckin) : null
    }, [profile, storeId])

    const saveCheckin = async (formData: CheckinFormData, scope: CheckinScope = 'daily', customDate?: string): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }
        if (scope === 'adjustment' && !canCreateAdjustment(role)) {
            return { error: 'Ajuste técnico é restrito a gestores e perfis internos MX.' }
        }
        
        const finalDate = customDate || formData.reference_date || referenceDate
        const dateError = validateCheckinSubmissionDate(finalDate, referenceDate, scope)
        if (dateError) return { error: dateError }

        const isDaily = scope === 'daily' && finalDate === referenceDate

        if (isDaily && !canEditCurrentCheckin()) {
            return { error: `Lançamentos diários ficam disponíveis somente até ${CHECKIN_EDIT_LIMIT_LABEL}.` }
        }

        const normalizeText = (str?: string | null) => {
            const trimmed = str?.trim()
            return trimmed || null
        }

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
            zero_reason: normalizeText(formData.zero_reason),
            note: normalizeText(formData.note),
        }

        const { data, error } = await supabase.rpc('submit_checkin', { p_payload: payload })

        if (error) return { error: error.message }
        const result = data as { ok?: boolean; error?: string } | null
        if (!result?.ok) return { error: result?.error || 'Não foi possível salvar o check-in.' }
        await Promise.all([fetchTodayCheckin(), fetchCheckins()])
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
        refetch: fetchCheckins, // Alias para consistência MX
        referenceDate, 
        fetchCheckinByDate,
        error,
    }
}


export function useMyCheckins() {
    const { profile, storeId } = useAuth()
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async (filters?: { startDate?: string; endDate?: string }) => {
        if (!profile || !storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            let query = supabase.from('lancamentos_diarios').select(CHECKIN_SELECT)
                .eq('seller_user_id', profile.id).eq('store_id', storeId).order('reference_date', { ascending: false })
            if (filters?.startDate) query = query.gte('reference_date', filters.startDate)
            if (filters?.endDate) query = query.lte('reference_date', filters.endDate)
            const { data, error: queryError } = await query
            if (queryError) throw queryError
            setCheckins(((data || []) as DailyCheckin[]).map(withCheckinTotals))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useMyCheckins]: fetch fail ->', message)
            setError('Não foi possível carregar o histórico de lançamentos.')
            setCheckins([])
        } finally {
            setLoading(false)
        }
    }, [profile, storeId])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, error, refetch: fetch }
}

export function useCheckinsByDateRange(storeId: string | null, startDate: string, endDate: string) {
    const [checkins, setCheckins] = useState<CheckinWithTotals[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async () => {
        if (!storeId) {
            setCheckins([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const { data, error: queryError } = await supabase
                .from('lancamentos_diarios')
                .select(CHECKIN_SELECT)
                .eq('store_id', storeId)
                .eq('metric_scope', 'daily')
                .gte('reference_date', startDate)
                .lte('reference_date', endDate)
                .order('reference_date', { ascending: false })

            if (queryError) throw queryError
            setCheckins(((data || []) as DailyCheckin[]).map(withCheckinTotals))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro desconhecido'
            console.error('Audit Error [useCheckinsByDateRange]: fetch fail ->', message)
            setError('Não foi possível carregar os lançamentos do período.')
            setCheckins([])
        } finally {
            setLoading(false)
        }
    }, [storeId, startDate, endDate])

    useEffect(() => { fetch() }, [fetch])
    return { checkins, loading, error, refetch: fetch }
}
