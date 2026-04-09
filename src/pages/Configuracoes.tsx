import { Settings, FileSignature, Database, ShieldCheck, Zap, ArrowRight, MessageSquare, Plus, RefreshCw, LayoutDashboard, ChevronRight, Target, ShieldAlert, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export default function Configuracoes() {
    const { role } = useAuth()

    const sections = [
        {
            label: 'Configuração Operacional',
            desc: 'Gerenciar fontes, vigências e e-mails oficiais da unidade.',
            icon: Database,
            path: '/configuracoes/operacional',
            roles: ['admin']
        },
        {
            label: 'Metas e Benchmarks',
            desc: 'Ajustar alvos de venda e taxas de conversão (20/60/33).',
            icon: Target,
            path: '/metas',
            roles: ['admin', 'dono']
        },
        {
            label: 'Reprocessamento',
            desc: 'Importação em massa de dados históricos e auditoria.',
            icon: RefreshCw,
            path: '/configuracoes/reprocessamento',
            roles: ['admin']
        },
        {
            label: 'Governança de Equipe',
            desc: 'Controle de acessos, cargos e permissões da tropa.',
            icon: ShieldCheck,
            path: '/equipe',
            roles: ['admin', 'dono', 'gerente']
        }
    ]

    const filteredSections = sections.filter(s => s.roles.includes(role || ''))

    return (
        <main className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-indigo-700 mb-2 block font-black tracking-[0.4em] uppercase">Comando Central • Governança MX</span>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase text-slate-950">Painel de <span className="text-indigo-600">Controle</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nível de Acesso</span>
                        <Badge className="mt-1 px-4 py-1 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase border-none shadow-lg tracking-widest">
                            {role?.toUpperCase()}
                        </Badge>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shadow-inner" aria-hidden="true">
                        <Settings size={28} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                {/* Navigation Grid */}
                <section className="xl:col-span-8 space-y-10" aria-labelledby="nav-grid-title">
                    <h2 id="nav-grid-title" className="sr-only">Módulos de Configuração</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredSections.map((s, i) => (
                            <Link 
                                key={s.path} 
                                to={s.path}
                                className="group p-8 rounded-[2.5rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all relative overflow-hidden flex flex-col gap-8 outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all transform group-hover:rotate-3" aria-hidden="true">
                                        <s.icon size={28} />
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-950 group-hover:text-indigo-600 transition-colors">{s.label}</h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 leading-relaxed opacity-80 italic">{s.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Sidebar - Support/Request */}
                <aside className="xl:col-span-4 space-y-10">
                    <section className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-3xl relative overflow-hidden group" aria-labelledby="request-title">
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
                            <Zap size={200} fill="currentColor" />
                        </div>
                        
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true">
                                    <MessageSquare size={24} className="text-indigo-400" />
                                </div>
                                <h2 id="request-title" className="text-xl font-black uppercase tracking-tight">Requisição MX</h2>
                            </div>

                            <p className="text-sm font-bold text-white/50 uppercase tracking-widest leading-relaxed italic">
                                Precisa de um novo relatório ou ajuste estrutural? Envie sua solicitação direta para o time de inteligência.
                            </p>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label htmlFor="request-desc" className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">Descreva sua Necessidade</label>
                                    <textarea 
                                        id="request-desc"
                                        name="request_desc"
                                        placeholder="EX: Preciso de um export de vendas por canal..."
                                        className="w-full min-h-[140px] bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all resize-none shadow-inner"
                                    />
                                </div>
                                <button className="w-full py-5 rounded-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-500 transition-all shadow-2xl active:scale-95 focus-visible:ring-8 focus-visible:ring-indigo-500/20 outline-none">Enviar Solicitação</button>
                            </div>
                        </div>
                    </section>

                    <section className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 space-y-6 shadow-inner" aria-labelledby="info-title">
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={18} className="text-amber-500" aria-hidden="true" />
                            <h3 id="info-title" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Governança MX</h3>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed tracking-tight italic border-l-2 border-gray-200 pl-4">
                            Alterações estruturais de metas e benchmarks são registradas em log de auditoria forense para fins de compliance.
                        </p>
                    </section>
                </aside>
            </div>
        </main>
    )
}
