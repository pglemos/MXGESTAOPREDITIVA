import { useState, useMemo, useEffect } from 'react'
import {
    Search, Filter as FilterIcon, Phone, Mail, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Star, MessageCircle, Calendar, ChevronRight, User, Zap, X, ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/main'

export default function Leads() {
    const { leads, team } = useAppStore()
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [sourceFilter, setSourceFilter] = useState('all')
    const [selected, setSelected] = useState<string | null>(leads[0]?.id || null)

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

    const handleWhatsApp = (phone?: string) => {
        const num = phone || '31987830000'
        const cleanPhone = num.replace(/\D/g, '')
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
        window.open(`https://wa.me/${finalPhone}`, '_blank')
    }

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-mx-lg border-b border-border-default pb-mx-lg">
                <div>
                    <div className="flex items-center gap-mx-xs mb-mx-sm">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <span className="mx-text-caption">CRM Operacional</span>
                    </div>
                    <h1 className="mx-heading-hero">Pipeline de <span className="text-brand-primary">Oportunidades</span></h1>
                    <p className="text-sm font-bold text-text-secondary max-w-2xl leading-relaxed">Gestão centralizada de conversão e ativos de interesse.</p>
                </div>
                <button className="mx-button-primary bg-brand-secondary">Novo Lead Manual</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-sm shrink-0">
                {[
                    { label: 'Total Leads (Ciclo)', value: '142', trend: '+12%', icon: TrendingUp, tone: 'bg-status-info-surface text-status-info border-mx-indigo-100' },
                    { label: 'SLA Ativo', value: '4.2m', trend: '-18%', icon: Clock, tone: 'bg-status-success-surface text-status-success border-mx-emerald-100' },
                    { label: 'Taxa de Fechamento', value: '18.4%', trend: '+2.1%', icon: Zap, tone: 'bg-status-warning-surface text-status-warning border-mx-amber-100' },
                ].map((stat) => (
                    <div key={stat.label} className="mx-card p-mx-md flex flex-col justify-between group relative overflow-hidden">
                        <p className="mx-text-caption mb-mx-sm">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h3 className="text-3xl font-black tracking-tighter text-text-primary font-mono-numbers">{stat.value}</h3>
                            <div className={cn('flex items-center text-[10px] font-black px-2 py-1 rounded-full border', stat.tone)}>{stat.trend}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
                {/* List Section */}
                <div className="w-full lg:w-[400px] flex flex-col shrink-0 mx-card overflow-hidden">
                    <div className="p-mx-md border-b border-border-subtle space-y-mx-sm bg-mx-slate-50/30">
                        <div className="relative group">
                            <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-brand-primary" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou veículo..." className="mx-input !h-11 !pl-11" />
                        </div>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="mx-input !h-11 !px-mx-md mx-text-caption border-none">
                                <SelectValue placeholder="Fonte" />
                            </SelectTrigger>
                            <SelectContent className="rounded-mx-lg shadow-mx-xl">
                                <SelectItem value="all">Todas Fontes</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                                <SelectItem value="Webmotors">Webmotors</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ScrollArea className="flex-1 no-scrollbar">
                        <div className="p-mx-sm space-y-mx-xs">
                            {filtered.map((lead) => (
                                <div key={lead.id} onClick={() => setSelected(lead.id)} className={cn("p-mx-md cursor-pointer rounded-mx-lg transition-all relative border", selected === lead.id ? "bg-brand-primary-surface border-mx-indigo-100 shadow-mx-sm" : "bg-white border-transparent hover:bg-mx-slate-50/50")}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-sm text-text-primary truncate pr-mx-md">{lead.name}</h3>
                                        {lead.score > 90 && <Badge className="bg-status-success-surface text-status-success border-mx-emerald-100 text-[8px]">HOT</Badge>}
                                    </div>
                                    <div className="flex justify-between items-center mx-text-caption !text-[8px] opacity-60 mb-mx-sm">
                                        <span>{lead.car}</span>
                                        <span>{lead.source}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono-numbers font-black text-text-primary">R$ {(lead.value / 1000).toFixed(0)}k</span>
                                        <Badge variant="outline" className="text-[8px] h-5 rounded-md px-2 uppercase">{lead.stage}</Badge>
                                    </div>
                                    {selected === lead.id && <div className="absolute right-mx-sm top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center shadow-mx-md"><ChevronRight className="w-3 h-3 text-white" /></div>}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Detail Section */}
                <div className="flex-1 min-h-0">
                    {selectedLead ? (
                        <div className="mx-card h-full overflow-hidden flex flex-col">
                            <div className="p-mx-lg md:p-mx-xl border-b border-border-subtle bg-mx-slate-50/20">
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-mx-lg">
                                    <div className="flex items-center gap-mx-md">
                                        <div className="w-16 h-16 rounded-mx-lg bg-brand-secondary flex items-center justify-center text-white shadow-mx-lg transform -rotate-3"><User className="w-8 h-8" /></div>
                                        <div>
                                            <div className="flex items-center gap-mx-sm mb-1">
                                                <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase leading-none">{selectedLead.name}</h2>
                                                <Badge className="bg-brand-primary text-white border-none rounded-full h-6 px-3 text-[8px]">{selectedLead.stage}</Badge>
                                            </div>
                                            <div className="flex items-center gap-mx-md mx-text-caption opacity-60">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-brand-primary" /> Recebido em 02/04</span>
                                                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-status-success" /> (31) 98783-XXXX</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full lg:w-auto gap-mx-sm">
                                        <button className="w-12 h-12 rounded-mx-md border border-border-default bg-white flex items-center justify-center text-text-tertiary hover:text-text-primary shadow-mx-sm"><Mail size={20} /></button>
                                        <button onClick={() => handleWhatsApp()} className="flex-1 lg:flex-none h-12 px-mx-md rounded-full bg-status-success text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-mx-lg group"><MessageCircle size={16} className="group-hover:rotate-12 transition-transform" /> WhatsApp</button>
                                    </div>
                                </div>
                            </div>
                            
                            <ScrollArea className="flex-1 no-scrollbar">
                                <div className="p-mx-lg md:p-mx-xl space-y-mx-2xl">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-lg">
                                        <div className="space-y-1"><span className="mx-text-caption opacity-60">Interesse</span><p className="font-black text-lg text-text-primary leading-none">{selectedLead.car}</p></div>
                                        <div className="space-y-1"><span className="mx-text-caption opacity-60">Valor Estimado</span><p className="font-black text-lg text-text-primary font-mono-numbers leading-none">R$ {selectedLead.value.toLocaleString()}</p></div>
                                        <div className="space-y-1"><span className="mx-text-caption opacity-60">Score IA</span><div className="flex items-center gap-2"><p className="font-black text-2xl text-status-success font-mono-numbers leading-none">{selectedLead.score}</p><Star size={12} className="text-status-warning fill-current" /></div></div>
                                        <div className="space-y-1"><span className="mx-text-caption opacity-60">Responsável</span><div className="flex items-center gap-2"><div className="w-6 h-6 rounded bg-mx-slate-100 flex items-center justify-center text-[8px] font-black">JV</div><p className="font-bold text-xs">João V.</p></div></div>
                                    </div>

                                    <div className="space-y-mx-lg pt-mx-lg border-t border-border-subtle">
                                        <h3 className="mx-text-caption text-text-primary flex items-center gap-2"><TrendingUp size={12} className="text-brand-primary" /> Histórico Operacional</h3>
                                        <div className="space-y-mx-sm">
                                            {[1, 2, 3].map((_, i) => (
                                                <div key={i} className="flex gap-mx-md items-start relative pb-mx-md last:pb-0">
                                                    {i !== 2 && <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border-default"></div>}
                                                    <div className="w-6 h-6 rounded-full bg-white border border-border-default flex items-center justify-center shrink-0 z-10 shadow-mx-sm"><div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div></div>
                                                    <div className="bg-mx-slate-50/50 border border-border-subtle rounded-mx-lg p-mx-md flex-1">
                                                        <p className="text-sm font-black text-text-primary mb-1">Ação registrada no sistema</p>
                                                        <p className="mx-text-caption !text-[8px]">Há {i + 1}h • Especialista Responsável</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="mx-card h-full flex flex-col items-center justify-center text-text-tertiary bg-white/50 border-dashed border-2">
                            <User className="w-12 h-12 mb-mx-md opacity-20" />
                            <p className="mx-text-caption">Selecione uma Oportunidade</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
