import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, identificarGargalo } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import type { Benchmark } from '@/types/database'
import { GitBranch, AlertTriangle, CheckCircle } from 'lucide-react'

export default function Funil() {
    const { storeId } = useAuth()
    const { checkins, loading } = useCheckins()
    const [benchmark, setBenchmark] = useState<Benchmark | null>(null)

    useEffect(() => {
        if (storeId) supabase.from('benchmarks').select('*').eq('store_id', storeId).single().then(({ data }) => { if (data) setBenchmark(data) })
    }, [storeId])

    const funil = calcularFunil(checkins)
    const diagnostic = benchmark ? identificarGargalo(funil, benchmark) : null

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    const steps = [
        { label: 'Leads', value: funil.leads, pct: 100, color: 'from-violet-500 to-violet-600', bench: null },
        { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, color: 'from-blue-500 to-blue-600', bench: benchmark?.lead_to_appt },
        { label: 'Visitas', value: funil.visitas, pct: funil.tx_agd_visita, color: 'from-amber-500 to-amber-600', bench: benchmark?.appt_to_visit },
        { label: 'Vendas', value: funil.vnd_total, pct: funil.tx_visita_vnd, color: 'from-emerald-500 to-emerald-600', bench: benchmark?.visit_to_sale },
    ]

    const maxValue = Math.max(funil.leads, 1)

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"><GitBranch size={20} className="text-white" /></div>
                <div><h1 className="text-xl font-bold text-white">Funil de Vendas</h1><p className="text-white/40 text-sm">Taxas de conversão da loja</p></div>
            </div>

            {/* Diagnostic */}
            {diagnostic && (
                <div className={`rounded-2xl p-4 border ${diagnostic.gargalo ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <div className="flex items-center gap-2">
                        {diagnostic.gargalo ? <AlertTriangle size={16} className="text-amber-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
                        <p className={`text-sm ${diagnostic.gargalo ? 'text-amber-300' : 'text-emerald-300'}`}>{diagnostic.mensagem}</p>
                    </div>
                </div>
            )}

            {/* Funnel bars */}
            <div className="space-y-4">
                {steps.map((step, i) => (
                    <div key={step.label}>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-white font-medium text-sm">{step.label}</span>
                            <div className="text-right">
                                <span className="text-white font-bold text-lg">{step.value}</span>
                                {i > 0 && <span className="text-white/40 text-xs ml-1">({step.pct}%{step.bench ? ` / ${step.bench}%` : ''})</span>}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl h-8 overflow-hidden relative">
                            <div className={`bg-gradient-to-r ${step.color} h-full rounded-xl transition-all flex items-center justify-end pr-2`}
                                style={{ width: `${Math.max((step.value / maxValue) * 100, 5)}%` }}>
                            </div>
                            {step.bench && (
                                <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/30"
                                    style={{ left: `${step.bench}%` }} title={`Benchmark: ${step.bench}%`} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
