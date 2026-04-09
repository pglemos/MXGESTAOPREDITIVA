import { useMyCheckins } from '@/hooks/useCheckins'
import { calcularTotais } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    History, 
    Calendar, 
    Car, 
    Users, 
    Globe, 
    Eye, 
    Phone, 
    TrendingUp, 
    MessageSquare, 
    ChevronRight, 
    Filter, 
    Search, 
    RefreshCw, 
    X,
    ArrowUpDown,
    CalendarDays
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Historico() {
    const { checkins, loading, refetch } = useMyCheckins()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [filterType, setSortType] = useState<'all' | 'vendas' | 'leads'>('all')

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
    }, [refetch])

    // 20. Pre-calculating totals and 1. & 17. & 18. Sorting/Filtering
    const processedCheckins = useMemo(() => {
        let result = checkins.map(c => ({
            ...c,
            totals: calcularTotais(c),
            // 1. Safe date parsing
            parsedDate: parseISO(c.reference_date)
        }))

        if (filterType === 'vendas') result = result.filter(c => c.totals.vnd_total > 0)
        if (filterType === 'leads') result = result.filter(c => c.leads_prev_day > 0)

        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            result = result.filter(c => 
                c.note?.toLowerCase().includes(term) || 
                c.zero_reason?.toLowerCase().includes(term) ||
                format(c.parsedDate, 'PPPP', { locale: ptBR }).toLowerCase().includes(term)
            )
        }

        return result.sort((a, b) => {
            const timeA = a.parsedDate.getTime()
            const timeB = b.parsedDate.getTime()
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
        })
    }, [checkins, searchTerm, sortOrder, filterType])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl" role="status">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-6 text-gray-500 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Recuperando memórias operacionais...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-950 uppercase">
                            Histórico <span className="text-indigo-600">Operacional</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
                            {processedCheckins.length} registros sincronizados na malha
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                        <label htmlFor="history-search" className="sr-only">Buscar no histórico operacional</label>
                        <input 
                            id="history-search"
                            name="history-search"
                            type="text" 
                            placeholder="BUSCAR NO HISTÓRICO..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-200 shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10" 
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} aria-label="Limpar busca" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-rose-600 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-full"><X size={14} aria-hidden="true" /></button>}
                    </div>
                    
                    <div className="bg-gray-100 p-1 rounded-2xl flex border border-gray-200 shadow-inner">
                        <button 
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-950 shadow-sm hover:text-indigo-600 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                            aria-label={sortOrder === 'desc' ? "Mudar para ordem crescente" : "Mudar para ordem decrescente"}
                        >
                            <ArrowUpDown size={18} strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    </div>

                    <button 
                        onClick={handleRefresh}
                        aria-label="Atualizar histórico"
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-slate-950 active:scale-95 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {checkins.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-[2.5rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />
                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                        <History size={40} className="text-gray-300" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase leading-none">Memória Vazia</h2>
                    <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto mb-8 uppercase tracking-widest leading-relaxed">
                        Você ainda não registrou atividades neste ciclo operacional.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32" aria-live="polite">
                    <AnimatePresence mode="popLayout">
                        {processedCheckins.map((c, i) => (
                            <motion.article
                                key={c.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className="bg-white border border-gray-100 rounded-[2.2rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col min-h-[320px]"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:bg-indigo-50/50 transition-colors" aria-hidden="true" />

                                <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group-hover:bg-slate-950 transition-all group-hover:rotate-3" aria-hidden="true">
                                            <Calendar size={24} className="text-indigo-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1 leading-none">Snapshot Operacional</p>
                                            <h2 className="text-xl font-black tracking-tighter text-slate-950 leading-tight truncate uppercase">
                                                <time dateTime={c.reference_date}>
                                                    {format(c.parsedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}
                                                </time>
                                            </h2>
                                        </div>
                                    </div>
                                    
                                    {c.totals.vnd_total > 0 ? (
                                        <div className="bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm shrink-0 self-start sm:self-auto">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                {c.totals.vnd_total} {c.totals.vnd_total === 1 ? 'UNIDADE' : 'UNIDADES'}
                                            </span>
                                        </div>
                                    ) : c.zero_reason ? (
                                        <div className="bg-amber-50 border border-amber-100 px-5 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm">
                                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                                                {c.zero_reason}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-100 px-5 py-2.5 rounded-2xl flex items-center gap-2 shrink-0 self-start sm:self-auto grayscale">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                Inativo
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4 relative z-10" role="list" aria-label="Métricas de desempenho do dia">
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-lg transition-all text-center group/stat shadow-inner" role="listitem">
                                        <Phone size={16} className="text-indigo-500 mx-auto mb-3 transition-transform group-hover/stat:scale-110" aria-hidden="true" />
                                        <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{c.leads_prev_day}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Leads</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-lg transition-all text-center group/stat shadow-inner" role="listitem">
                                        <CalendarDays size={16} className="text-blue-500 mx-auto mb-3 transition-transform group-hover/stat:scale-110" aria-hidden="true" />
                                        <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{c.totals.agd_total}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Agd</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-lg transition-all text-center group/stat shadow-inner" role="listitem">
                                        <Eye size={16} className="text-amber-500 mx-auto mb-3 transition-transform group-hover/stat:scale-110" aria-hidden="true" />
                                        <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{c.visit_prev_day}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Visitas</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 hover:bg-white hover:shadow-lg transition-all text-center group/stat shadow-inner" role="listitem">
                                        <Car size={16} className="text-emerald-500 mx-auto mb-3 transition-transform group-hover/stat:scale-110" aria-hidden="true" />
                                        <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{c.totals.vnd_total}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Vendas</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col gap-6 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between relative z-10">
                                    <div className="flex flex-wrap items-center gap-5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span className="flex items-center gap-2"><Globe size={14} className="text-blue-500" aria-hidden="true" /> Digital: {c.vnd_net_prev_day}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200" aria-hidden="true" />
                                        <span className="flex items-center gap-2"><Users size={14} className="text-indigo-500" aria-hidden="true" /> Porta: {c.vnd_porta_prev_day}</span>
                                    </div>
                                    
                                    {c.note && (
                                        <div className="flex items-center gap-3 group/note relative cursor-help shrink-0">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover/note:text-indigo-600 group-hover/note:bg-indigo-50 transition-all border border-gray-100" aria-hidden="true">
                                                <MessageSquare size={14} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 italic truncate max-w-[140px] uppercase tracking-tight">{c.note}</span>

                                            <div className="absolute bottom-full right-0 mb-4 w-64 p-5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] opacity-0 group-hover/note:opacity-100 transition-all pointer-events-none z-[60] shadow-3xl transform translate-y-2 group-hover/note:translate-y-0 border border-white/10 leading-relaxed italic text-center">
                                                <span className="sr-only">Nota do registro: </span>
                                                "{c.note}"
                                                <div className="absolute top-full right-4 w-3 h-3 bg-slate-950 rotate-45 -mt-1.5 border-r border-b border-white/5" aria-hidden="true" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </main>
    )
}
