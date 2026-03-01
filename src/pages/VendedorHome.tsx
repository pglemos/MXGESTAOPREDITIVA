import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal } from '@/lib/calculations'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp, Trophy, CheckSquare, Car, Users, Globe, BarChart3, AlertTriangle } from 'lucide-react'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin } = useCheckins()
    const { storeGoal, sellerGoals } = useGoals()
    const { ranking } = useRanking()
    const navigate = useNavigate()

    const myCheckins = checkins.filter(c => c.user_id === profile?.id)
    const vendasMes = somarVendas(myCheckins)
    const porCanal = somarVendasPorCanal(myCheckins)
    const dias = getDiasInfo()

    const myGoal = sellerGoals.find(g => g.user_id === profile?.id)
    const meta = myGoal?.target || (storeGoal ? Math.round(storeGoal.target / Math.max(ranking.length, 1)) : 0)
    const atingimento = calcularAtingimento(vendasMes, meta)
    const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
    const faltaX = calcularFaltaX(meta, vendasMes)
    const myRank = ranking.find(r => r.user_id === profile?.id)

    // Last 7 days
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = weekAgo.toISOString().split('T')[0]
    const vendasSemana = somarVendas(myCheckins.filter(c => c.date >= weekStr))

    const StatCard = ({ icon: Icon, label, value, sub, color, bg }: any) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inner-card p-6 flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full blur-2xl group-hover:bg-blue-50 transition-colors z-0" />
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border border-gray-100 shadow-sm ${bg || 'bg-blue-50'}`}>
                    <Icon size={20} className={color || 'text-blue-500'} />
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-[#1A1D20]">{value}</p>
                    {sub && <span className="text-xs font-bold text-gray-500">{sub}</span>}
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">
                        Olá, {profile?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Seu painel de performance</p>
                </div>
            </div>

            {/* CTA Check-in */}
            {!todayCheckin && (
                <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={() => navigate('/checkin')}
                    className="w-full bg-[#1A1D20] text-white rounded-[2rem] p-6 sm:p-8 text-left hover:bg-black transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)] active:scale-[0.98] group relative overflow-hidden shrink-0">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                    <div className="flex sm:items-center gap-5 sm:gap-6 relative z-10 flex-col sm:flex-row">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                            <CheckSquare size={32} className="text-white" />
                        </div>
                        <div>
                            <p className="font-extrabold text-white text-xl sm:text-2xl mb-1">Fazer Check-in do Dia</p>
                            <p className="text-gray-400 text-sm font-medium">Registre suas visitas, leads e agendamentos de hoje para manter seu funil atualizado.</p>
                        </div>
                    </div>
                </motion.button>
            )}

            {todayCheckin && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                            <CheckSquare size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-extrabold text-[#1A1D20] text-lg">Check-in Realizado!</p>
                            <p className="text-gray-500 text-sm font-medium">Você já registrou os dados de hoje.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/checkin')} className="sm:ml-auto w-full sm:w-auto text-sm font-bold bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-6 py-3 rounded-full transition-colors shadow-sm">
                        Atualizar Dados
                    </button>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 shrink-0">
                <StatCard icon={Target} label="Meta Mensal" value={meta} sub={`${atingimento}% atg`} bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={Car} label="Vendas no Mês" value={vendasMes} sub={`Falta ${faltaX}`} bg="bg-emerald-50" color="text-emerald-600" />
                <StatCard icon={TrendingUp} label="Projeção" value={projecao} sub={`${dias.restantes}d restantes`} bg="bg-violet-50" color="text-violet-600" />
                <StatCard icon={Trophy} label="Ranking" value={myRank ? `${myRank.position}º` : '—'} sub={`de ${ranking.length}`} bg="bg-amber-50" color="text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 pb-10">
                {/* Vendas por canal */}
                <div className="inner-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-extrabold text-[#1A1D20] mb-6">Vendas por Canal</h3>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {[
                            { label: 'Portão', value: porCanal.porta, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                            { label: 'Carteira', value: porCanal.carteira, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                            { label: 'Internet', value: porCanal.internet, icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
                        ].map(ch => (
                            <div key={ch.label} className={`${ch.bg} border rounded-[1.5rem] p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
                                <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                                    <ch.icon size={18} className={`${ch.color}`} />
                                </div>
                                <p className="text-2xl font-black text-[#1A1D20] mb-1">{ch.value}</p>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{ch.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* Vendas semana */}
                    <div className="inner-card p-6 flex flex-col justify-between flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-[1.2rem] bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                                <BarChart3 size={20} className="text-orange-500" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">Vendas na Semana</p>
                            <p className="text-4xl font-extrabold text-[#1A1D20]">{vendasSemana}</p>
                        </div>
                    </div>

                    {/* Ritmo */}
                    {faltaX > 0 && dias.restantes > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-amber-100 p-2 rounded-full"><AlertTriangle size={16} className="text-amber-600" /></div>
                                <p className="font-extrabold text-amber-900 text-sm">Atenção ao Ritmo</p>
                            </div>
                            <p className="text-amber-800 text-xs font-semibold leading-relaxed">
                                Faltam <strong>{faltaX} vendas</strong> em {dias.restantes} dias restantes. Você precisa de <strong>{(faltaX / dias.restantes).toFixed(1)} vendas p/ dia</strong>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
