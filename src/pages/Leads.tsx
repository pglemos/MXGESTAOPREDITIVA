import { useState, useMemo, useEffect } from 'react'
import {
    Search,
    Filter as FilterIcon,
    Phone,
    Mail,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Star,
    MessageCircle,
    Calendar,
    ChevronRight,
    User,
    Zap,
    X,
    ExternalLink
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

    // Debounce search to prevent O(n) filter on every keystroke
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const filtered = useMemo(() => {
        return leads.filter((l) => {
            if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
            if (debouncedSearch) {
                const lower = debouncedSearch.toLowerCase()
                return l.name.toLowerCase().includes(lower) || l.car.toLowerCase().includes(lower)
            }
            return true
        })
    }, [leads, sourceFilter, debouncedSearch])

    // Update selected if current selected lead is filtered out
    useEffect(() => {
        if (selected && !filtered.find(l => l.id === selected)) {
            setSelected(filtered[0]?.id || null)
        }
    }, [filtered, selected])

    const selectedLead = useMemo(() => 
        selected ? leads.find((l) => l.id === selected) : null
    , [selected, leads])

    const leadStats = [
        { title: 'Total Leads (Hoje)', value: '42', trend: '+12%', icon: TrendingUp },
        { title: 'SLA Médio', value: '4.2m', trend: '-18%', icon: Clock, reverseColor: true },
        { title: 'Taxa de Conversão', value: '18.4%', trend: '+2.1%', icon: Zap },
    ]

    const handleWhatsApp = (phone?: string) => {
        const num = phone || '31987830000'
        const cleanPhone = num.replace(/\D/g, '')
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
        window.open(`https://wa.me/${finalPhone}`, '_blank')
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 h-full flex flex-col px-4 md:p-0 text-pure-black">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">CRM Integrado</span>
                    </div>
                    <h1 className="text-[42px] font-black tracking-tighter leading-none mb-4">Pipeline de <span className="text-electric-blue">Oportunidades</span></h1>
                    <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">Gestão inteligente de contatos, priorização por score e automação de conversão.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <Button className="w-full md:w-auto bg-pure-black hover:bg-black text-white rounded-full px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] shadow-3xl transition-all active:scale-95">
                        Novo Lead Manual
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leadStats.map((stat) => (
                    <div key={stat.title} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-electric-blue/10 transition-colors" />
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <p className="text-[9px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">{stat.title}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-3xl font-black tracking-tighter text-pure-black font-mono-numbers">{stat.value}</h3>
                                <div className={cn('flex items-center text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border',
                                    stat.trend.startsWith('+') ? (stat.reverseColor ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100') :
                                        (stat.reverseColor ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'))}>
                                    {stat.trend}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0 pb-10">
                {/* List Section */}
                <div className="w-full md:w-[420px] flex flex-col shrink-0 bg-white border border-gray-100 shadow-elevation rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-100 space-y-6 bg-gray-50/30">
                        <div className="flex gap-3">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nome ou veículo..."
                                    className="w-full pl-11 pr-10 h-12 bg-white border border-gray-100 rounded-full text-sm font-bold focus:outline-none focus:border-electric-blue/30 focus:shadow-lg transition-all"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <Button variant="outline" size="icon" className="h-12 w-12 border-gray-100 bg-white rounded-2xl shadow-sm hover:shadow-md">
                                <FilterIcon className="w-4 h-4 text-gray-400" />
                            </Button>
                        </div>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-full rounded-2xl h-12 border-gray-100 bg-white shadow-sm font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400">
                                <SelectValue placeholder="Fonte do Lead" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                <SelectItem value="all">Todas as Fontes</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                                <SelectItem value="Webmotors">Webmotors</SelectItem>
                                <SelectItem value="Site">Site</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ScrollArea className="flex-1 no-scrollbar">
                        <div className="p-6 space-y-4">
                            {filtered.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <Search className="w-12 h-12 text-gray-100 mx-auto" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum lead encontrado</p>
                                </div>
                            ) : filtered.map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelected(lead.id)}
                                    className={cn(
                                        "p-5 cursor-pointer rounded-[1.8rem] transition-all relative border",
                                        selected === lead.id
                                            ? "bg-indigo-50/30 border-electric-blue/20 shadow-sm"
                                            : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-sm text-pure-black truncate pr-4">{lead.name}</h3>
                                        {lead.score > 90 && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black tracking-widest px-2 h-5 rounded-lg">HOT</Badge>}
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4 opacity-70">
                                        <span>{lead.car}</span>
                                        <span>{lead.source}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-mono-numbers font-black text-pure-black">R$ {(lead.value / 1000).toFixed(0)}k</span>
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border-gray-100 rounded-lg">{lead.stage}</Badge>
                                    </div>
                                    {selected === lead.id && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-electric-blue flex items-center justify-center shadow-lg shadow-indigo-200"><ChevronRight className="w-4 h-4 text-white" /></div>}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Detail Section */}
                <div className="flex-1 min-h-0">
                    {selectedLead ? (
                        <div className="h-full bg-white border border-gray-100 shadow-elevation rounded-[3rem] overflow-hidden flex flex-col">
                            <div className="p-8 md:p-10 border-b border-gray-50 bg-gray-50/20">
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[2rem] bg-pure-black flex items-center justify-center text-white shadow-2xl transform -rotate-3">
                                            <User className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 className="text-3xl font-black text-pure-black tracking-tighter">{selectedLead.name}</h2>
                                                <Badge className="bg-electric-blue text-white border-none rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200">{selectedLead.stage}</Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-electric-blue" /> Recebido há 2h</span>
                                                <span className="flex items-center gap-2 hover:text-pure-black cursor-pointer transition-colors"><Phone className="w-4 h-4 text-emerald-500" /> (31) 98783-XXXX</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full lg:w-auto gap-3">
                                        <button className="w-14 h-14 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:text-pure-black hover:shadow-xl transition-all active:scale-90 shadow-sm">
                                            <Mail size={24} strokeWidth={2.5} />
                                        </button>
                                        <button 
                                            onClick={() => handleWhatsApp()}
                                            className="flex-1 lg:flex-none h-14 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 transition-all active:scale-95 group"
                                        >
                                            <MessageCircle size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" /> Iniciar WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <ScrollArea className="flex-1 no-scrollbar">
                                <div className="p-8 md:p-10 space-y-12">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">Interesse Primário</span>
                                            <p className="font-black text-xl text-pure-black tracking-tight leading-none">{selectedLead.car}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">Potencial Bruto</span>
                                            <p className="font-black text-xl text-pure-black tracking-tight leading-none font-mono-numbers">R$ {selectedLead.value.toLocaleString('pt-BR')}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">Lead Score IA</span>
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-2xl text-emerald-600 font-mono-numbers leading-none">{selectedLead.score}</p>
                                                <div className="flex -space-x-1.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} size={14} className={cn(s <= Math.round(selectedLead.score / 20) ? "text-amber-400 fill-amber-400 shadow-sm" : "text-gray-100 fill-gray-100")} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 opacity-60">Consultor</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] text-pure-black font-black">JV</div>
                                                <p className="font-bold text-sm text-pure-black opacity-80">João Vendedor</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-10 border-t border-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-black text-xs text-pure-black uppercase tracking-[0.3em] flex items-center gap-3">
                                                <TrendingUp className="w-4 h-4 text-electric-blue" strokeWidth={3} /> Histórico Operacional
                                            </h3>
                                            <button className="text-[9px] font-black uppercase tracking-widest text-electric-blue hover:underline">Ver Log Completo</button>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {[
                                                { time: 'Há 5m', action: 'Lead movido para ' + selectedLead.stage, user: 'João Vendedor', icon: TrendingUp },
                                                { time: 'Há 1h', action: 'Mensagem enviada via WhatsApp', user: 'João Vendedor', icon: MessageCircle },
                                                { time: 'Há 2h', action: 'Lead recebido via Meta Ads', user: 'Sistema Preditivo', icon: Zap },
                                            ].map((activity, i) => (
                                                <div key={i} className="flex gap-6 items-start relative pb-6 last:pb-0">
                                                    {i !== 2 && <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-50"></div>}
                                                    <div className="w-6 h-6 rounded-full bg-white border-4 border-gray-50 flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-electric-blue shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                                    </div>
                                                    <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 flex-1 hover:bg-white transition-all hover:shadow-md">
                                                        <p className="text-sm font-black text-pure-black leading-tight mb-1">{activity.action}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{activity.time} • Responsável: {activity.user}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 bg-white border border-gray-50 rounded-[3rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                            <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                                <User className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="font-black text-[10px] uppercase tracking-[0.4em] text-gray-400">Selecione uma Oportunidade</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
