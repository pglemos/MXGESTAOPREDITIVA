import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, UserCheck, Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
    calcularProjecao, getDiasInfo, calcularAtingimento, somarVendas 
} from '@/lib/calculations'

export default function MorningReport() {
    const { profile, membership, storeId, role } = useAuth()
    
    // Hooks de dados canônicos
    const { checkins, loading: loadingCheckins, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals: refetchGoals } = useGoals()
    const { metaRules, loading: loadingMetaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, loading: loadingRanking, refetch: refetchRanking } = useRanking()
    const { sellers, loading: loadingTeam, refetch: refetchTeam } = useTeam()
    
    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR }), [referenceDate])
    
    const metrics = useMemo(() => {
        // Vendas do mês (referência até ontem)
        const currentSales = somarVendas(checkins)
        const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
        
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        const projectedReaching = calcularAtingimento(projection, teamGoal)
        const gap = Math.max(teamGoal - currentSales, 0)
        
        // Vendedores que já lançaram hoje (referência ao fechamento de ontem)
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const pendingSellers = (sellers || []).filter(s => !s.checkin_today)
        
        return {
            currentSales,
            teamGoal,
            projection,
            reaching,
            projectedReaching,
            gap,
            checkedInCount,
            pendingSellers
        }
    }, [checkins, metaRules, storeGoal, daysInfo, sellers])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([
                refetchCheckins(),
                refetchGoals(),
                fetchMetaRules(),
                refetchRanking(),
                refetchTeam()
            ])
            toast.success('Dados sincronizados com sucesso!')
        } catch (err) {
            toast.error('Erro ao atualizar dados.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    const handleWhatsAppShare = async () => {
        if (role !== 'admin' && role !== 'gerente') {
            toast.error('Apenas administradores ou gerentes podem realizar o disparo oficial.')
            return
        }
        if (!profile || !storeId) {
            toast.error('Sessão inválida para registrar compartilhamento.')
            return
        }

        const rankingText = (ranking || []).slice(0, 5)
            .map(item => `${item.position}º ${item.user_name} - ${item.vnd_total}v (${item.atingimento}%)`)
            .join('\n') || 'Sem ranking acumulado.'
            
        const pendingText = metrics.pendingSellers.length > 0 
            ? metrics.pendingSellers.map(s => s.name).join(', ') 
            : 'Todos registraram.'
            
        const storeName = membership?.store?.name || 'LOJA MX'

        const message = [
            `*BOM DIA, EQUIPE!* 🚀`,
            ``,
            `*MATINAL OFICIAL - ${storeName}*`,
            `Referência: ${referenceDateLabel}`,
            ``,
            `*FALTA POUCO / META*`,
            `• Meta do Mês: ${metrics.teamGoal}`,
            `• Vendido: ${metrics.currentSales} (${metrics.reaching}%)`,
            `• Projeção: ${metrics.projection}`,
            `• Gap (Faltam): ${metrics.gap}`,
            ``,
            `*DISCIPLINA OPERACIONAL*`,
            `• Registrados: ${metrics.checkedInCount}/${(sellers || []).length}`,
            `• Sem Registro: ${pendingText}`,
            ``,
            `*RANKING ACUMULADO*`,
            rankingText,
            ``,
            `_Gerado via MX Gestão Preditiva_`,
        ].join('\n')

        if (navigator.share) {
            try {
                await navigator.share({ text: message })
                await registerShareLog(message, 'native_share')
            } catch (err) {
                // User cancelled or error
            }
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
            await registerShareLog(message, 'whatsapp')
        }
    }

    const registerShareLog = async (text: string, via: string) => {
        if (!storeId || !profile) return
        await supabase.from('whatsapp_share_logs').insert({
            store_id: storeId,
            user_id: profile.id,
            reference_date: referenceDate,
            source: 'morning_report',
            message_text: text,
            shared_via: via,
        })
        toast.success('Compartilhamento registrado com sucesso.')
    }

    const handleSendEmail = async () => {
        setIsSendingEmail(true)
        try {
            const { error } = await supabase.functions.invoke('relatorio-matinal', {
                body: { store_id: storeId, force: true }
            })
            if (error) throw error
            toast.success('Relatório disparado para os destinatários oficiais!')
        } catch (err: any) {
            console.error('Erro no Edge Function:', err)
            toast.error('Falha ao acionar motor de e-mail.')
        } finally {
            setIsSendingEmail(false)
        }
    }

    const handleExportSpreadsheet = () => {
        const headers = ["Vendedor", "Leads", "Agendamentos Hoje", "Visitas D-1", "Vendas D-1", "Atingimento", "Status"]
        const rows = (ranking || []).map(r => {
            const seller = sellers?.find(s => s.id === r.user_id)
            return [
                r.user_name,
                r.leads,
                r.agd_total,
                r.visitas,
                r.vnd_total,
                `${r.atingimento}%`,
                seller?.checkin_today ? 'OK' : 'SEM REGISTRO'
            ]
        })

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `matinal_mx_${storeId}_${referenceDate}.csv`)
        link.click()
        toast.success('Planilha operacional gerada.')
    }

    const isLoading = loadingCheckins || loadingGoals || loadingMetaRules || loadingRanking || loadingTeam

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-white">
            <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Consolidando Matinal Oficial...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-8 p-4 md:p-8 overflow-y-auto no-scrollbar bg-slate-50/30">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-12 bg-indigo-600 rounded-full" />
                    <div>
                        <span className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] block mb-1">Unidade Operacional</span>
                        <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Matinal Oficial</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button 
                        onClick={handleRefresh} 
                        disabled={isRefetching}
                        className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button 
                        onClick={handleExportSpreadsheet}
                        className="h-12 px-6 rounded-xl bg-white border border-gray-200 text-slate-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FileDown size={18} /> Planilha
                    </button>
                    <button 
                        onClick={handleWhatsAppShare}
                        className="h-12 px-6 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                        <MessageCircle size={18} /> WhatsApp
                    </button>
                    <button 
                        onClick={handleSendEmail} 
                        disabled={isSendingEmail}
                        className="h-12 px-6 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200"
                    >
                        {isSendingEmail ? <RefreshCw size={18} className="animate-spin" /> : <Mail size={18} />}
                        {isSendingEmail ? 'Enviando...' : 'E-mail Oficial'}
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 shrink-0">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><Target size={20} /></div>
                            <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black tracking-widest px-2 py-1 uppercase">Meta Mês</Badge>
                        </div>
                        <p className="text-5xl font-black text-slate-950 tracking-tighter font-mono-numbers leading-none mb-2">{metrics.teamGoal}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Vendido: {metrics.currentSales} ({metrics.reaching}%)</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shadow-inner"><TrendingUp size={20} /></div>
                            <Badge className="bg-white/10 text-white border-none text-[8px] font-black tracking-widest px-2 py-1 uppercase">Projeção MX</Badge>
                        </div>
                        <p className="text-5xl font-black text-white tracking-tighter font-mono-numbers leading-none mb-2">{metrics.projection}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Falta X: {metrics.gap} unidades</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn("p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden transition-colors", metrics.pendingSellers.length > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", metrics.pendingSellers.length > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                                {metrics.pendingSellers.length > 0 ? <AlertTriangle size={20} /> : <UserCheck size={20} />}
                            </div>
                            <Badge className={cn("border-none text-[8px] font-black tracking-widest px-2 py-1 uppercase", metrics.pendingSellers.length > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>Disciplina</Badge>
                        </div>
                        <p className={cn("text-5xl font-black tracking-tighter font-mono-numbers leading-none mb-2", metrics.pendingSellers.length > 0 ? "text-rose-600" : "text-emerald-600")}>
                            {metrics.checkedInCount}/{sellers.length}
                        </p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest leading-none", metrics.pendingSellers.length > 0 ? "text-rose-400" : "text-emerald-400")}>
                            {metrics.pendingSellers.length > 0 ? `${metrics.pendingSellers.length} Sem Registro Hoje` : 'Equipe 100% Sincronizada'}
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
                <div className="xl:col-span-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-gray-100 bg-slate-50/30 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Grade Operacional</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Auditado em {referenceDateLabel}</p>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{referenceDateLabel}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-gray-100">
                                        <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Especialista</th>
                                        <th className="py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Leads</th>
                                        <th className="py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Agend.</th>
                                        <th className="py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Visitas</th>
                                        <th className="py-4 text-center text-[9px] font-black text-indigo-600 uppercase tracking-widest">Vendas</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Registro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(ranking || []).map((r) => {
                                        const seller = sellers?.find(s => s.id === r.user_id)
                                        const isRegistered = seller?.checkin_today
                                        return (
                                            <tr key={r.user_id} className="hover:bg-slate-50/30 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                                                            {r.user_name.substring(0, 2)}
                                                        </div>
                                                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{r.user_name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center font-black text-slate-600 tabular-nums text-sm">{r.leads}</td>
                                                <td className="text-center font-black text-slate-600 tabular-nums text-sm">{r.agd_total}</td>
                                                <td className="text-center font-black text-slate-600 tabular-nums text-sm">{r.visitas}</td>
                                                <td className="text-center font-black text-indigo-600 tabular-nums text-lg">{r.vnd_total}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest px-3 py-1 border-none",
                                                        isRegistered ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {isRegistered ? 'OK' : 'FALTA'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> Foco do Dia
                        </h4>
                        <div className="space-y-4">
                            {[
                                { title: 'Cobrar Sem Registro', desc: `${metrics.pendingSellers.length} vendedores pendentes`, priority: 'Alta' },
                                { title: 'Validar Agendamentos', desc: 'Conferir agenda internet D-0', priority: 'Alta' },
                                { title: 'Recuperar Leads D-1', desc: 'Focar em taxa de visita', priority: 'Média' }
                            ].map((task, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{task.title}</p>
                                        <Badge className="bg-white border-gray-200 text-slate-400 text-[7px] font-black uppercase">{task.priority}</Badge>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{task.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 text-center">
                            <BarChart3 className="mx-auto mb-4 opacity-40" size={32} />
                            <h5 className="text-xs font-black uppercase tracking-[0.2em] mb-2 leading-tight">Ritmo Diário Ideal</h5>
                            <p className="text-3xl font-black tracking-tighter mb-4 tabular-nums">
                                {(metrics.gap / Math.max(daysInfo.total - daysInfo.decorridos, 1)).toFixed(1)}
                            </p>
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-relaxed">
                                Vendas necessárias por dia para atingir 100% da meta oficial.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
