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
        const { error } = await supabase.from('checkin_correction_requests').insert({
            checkin_id: checkinId,
            seller_id: profile.id,
            store_id: storeId,
            requested_values: requestedValues,
            reason,
            status: 'pending'
        })
        setLoading(false)
        return { error: error?.message || null }
    }

    /** Gerente busca solicitações pendentes da sua loja */
    const fetchPendingRequests = useCallback(async () => {
        if (!storeId) return []
        const { data } = await supabase
            .from('checkin_correction_requests')
            .select('*, seller:usuarios(name)')
            .eq('store_id', storeId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        return data || []
    }, [storeId])

    /** Gerente aprova e aplica a correção via RPC Segura */
    const approveRequest = async (request: CheckinCorrectionRequest) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        setLoading(true)

        try {
            const { error } = await supabase.rpc('approve_correction_request', { 
                request_id: request.id 
            })

            if (error) throw error
            return { error: null }
        } catch (err: unknown) {
            console.error('Audit Error [useCheckinAuditor]: approveRequest fail ->', err)
            return { error: err instanceof Error ? err.message : String(err) }
        } finally {
            setLoading(false)
        }
    }

    /** Gerente rejeita a solicitação via RPC Segura */
    const rejectRequest = async (requestId: string) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        setLoading(true)
        try {
            const { error } = await supabase.rpc('reject_correction_request', { 
                request_id: requestId 
            })
            if (error) throw error
            return { error: null }
        } catch (err: unknown) {
            console.error('Audit Error [useCheckinAuditor]: rejectRequest fail ->', err)
            return { error: err instanceof Error ? err.message : String(err) }
        } finally {
            setLoading(false)
        }
    }

    return { loading, requestCorrection, fetchPendingRequests, approveRequest, rejectRequest }
}
