import { useMemo } from 'react'
import { 
    calcularAtingimento, 
    calcularProjecao, 
    calcularFaltaX, 
    getDiasInfo, 
    somarVendas, 
    somarVendasPorCanal 
} from '@/lib/calculations'

interface MetricsParams {
    checkins: any[]
    todayCheckin: any | null
    profile: any | null
    sellerGoals: any[]
    storeGoal: any | null
    ranking: any[]
    projectionMode?: 'calendar' | 'business'
}

export function useSellerMetrics({ 
    checkins, 
    todayCheckin, 
    profile, 
    sellerGoals, 
    storeGoal, 
    ranking,
    projectionMode = 'calendar'
}: MetricsParams) {
    return useMemo(() => {
        if (!profile?.id) return null

        const myCheckins = checkins.filter(c => c.seller_user_id === profile.id)
        const vendasMes = somarVendas(myCheckins)
        const porCanal = somarVendasPorCanal(myCheckins)
        const dias = getDiasInfo(undefined, projectionMode)

        const myGoal = sellerGoals.find(g => g.user_id === profile.id)
        const meta = myGoal?.target || (storeGoal ? Math.round(storeGoal.target / Math.max(ranking.length, 1)) : 0)
        
        const atingimento = calcularAtingimento(vendasMes, meta)
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        
        const myRank = ranking.find(r => r.user_id === profile.id)
        const myRankIndex = ranking.findIndex(r => r.user_id === profile.id)
        
        const competitors = {
            above: myRankIndex > 0 ? ranking[myRankIndex - 1] : null,
            below: myRankIndex < ranking.length - 1 ? ranking[myRankIndex + 1] : null
        }

        const yesterdayStr = new Date(); yesterdayStr.setDate(yesterdayStr.getDate() - 1)
        const yesterdayFormatted = yesterdayStr.toISOString().split('T')[0]
        const checkinOntem = myCheckins.find(c => c.reference_date === yesterdayFormatted)
        
        const vendasOntem = checkinOntem ? (checkinOntem.vnd_porta_prev_day || 0) + (checkinOntem.vnd_cart_prev_day || 0) + (checkinOntem.vnd_net_prev_day || 0) : 0
        const agendamentosHoje = todayCheckin ? (todayCheckin.agd_cart_today || 0) + (todayCheckin.agd_net_today || 0) : 0

        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        const weekStr = weekAgo.toISOString().split('T')[0]
        const vendasSemana = somarVendas(myCheckins.filter(c => c.reference_date >= weekStr))

        return { 
            vendasMes, 
            porCanal, 
            meta, 
            atingimento, 
            projecao, 
            faltaX,
            myRank, 
            vendasOntem, 
            agendamentosHoje, 
            vendasSemana, 
            competitors 
        }
    }, [checkins, profile, sellerGoals, storeGoal, ranking, todayCheckin])
}
