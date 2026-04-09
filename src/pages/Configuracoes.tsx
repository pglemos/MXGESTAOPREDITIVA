import { Settings, FileSignature, Database, ShieldCheck, Zap, ArrowRight, MessageSquare, Plus, RefreshCw, LayoutDashboard, ChevronRight, Target, ShieldAlert, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export default function Configuracoes() {
    const { role } = useAuth()
    const [isRefetching, setIsRefetching] = useState(false)

    // Security: Admin check
    if (role !== 'admin') {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center bg-white">
                <ShieldCheck size={48} className="text-gray-200 mb-6" aria-hidden="true" />
                <h1 className="text-2xl font-black text-pure-black tracking-tight mb-2 uppercase">Acesso Restrito</h1>
                <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto">Este cockpit de configuração é exclusivo para administradores da rede.</p>
            </main>
        )
    }

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase">Ajustes do <span className="text-indigo-600">Sistema</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em]">Build 2026.03 • Core Configuration</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/painel" aria-label="Voltar para o Painel Inicial" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <LayoutDashboard size={20} aria-hidden="true" />
                    </Link>
                    <div className="flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-gray-100 bg-white text-xs font-black uppercase tracking-[0.2em] text-slate-700 shadow-sm">
                        Loja Matriz
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-32">
                {/* Governance Links */}
                <section className="lg:col-span-4 flex flex-col gap-6" aria-labelledby="gov-title">
                    <h2 id="gov-title" className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] pl-2 mb-2">Governança MX</h2>
                    
                    <Link to="/metas" className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-mx-lg transition-all relative overflow-hidden focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors" aria-hidden="true" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform" aria-hidden="true">
                                <Target size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-black text-slate-950 tracking-tight mb-1 uppercase">Metas & Benchmarks</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Regras de Negócio (20/60/33)</p>
                    </Link>

                    <Link to="/auditoria" className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-mx-lg transition-all relative overflow-hidden focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-amber-100 transition-colors" aria-hidden="true" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform" aria-hidden="true">
                                <ShieldAlert size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-black text-slate-950 tracking-tight mb-1 uppercase">Auditoria IA Forense</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Motor de Diagnóstico de Gaps</p>
                    </Link>

                    <Link to="/configuracoes/reprocessamento" className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-mx-lg transition-all relative overflow-hidden focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-rose-100 transition-colors" aria-hidden="true" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform" aria-hidden="true">
                                <Database size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-black text-slate-950 tracking-tight mb-1 uppercase">Reprocessamento</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reparo & Backfill da Base</p>
                    </Link>

                    <Link to="/configuracoes/operacional" className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-mx-lg transition-all relative overflow-hidden focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors" aria-hidden="true" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform" aria-hidden="true">
                                <FileSignature size={22} strokeWidth={2.5} />
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-black text-slate-950 tracking-tight mb-1 uppercase">Operacional</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fontes & Vigências</p>
                    </Link>
                </section>

                {/* Nucleus Expansion */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden group h-full flex flex-col items-center justify-center shadow-sm hover:shadow-mx-lg transition-all">
                        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gray-50 rounded-full blur-[100px] z-0 pointer-events-none group-hover:bg-indigo-50/30 transition-all duration-1000" aria-hidden="true" />

                        <div className="relative z-10 max-w-md mx-auto space-y-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto shadow-inner group-hover:rotate-[120deg] transition-transform duration-1000" aria-hidden="true">
                                <Settings size={48} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-950 tracking-tighter mb-4 uppercase">Expansão de Núcleo</h3>
                                <p className="text-gray-500 font-bold text-sm leading-relaxed">
                                    Configurações avançadas de automação e integrações externas estão sendo recalibradas para o próximo ciclo da rede.
                                </p>
                            </div>
                            <div className="pt-8 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Deseja priorizar uma funcionalidade?</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <label htmlFor="suggestion-input" className="sr-only">Sua sugestão de funcionalidade</label>
                                    <input id="suggestion-input" placeholder="Sua sugestão..." className="flex-1 bg-gray-50 border border-gray-100 rounded-full px-6 py-3 text-xs font-bold focus:outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner" />
                                    <button className="px-8 py-3 bg-slate-950 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">Solicitar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
