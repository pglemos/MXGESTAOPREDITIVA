import { useTeam } from '@/hooks/useTeam'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Users, 
    CheckCircle, 
    XCircle, 
    Mail, 
    MapPin, 
    ArrowRight, 
    UserPlus, 
    Search, 
    Phone, 
    Shield, 
    Target, 
    Award, 
    Sparkles, 
    Filter, 
    ChevronRight, 
    MoreHorizontal,
    RefreshCw,
    X,
    LayoutDashboard
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Equipe() {
    const { sellers, loading, refetch, updateSeller } = useTeam()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    // 1. Memoized search filter with 9. trim()
    const filteredSellers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        if (!term) return sellers
        return sellers.filter(s => 
            s.name?.toLowerCase().includes(term) || 
            s.email?.toLowerCase().includes(term) ||
            s.role?.toLowerCase().includes(term)
        )
    }, [sellers, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Lista de especialistas atualizada!')
    }, [refetch])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Tropa...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header / 18. text-[38px] replaced with 4xl token */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-100 pb-10 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Gestão de Capital Humano</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">Time de <span className="text-electric-blue">Elite</span></h1>
                    <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">
                        Monitoramento de atividade, conversão e desempenho técnico da força de vendas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar especialista..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>

                    <button 
                        onClick={() => toast.info('Módulo de convite em manutenção operacional.')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group"
                    >
                        <UserPlus size={18} className="group-hover:scale-110 transition-transform" /> Novo Acesso
                    </button>
                </div>
            </div>

            {/* 2. & 11. Responsive Grid improvement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-24">
                <AnimatePresence mode="popLayout">
                    {filteredSellers.map((seller, i) => (
                        <motion.div
                            key={seller.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white border border-gray-100 rounded-[2.2rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col"
                        >
                            {/* 13. Z-Index fix for gradient */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/30 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none z-0" />
                            
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="relative group/avatar">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:rotate-3 transition-transform">
                                        {seller.avatar_url ? (
                                            <img 
                                                src={seller.avatar_url} 
                                                alt={seller.name} 
                                                className="w-full h-full object-cover"
                                                // 5. Avatar fallback
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=f8fafc&color=1a1d20&bold=true`
                                                }}
                                            />
                                        ) : (
                                            <span className="text-xl font-black text-pure-black uppercase">{seller.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    {/* 20. Realtime Check-in Indicator */}
                                    <div className={cn(
                                        "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm",
                                        seller.checkin_today ? "bg-emerald-500 animate-pulse" : "bg-gray-200"
                                    )} title={seller.checkin_today ? "Online" : "Offline"} />
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* 12. Hitbox action button */}
                                    <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-pure-black hover:text-white transition-all shadow-sm">
                                        <MoreHorizontal size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 mb-8 relative z-10 flex-1">
                                <h3 className="text-lg font-black text-pure-black tracking-tight leading-tight group-hover:text-electric-blue transition-colors line-clamp-1">{seller.name}</h3>
                                {/* 14. Contrast fix for role */}
                                <div className="flex items-center gap-2">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{seller.role || 'ESPECIALISTA'}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-gray-50 relative z-10">
                                <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <span>Conversão Final</span>
                                    <span className="text-pure-black font-mono-numbers">{seller.conversion || '0.0'}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-electric-blue shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                                        style={{ width: `${Math.min(seller.conversion || 0, 100)}%` }} 
                                    />
                                </div>
                                
                                {/* 16. Button is now a proper Link for SEO/UX */}
                                <Link 
                                    to={`/relatorios/performance-vendedores?id=${seller.id}`}
                                    className="w-full py-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-pure-black hover:text-white hover:border-pure-black transition-all group/btn"
                                >
                                    Abrir Painel <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* 8. Empty State standard radius */}
                {filteredSellers.length === 0 && !loading && (
                    <div className="col-span-full py-32 rounded-[2.5rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <Users size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Vácuo de Tropa</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-8">
                            Nenhum especialista "{searchTerm}" localizado na topologia atual do cluster.
                        </p>
                        <button onClick={() => setSearchTerm('')} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95">
                            Limpar Busca
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
