import { useTeam } from '@/hooks/useTeam'
import { motion } from 'motion/react'
import { Users, CheckCircle, XCircle } from 'lucide-react'

export default function Equipe() {
    const { sellers, loading } = useTeam()

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando equipe...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Sua Equipe</h1>
                    <span className="bg-white border border-gray-100 text-xs font-bold px-3 py-1 rounded-full text-gray-500">{sellers.length} Especialistas</span>
                </div>
            </div>

            {sellers.length === 0 ? (
                <div className="inner-card p-20 text-center flex flex-col items-center justify-center border-dashed">
                    <Users size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-[#1A1D20] mb-2">Nenhum consultor/vendedor cadastrado</h3>
                    <p className="text-gray-500 max-w-md mx-auto">A equipe atual ainda não possui vendedores com cadastro ativo nesta loja. Solicite acesso ou cadastre os vendedores.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 shrink-0 pb-10">
                    {sellers.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 flex flex-col justify-between group h-full relative overflow-hidden"
                        >
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-blue-50/50 transition-colors" />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="w-14 h-14 rounded-full bg-[#F8FAFC] flex items-center justify-center font-extrabold text-[#1A1D20] text-xl shadow-sm border border-gray-100 group-hover:bg-white transition-all">
                                    {s.name?.charAt(0).toUpperCase()}
                                </div>
                                {s.checkin_today ? (
                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <CheckCircle size={14} /> Ativo Hoje
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                                        <XCircle size={14} /> Pendente
                                    </span>
                                )}
                            </div>

                            <div className="relative z-10 flex-1">
                                <h3 className="text-lg font-extrabold text-[#1A1D20] mb-1 leading-tight">{s.name}</h3>
                                {s.email ? (
                                    <p className="text-gray-500 text-sm font-medium pr-4 truncate">{s.email}</p>
                                ) : (
                                    <p className="text-gray-400 text-xs font-semibold italic">Sem e-mail cadastrado</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
