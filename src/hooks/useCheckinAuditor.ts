import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CheckinCorrectionRequest, CheckinFormData, DailyCheckin } from '@/types/database'

export function useCheckinAuditor() {
    const { profile, storeId } = useAuth()
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
            .select('*, seller:users(name)')
            .eq('store_id', storeId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        return data || []
    }, [storeId])

    /** Gerente aprova e aplica a correção */
    const approveRequest = async (request: any) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        setLoading(true)

        try {
            // 1. Buscar valores antigos
            const { data: oldCheckin } = await supabase
                .from('daily_checkins')
                .select('*')
                .eq('id', request.checkin_id)
                .single()

            if (!oldCheckin) throw new Error('Check-in original não localizado')

            // 2. Preparar novos valores canônicos
            const newValues = {
                leads_prev_day: request.requested_values.leads ?? oldCheckin.leads_prev_day,
                visit_prev_day: request.requested_values.visitas ?? oldCheckin.visit_prev_day,
                vnd_porta_prev_day: request.requested_values.vnd_porta ?? oldCheckin.vnd_porta_prev_day,
                vnd_cart_prev_day: request.requested_values.vnd_cart ?? oldCheckin.vnd_cart_prev_day,
                vnd_net_prev_day: request.requested_values.vnd_net ?? oldCheckin.vnd_net_prev_day,
                agd_cart_today: request.requested_values.agd_cart ?? oldCheckin.agd_cart_today,
                agd_net_today: request.requested_values.agd_net ?? oldCheckin.agd_net_today,
                note: request.requested_values.note ?? oldCheckin.note,
                updated_at: new Date().toISOString()
            }

            // 3. Executar Transação Atômica (Update + Log + Close Request)
            // Nota: No Supabase Client direto não temos transação multi-tabela simples, 
            // mas usaremos uma sequência controlada (ou poderíamos usar uma RPC).
            // Para v1.1 usaremos sequência direta.

            const { error: updateError } = await supabase
                .from('daily_checkins')
                .update(newValues)
                .eq('id', request.checkin_id)

            if (updateError) throw updateError

            await supabase.from('checkin_audit_logs').insert({
                checkin_id: request.checkin_id,
                correction_request_id: request.id,
                changed_by: profile.id,
                old_values: oldCheckin,
                new_values: newValues,
                change_type: 'manual_correction'
            })

            await supabase
                .from('checkin_correction_requests')
                .update({ status: 'approved', auditor_id: profile.id, reviewed_at: new Date().toISOString() })
                .eq('id', request.id)

            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        } finally {
            setLoading(false)
        }
    }

    /** Gerente rejeita a solicitação */
    const rejectRequest = async (requestId: string) => {
        if (!profile?.id) return { error: 'Não autorizado' }
        const { error } = await supabase
            .from('checkin_correction_requests')
            .update({ status: 'rejected', auditor_id: profile.id, reviewed_at: new Date().toISOString() })
            .eq('id', requestId)
        return { error: error?.message || null }
    }

    return { loading, requestCorrection, fetchPendingRequests, approveRequest, rejectRequest }
}
