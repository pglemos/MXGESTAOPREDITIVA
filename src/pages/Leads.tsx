import { useState, useMemo, useEffect, useCallback } from 'react'
import {
    Search, Filter as FilterIcon, Phone, Mail, Clock, TrendingUp, 
    ArrowUpRight, ArrowDownRight, Star, MessageCircle, Calendar, 
    ChevronRight, User, Zap, X, ExternalLink, Smartphone, ShieldCheck, RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/main'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Leads() {
    const { leads, refetch: refetchAll } = useAppStore()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [selected, setSelected] = useState<string | null>(leads[0]?.id || null)
    const [isRefetching, setIsRefetching] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const filtered = useMemo(() => {
        return leads.filter((l) => {
            if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
            if (debouncedSearch) {
                const lower = debouncedSearch.toLowerCase()
                return l.name.toLowerCase().includes(lower) || l.car.toLowerCase().includes(lower) || l.phone.includes(lower)
            }
            return true
        })
    }, [leads, sourceFilter, debouncedSearch])

    const selectedLead = useMemo(() => selected ? leads.find((l) => l.id === selected) : null, [selected, leads])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetchAll?.(); setIsRefetching(false)
        toast.success('Pipeline sincronizado!')
    }, [refetchAll])

    const handleWhatsApp = (phone?: string) => {
        const num = phone || '31987830000'
        const cleanPhone = num.replace(/\D/g, '')
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
        window.open(`https://wa.me/${finalPhone}`, '_blank')
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / CRM Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Pipeline de <span className="text-brand-primary">Oportunidades</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-6 uppercase tracking-widest font-black">CRM OPERACIONAL • GESTÃO DE CONVERSÃO</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-14 h-14 rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button className="h-14 px-8 rounded-full shadow-mx-lg bg-brand-secondary">
                        NOVO LEAD MANUAL
                    </Button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {[
                    { label: 'Total Leads (Ciclo)', value: '142', trend: '+12%', icon: TrendingUp, tone: 'brand' },
                    { label: 'SLA Ativo', value: '4.2m', trend: '-18%', icon: Clock, tone: 'success' },
                    { label: 'Taxa de Fechamento', value: '18.4%', trend: '+2.1%', icon: Zap, tone: 'warning' },
                ].map((stat) => (
                    <Card key={stat.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className={cn("w-14 h-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                stat.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                'bg-status-warning-surface border-mx-amber-100 text-status-warning'
                            )}>
                                <stat.icon size={24} strokeWidth={2.5} />
                            </div>
                            <Badge variant={stat.tone as any} className="text-[10px] font-black h-6 px-3 shadow-sm border-none">{stat.trend}</Badge>
                        </div>
                        <div className="relative z-10">
                            <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest text-[8px]">{stat.label}</Typography>
                            <Typography variant="h1" className="text-4xl tabular-nums leading-none">{stat.value}</Typography>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-mx-lg flex-1 min-h-0 pb-32">
                
                {/* List Section */}
                <aside className="w-full lg:w-[420px] flex flex-col shrink-0">
                    <Card className="flex-1 border-none shadow-mx-lg bg-white overflow-hidden flex flex-col">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-8 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="NOME OU VEÍCULO..." className="!h-12 !pl-11 !text-[10px] uppercase tracking-widest" />
                            </div>
                            <div className="relative group">
                                <select 
                                    value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                                    className="w-full h-12 bg-white border border-border-default rounded-mx-xl px-6 text-[10px] font-black uppercase tracking-widest text-text-primary outline-none focus:border-brand-primary transition-all appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="all">TODAS AS FONTES</option>
                                    <option value="WhatsApp">WHATSAPP</option>
                                    <option value="Meta Ads">META ADS</option>
                                    <option value="Webmotors">WEBMOTORS</option>
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-hover:text-brand-primary rotate-90" />
                            </div>
                        </CardHeader>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((lead) => (
                                    <motion.article 
                                        key={lead.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        onClick={() => setSelected(lead.id)} 
                                        className={cn("p-6 cursor-pointer rounded-mx-2xl transition-all relative border group/item", 
                                            selected === lead.id ? "bg-mx-indigo-50 border-brand-primary shadow-mx-md" : "bg-white border-transparent hover:bg-surface-alt/50"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <Typography variant="h3" className="text-sm uppercase group-hover/item:text-brand-primary transition-colors truncate pr-10">{lead.name}</Typography>
                                            {lead.score > 90 && <Badge variant="brand" className="text-[7px] h-5 px-2 animate-pulse">HOT</Badge>}
                                        </div>
                                        <div className="flex justify-between items-center mb-6">
                                            <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase">{lead.car}</Typography>
                                            <Typography variant="caption" tone="muted" className="text-[8px] opacity-40 uppercase">{lead.source}</Typography>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-border-subtle pt-4">
                                            <Typography variant="mono" className="text-xs font-black">R$ {(lead.value / 1000).toFixed(0)}k</Typography>
                                            <Badge variant="outline" className="text-[7px] h-5 px-2 uppercase border-border-strong">{lead.stage}</Badge>
                                        </div>
                                        {selected === lead.id && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center shadow-mx-md transition-transform scale-110"><ChevronRight className="w-5 h-5 text-white" strokeWidth={3} /></div>}
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </div>
                    </Card>
                </aside>

                {/* Detail Section */}
                <section className="flex-1 min-h-0">
                    {selectedLead ? (
                        <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group/detail">
                            <header className="p-10 md:p-14 border-b border-border-default bg-surface-alt/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                                
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative z-10">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 rounded-mx-3xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform -rotate-3 group-hover/detail:rotate-0 transition-transform">
                                            <User size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <Typography variant="h1" className="text-4xl">{selectedLead.name}</Typography>
                                                <Badge variant="brand" className="h-7 px-4 rounded-full shadow-sm uppercase font-black">{selectedLead.stage}</Badge>
                                            </div>
                                            <div className="flex items-center gap-6 opacity-60">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase"><Calendar className="w-4 h-4 text-brand-primary" /> RECEBIDO EM 02/04</span>
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase"><Smartphone className="w-4 h-4 text-status-success" /> (31) 98783-XXXX</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full lg:w-auto gap-4">
                                        <Button variant="outline" size="icon" className="w-14 h-14 rounded-xl border-border-default hover:text-brand-primary shadow-sm bg-white">
                                            <Mail size={24} />
                                        </Button>
                                        <Button onClick={() => handleWhatsApp()} className="flex-1 lg:flex-none h-14 px-10 rounded-full bg-status-success text-white hover:bg-status-success/90 shadow-mx-lg">
                                            <MessageCircle size={20} className="mr-3 fill-white/20" /> WHATSAPP
                                        </Button>
                                    </div>
                                </div>
                            </header>
                            
                            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-10 md:p-14 space-y-14">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                                    <div className="space-y-2">
                                        <Typography variant="caption" tone="muted" className="uppercase font-black tracking-widest opacity-40">Interesse</Typography>
                                        <Typography variant="h3" className="text-xl uppercase">{selectedLead.car}</Typography>
                                    </div>
                                    <div className="space-y-2">
                                        <Typography variant="caption" tone="muted" className="uppercase font-black tracking-widest opacity-40">Valor Estimado</Typography>
                                        <Typography variant="h1" className="text-xl font-mono-numbers">R$ {selectedLead.value.toLocaleString()}</Typography>
                                    </div>
                                    <div className="space-y-2">
                                        <Typography variant="caption" tone="muted" className="uppercase font-black tracking-widest opacity-40">Score IA</Typography>
                                        <div className="flex items-center gap-3">
                                            <Typography variant="h1" tone="success" className="text-3xl tabular-nums">{selectedLead.score}</Typography>
                                            <Star size={18} className="text-status-warning fill-current" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Typography variant="caption" tone="muted" className="uppercase font-black tracking-widest opacity-40">Responsável</Typography>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-alt border border-border-default flex items-center justify-center text-[10px] font-black text-text-tertiary">JV</div>
                                            <Typography variant="h3" className="text-sm uppercase">João V.</Typography>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8 pt-10 border-t border-border-default">
                                    <header className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-mx-lg bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner"><TrendingUp size={20} /></div>
                                        <Typography variant="h3" className="uppercase tracking-tight">Histórico Operacional</Typography>
                                    </header>
                                    <div className="space-y-10 relative">
                                        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border-default/50" />
                                        {[1, 2, 3].map((_, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex gap-8 items-start relative z-10">
                                                <div className="w-10 h-10 rounded-full bg-white border border-border-default flex items-center justify-center shrink-0 shadow-mx-sm">
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                                </div>
                                                <Card className="bg-surface-alt/50 border border-border-subtle rounded-mx-2xl p-6 flex-1 hover:bg-white hover:shadow-mx-md transition-all">
                                                    <Typography variant="h3" className="text-sm uppercase mb-1">Ação registrada no sistema</Typography>
                                                    <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase tracking-widest opacity-60">Há {i + 1}h • Especialista Responsável</Typography>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-14 bg-white/50 border-dashed border-2 border-border-default rounded-[3rem] group hover:bg-white transition-all">
                            <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt flex items-center justify-center mb-8 border border-border-default group-hover:scale-110 transition-transform">
                                <User size={48} className="text-text-tertiary opacity-20" />
                            </div>
                            <Typography variant="h3" tone="muted" className="uppercase tracking-widest opacity-40">Selecione uma Oportunidade na Malha</Typography>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
