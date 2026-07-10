import { supabase } from '@/lib/supabase'
import type { CheckinFormData, CheckinScope } from '@/types/database'
import { canCreateAdjustment } from '@/lib/auth/capabilities'
import {
    getCheckinEditLockedAt,
    isCheckinLate,
    validateCheckinSubmissionDate,
} from './types'

function getSaoPauloDateOnly(baseDate = new Date()): string {
return new Intl.DateTimeFormat('en-CA', {
timeZone: 'America/Sao_Paulo',
year: 'numeric',
month: '2-digit',
day: '2-digit',
}).format(baseDate)
}

export interface UseCheckinsSubmitArgs {
    profile: { id: string } | null
    storeId: string | null
    role: string | null | undefined
    referenceDate: string
    afterSubmit?: () => Promise<void> | void
}

/**
 * Hook responsável por submeter check-ins via RPC `submit_checkin`.
 * Encapsula validações de prazo, scope (daily vs adjustment) e payload normalization.
 */
export function useCheckinsSubmit(args: UseCheckinsSubmitArgs) {
    const { profile, storeId, role, referenceDate, afterSubmit } = args

    const saveCheckin = async (
        formData: CheckinFormData,
        scope: CheckinScope = 'daily',
        customDate?: string,
    ): Promise<{ error: string | null }> => {
        if (!profile || !storeId) return { error: 'Usuário não autenticado' }
        if (scope === 'adjustment' && !canCreateAdjustment(role)) {
            return { error: 'Ajuste técnico é restrito a gestores e perfis internos MX.' }
        }

        const finalDate = customDate || formData.reference_date || referenceDate
const dateError = validateCheckinSubmissionDate(finalDate, referenceDate, scope, getSaoPauloDateOnly())
        if (dateError) return { error: dateError }

 const isDaily = scope === 'daily' && finalDate <= getSaoPauloDateOnly()

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
            pontuacao_disciplina_base: formData.pontuacao_disciplina_base ?? null,
            fechamento_liberado: formData.fechamento_liberado ?? false,
        }

        const { data, error } = await supabase.rpc('submit_checkin', { p_payload: payload })

        if (error) return { error: error.message }
        const result = data as { ok?: boolean; error?: string } | null
        if (!result?.ok) return { error: result?.error || 'Não foi possível salvar o check-in.' }

        if (afterSubmit) await afterSubmit()
        return { error: null }
    }

    return { saveCheckin }
}
