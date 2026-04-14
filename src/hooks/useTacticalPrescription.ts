import { useMemo } from 'react'
import { startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import type { DailyCheckin, Training } from '@/types/database'

interface PrescriptionParams {
    checkins: DailyCheckin[]
    trainings: Training[]
    userId?: string
}

export function useTacticalPrescription({ checkins, trainings, userId }: PrescriptionParams) {
    return useMemo(() => {
        if (!checkins.length || !trainings.length || !userId) return null
        
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
        const recentCheckins = checkins.filter(c => c.seller_user_id === userId && c.reference_date >= weekStart)
        
        if (recentCheckins.length === 0) return null

        const funil = calcularFunil(recentCheckins)
        const diag = gerarDiagnosticoMX(funil)
        
        if (!diag.gargalo) return null

        const categoryMap: Record<string, string> = {
            'LEAD_AGD': 'prospeccao',
            'AGD_VISITA': 'atendimento',
            'VISITA_VND': 'fechamento'
        }

        const category = categoryMap[diag.gargalo]
        const recommended = trainings.find(t => t.type === category)
        
        if (!recommended) return null

        return { 
            gargalo: diag.gargalo, 
            label: diag.diagnostico, 
            training: recommended 
        }
    }, [checkins, trainings, userId])
}
