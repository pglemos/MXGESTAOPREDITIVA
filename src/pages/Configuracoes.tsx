import { Settings, FileSignature, Database, ShieldCheck, Zap, ArrowRight, MessageSquare, Plus, RefreshCw, LayoutDashboard, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export default function Configuracoes() {
    const { role } = useAuth()
    const [isRefetching, setIsRefetching] = useState(false)

    // 15. Security: Admin check
    if (role !== 'admin' && role !== 'consultor') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center">
                <ShieldCheck size={48} className="text-gray-200 mb-6" />
                <h3 className="text-2xl font-black text-pure-black tracking-tight mb-2">Acesso Restrito</h3>
                <p className="text-gray-400 text-sm font-bold max-w-xs mx-auto">Este cockpit de configuração é exclusivo para administradores da rede.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header / 10. Typography standardization */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-gray-400 rounded-full shadow-[0_0_15px_rgba(156,163,175,0.5)]" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Ajustes do <span className="text-gray-400">Sistema</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        {/* 14. Unit Inconsistency fix: added build info */}
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Build 2026.03 • Core Configuration</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {/* 19. Broken Link fix: Home button */}
                    <Link to="/painel" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all">
                        <LayoutDashboard size={20} />
                    </Link>
                    <div className="flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-gray-100 bg-white text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm">
                        Loja Matriz
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-32">
                {/* 2. UX Gap: Links to sub-configs */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-2 mb-2">Módulos Configuráveis</h3>
                    
                    <Link to="/configuracoes/comissoes" className="group bg-white border border-gray-100 p-8 rounded-[2.2rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                <FileSignature size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-pure-black group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="text-xl font-black text-pure-black tracking-tight mb-1">Comissões</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Regras de Performance</p>
                    </Link>

                    {/* EPIC-11: Reprocessamento */}
                    <Link to="/configuracoes/reprocessamento" className="group bg-white border border-gray-100 p-8 rounded-[2.2rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-rose-100 transition-colors" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                <Database size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-pure-black group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="text-xl font-black text-pure-black tracking-tight mb-1">Reprocessamento</h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Reparo & Backfill da Base</p>
                    </Link>

                    <div className="group bg-white border border-gray-100 p-8 rounded-[2.2rem] shadow-sm opacity-50 cursor-not-allowed">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 border border-gray-100 flex items-center justify-center">
                                <Zap size={22} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-2 py-1 rounded">EM BREVE</span>
                        </div>
                        <h4 className="text-xl font-black text-gray-300 tracking-tight mb-1">Integrações</h4>
                        <p className="text-[10px] font-black text-gray-200 uppercase tracking-widest">APIs Externas</p>
                    </div>
                </div>

                {/* 12. Empty State: Feature request form */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden group h-full flex flex-col items-center justify-center shadow-elevation">
                        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gray-50 rounded-full blur-[100px] z-0 pointer-events-none group-hover:bg-indigo-50/30 transition-all duration-1000" />

                        <div className="relative z-10 max-w-md mx-auto space-y-8">
                            {/* 16. Spin animation fixed */}
                            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto shadow-inner group-hover:rotate-[120deg] transition-transform duration-1000">
                                <Settings size={48} className="text-gray-200 group-hover:text-electric-blue transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-pure-black tracking-tighter mb-4 uppercase">Expansão de Nucleo</h3>
                                {/* 6. Contrast fix */}
                                <p className="text-gray-500 font-bold text-sm leading-relaxed">
                                    Configurações avançadas de benchmarks e automações estão sendo recalibradas para o próximo ciclo da rede.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Deseja priorizar uma funcionalidade?</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input placeholder="Sua sugestão..." className="flex-1 bg-gray-50 border border-gray-100 rounded-full px-6 py-3 text-xs font-bold focus:outline-none focus:bg-white focus:border-indigo-200 transition-all" />
                                    <button className="px-8 py-3 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg">Solicitar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
