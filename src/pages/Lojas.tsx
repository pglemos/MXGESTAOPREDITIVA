import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useStorePerformance } from '@/hooks/useRanking'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Building2, Search, Filter, Plus, ChevronRight, RefreshCw, X, TrendingUp, Users, Target, Globe, AlertTriangle, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Link } from 'react-router-dom'

export default function Lojas() {
    const { stores, loading, refetch } = useStores()
    const { role } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const filteredStores = useMemo(() => {
        return stores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [stores, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Rede sincronizada!')
    }, [refetch])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse font-black uppercase tracking-widest">Escaneando Unidades...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Network Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Unidades</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">CONTROLE DE FILIAIS & GOVERNANÇA MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12 bg-white border-border-strong">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="LOCALIZAR LOJA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 uppercase tracking-widest text-xs"
                        />
                    </div>
                    {role === 'admin' && (
                        <Button className="h-12 px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                            <Plus size={18} className="mr-2" /> NOVA UNIDADE
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredStores.map((store, i) => (
                                <motion.div key={store.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                                    <Card className="overflow-hidden group hover:shadow-mx-xl hover:-translate-y-1 transition-all border-none shadow-mx-lg bg-white flex flex-col h-full">
                                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-8 flex flex-row items-center justify-between relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className="w-14 h-14 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-3">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors truncate max-w-[140px]">{store.name}</Typography>
                                                    <Typography variant="caption" tone="muted" className="text-xs font-black uppercase mt-1">ID: {store.id.split('-')[0]}</Typography>
                                                </div>
                                            </div>
                                            <Badge variant="success" className="px-3 py-1 rounded-full text-xs font-black shadow-sm uppercase border-none">Ativa</Badge>
                                        </CardHeader>

                                        <CardContent className="p-8 space-y-10 flex-1 relative z-10 flex flex-col justify-between">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1 bg-surface-alt/50 p-4 rounded-mx-xl border border-border-subtle shadow-inner group-hover:bg-white transition-all">
                                                    <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase opacity-40">Especialistas</Typography>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={12} className="text-brand-primary" />
                                                        <Typography variant="h2" className="text-xl font-mono-numbers leading-none">12</Typography>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 bg-surface-alt/50 p-4 rounded-mx-xl border border-border-subtle shadow-inner group-hover:bg-white transition-all">
                                                    <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase opacity-40">Eficiência</Typography>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp size={12} className="text-status-success" />
                                                        <Typography variant="h2" tone="success" className="text-xl font-mono-numbers leading-none">94%</Typography>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase tracking-widest">Aderência aos Rituais</Typography>
                                                    <Typography variant="mono" tone="brand" className="text-sm font-black">100%</Typography>
                                                </div>
                                                <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden p-0.5 shadow-inner border border-border-default">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5 }} className="h-full bg-status-success rounded-full shadow-mx-sm" />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <footer className="p-6 border-t border-border-default bg-surface-alt/20 flex gap-3 relative z-10 mt-auto">
                                            <Button asChild variant="outline" size="sm" className="flex-1 h-12 rounded-mx-lg bg-white shadow-sm font-black uppercase text-xs border-border-strong hover:border-brand-primary">
                                                <Link to={`/goal-management?id=${store.id}`}>METAS</Link>
                                            </Button>
                                            <Button asChild variant="secondary" size="sm" className="flex-1 h-12 rounded-mx-lg shadow-mx-md font-black uppercase text-xs">
                                                <Link to={`/dashboard?id=${store.id}`}>DASHBOARD</Link>
                                            </Button>
                                        </footer>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-[3rem] group hover:bg-surface-alt/20 transition-all">
                        <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt shadow-xl flex items-center justify-center mb-8 border border-border-default group-hover:scale-110 transition-transform">
                            <Building2 size={48} className="text-text-tertiary opacity-20" />
                        </div>
                        <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Vácuo Operacional</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-xs uppercase tracking-widest font-black text-xs leading-relaxed opacity-40">Aguardando consolidação de dados para liberar a visão operacional da rede.</Typography>
                    </div>
                )}
            </div>
        </main>
    )
}
