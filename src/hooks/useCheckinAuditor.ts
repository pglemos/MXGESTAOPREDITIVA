import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CheckinCorrectionRequest, CheckinFormData, DailyCheckin } from '@/types/database'

export function useCheckinAuditor(storeIdOverride?: string) {
    const { profile, storeId: authStoreId } = useAuth()
    const storeId = storeIdOverride || authStoreId
    const [loading, setLoading] = useState(false)

    /** Vendedor solicita correção */
    const requestCorrection = async (checkinId: string, requestedValues: CheckinFormData, reason: string) => {
        if (!profile?.id || !storeId) return { error: 'Sessão inválida' }
        
        setLoading(true)
        const { data, error } = await supabase.rpc('solicitar_regularizacao_fechamento', {
            p_checkin_id: checkinId,
            p_requested_values: requestedValues,
            p_reason: reason,
            p_idempotency_key: null,
        })
        setLoading(false)
        const result = data as { ok?: boolean; error?: string; data?: { id?: string } } | null
        return { error: error?.message || result?.error || null, id: result?.data?.id }
    }

    /** Gerente busca solicitações pendentes da sua loja */
    const fetchPendingRequests = useCallback(async () => {
        if (!storeId) return []
        const { data, error } = await supabase
            .from('solicitacoes_correcao_lancamento')
            .select('*, seller:usuarios!checkin_correction_requests_seller_id_fkey(name, avatar_url)')
            .eq('store_id', storeId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        if (error) throw error
        return data || []
    }, [storeId])

    /** Gerente aprova e aplica a correção via RPC Segura */
    const approveRequest = async (request: CheckinCorrectionRequest) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        setLoading(true)

        try {
            const { data, error } = await supabase.rpc('aplicar_regularizacao_fechamento', {
                p_request_id: request.id,
            })

            if (error) throw error
            const result = data as { ok?: boolean; error?: string } | null
            if (!result?.ok) throw new Error(result?.error || 'Não foi possível aplicar a regularização.')
            return { error: null }
        } catch (err: unknown) {
            console.error('Audit Error [useCheckinAuditor]: approveRequest fail ->', err)
            return { error: err instanceof Error ? err.message : String(err) }
        } finally {
            setLoading(false)
        }
    }

    /** Gerente rejeita a solicitação via RPC Segura */
    const rejectRequest = async (requestId: string, reason?: string) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        setLoading(true)
        try {
            const { data, error } = await supabase.rpc('rejeitar_regularizacao_fechamento', {
                p_request_id: requestId,
                p_reason: reason || null,
            })
            if (error) throw error
            const result = data as { ok?: boolean; error?: string } | null
            if (!result?.ok) throw new Error(result?.error || 'Não foi possível rejeitar a regularização.')
            return { error: null }
        } catch (err: unknown) {
            console.error('Audit Error [useCheckinAuditor]: rejectRequest fail ->', err)
            return { error: err instanceof Error ? err.message : String(err) }
        } finally {
            setLoading(false)
        }
    }

    const cancelRequest = async (requestId: string) => {
        const { data, error } = await supabase.rpc('cancelar_regularizacao_fechamento', { p_request_id: requestId })
        const result = data as { ok?: boolean; error?: string } | null
        return { error: error?.message || result?.error || null }
    }

    return { loading, requestCorrection, fetchPendingRequests, approveRequest, rejectRequest, cancelRequest }
}
