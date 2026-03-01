import { useTeam } from '@/hooks/useTeam'
import { motion, AnimatePresence } from 'motion/react'
import { Users, CheckCircle, XCircle, Mail, MapPin, ArrowRight, UserPlus, Search, Phone, Shield, Target, Award, Sparkles, Filter, ChevronRight, MoreHorizontal, Clock } from 'lucide-react'
import { useState } from 'react'

export default function Equipe() {
    const { sellers, loading } = useTeam()
    const [searchTerm, setSearchTerm] = useState('')

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Mapeando especialistas...</p>
        </div>
    )

    const filteredSellers = sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-[#1A1D20] rounded-full shadow-[0_0_15px_rgba(26,29,32,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Gestão de Equipe</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">
                            {sellers.length} Especialistas na Unidade
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative w-full sm:w-80 group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1A1D20] transition-colors" />
                        <input
                            type="text"
                            placeholder="Localizar especialista..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent rounded-[2rem] pl-14 pr-6 py-4 font-black text-sm focus:outline-none focus:bg-white focus:border-gray-100 focus:shadow-xl focus:shadow-gray-100 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                        />
                    </div>
                    <button
                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Novo Acesso
                    </button>
                </div>
            </div>

            {sellers.length === 0 ? (
                <div className="inner-card p-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[4rem]">
                    <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center mb-8 shadow-2xl shadow-gray-200/50 border border-gray-50 ring-8 ring-gray-100/30">
                        <Users size={48} className="text-gray-200" />
                    </div>
                    <h3 className="text-3xl font-black text-[#1A1D20] mb-3 tracking-tighter">Nenhum Colaborador Ativo</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-black text-[10px] uppercase tracking-widest leading-loose opacity-60">Comece a construir sua força de vendas de alta performance agora mesmo.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 shrink-0 pb-16">
                    {filteredSellers.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="inner-card p-10 flex flex-col justify-between hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all bg-white relative group overflow-hidden border border-gray-100 h-full cursor-pointer hover:-translate-y-3"
                        >
                            {/* Decorative BG */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-indigo-50/50 transition-colors z-0 pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Action Header */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-[#F8FAFC] flex items-center justify-center font-black text-[#1A1D20] text-4xl shadow-inner border border-gray-100 group-hover:bg-white group-hover:shadow-2xl transition-all group-hover:scale-105 group-hover:-rotate-3 overflow-hidden">
                                            {s.avatar_url ? (
                                                <img src={s.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                s.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center ${s.checkin_today ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                            {s.checkin_today ? <CheckCircle size={14} className="text-white" /> : <Clock size={14} className="text-white" />}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-[#1A1D20] hover:text-white transition-all">
                                            <MoreHorizontal size={20} />
                                        </button>
                                        {s.checkin_today && (
                                            <div className="flex items-center gap-2 text-[9px] font-black tracking-widest px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                                Ativo Agora
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                        <h3 className="text-2xl font-black text-[#1A1D20] leading-none group-hover:text-indigo-600 transition-colors tracking-tighter truncate">{s.name}</h3>
                                        {i < 2 && <Award size={18} className="text-amber-400 shrink-0" />}
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-400 font-black text-[9px] uppercase tracking-[0.2em] mb-6 opacity-60">
                                        <Shield size={12} className="text-indigo-400" /> Consultor Estratégico
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-gray-400 group-hover:text-[#1A1D20] transition-colors p-3 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <Mail size={14} className="opacity-60" />
                                            </div>
                                            <p className="text-[11px] font-black truncate flex-1 uppercase tracking-widest opacity-80">{s.email || 'especialista@autogestao.com'}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-400 group-hover:text-[#1A1D20] transition-colors p-3 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50">
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <Target size={14} className="opacity-60" />
                                            </div>
                                            <p className="text-[11px] font-black flex-1 uppercase tracking-widest opacity-80">98% de Desempenho</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="mt-auto pt-8 border-t border-gray-50 flex items-center justify-between group/footer">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(badge => (
                                            <div key={badge} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-[#1A1D20]">
                                                <Sparkles size={10} className="text-indigo-400" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gray-50 text-[#1A1D20] hover:bg-[#1A1D20] hover:text-white hover:shadow-xl transition-all group-hover:scale-105 active:scale-95 border border-gray-100">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Painel Consultor</span>
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredSellers.length === 0 && (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center bg-gray-50/30 rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Search size={40} className="text-gray-200 mb-6" />
                            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] opacity-60">Nenhum especialista com o termo "{searchTerm}"</p>
                            <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:underline">Limpar Busca</button>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    )
}
