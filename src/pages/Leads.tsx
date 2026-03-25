import { useState } from 'react'
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
    const [sourceFilter, setSourceFilter] = useState('all')
    const [selected, setSelected] = useState<string | null>(leads[0]?.id || null)

    const filtered = leads.filter((l) => {
        if (sourceFilter !== 'all' && l.source !== sourceFilter) return false
        if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.car.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const selectedLead = selected ? leads.find((l) => l.id === selected) : null

    const leadStats = [
        { title: 'Total Leads (Hoje)', value: '42', trend: '+12%', icon: TrendingUp },
        { title: 'SLA Médio', value: '4.2m', trend: '-18%', icon: Clock, reverseColor: true },
        { title: 'Taxa de Conversão', value: '18.4%', trend: '+2.1%', icon: Zap },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 h-full flex flex-col px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">CRM INTEGRADO</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Pipeline de <span className="text-electric-blue">Oportunidades</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Gestão inteligente de contatos e conversão.</p>
                </div>
                <div className="flex w-full md:w-auto gap-3">
                    <Button className="w-full md:w-auto bg-electric-blue hover:bg-electric-blue/90 text-white rounded-xl px-6 font-bold h-11">
                        Gerar Lead Manual
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leadStats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm bg-white dark:bg-[#111] rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-electric-blue/10 transition-colors"></div>
                        <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
                            <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">{stat.title}</p>
                            <div className="flex items-end justify-between">
                                <h3 className="text-2xl font-extrabold tracking-tighter text-pure-black dark:text-off-white font-mono-numbers">{stat.value}</h3>
                                <div className={cn('flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                                    stat.trend.startsWith('+') ? (stat.reverseColor ? 'text-mars-orange bg-mars-orange/10' : 'text-emerald-500 bg-emerald-500/10') :
                                        (stat.reverseColor ? 'text-emerald-500 bg-emerald-500/10' : 'text-mars-orange bg-mars-orange/10'))}>
                                    {stat.trend}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* List Section */}
                <Card className="w-full md:w-[400px] flex flex-col shrink-0 border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-6 border-b border-black/5 dark:border-white/5 space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nome ou carro..."
                                    className="pl-10 h-10 bg-black/5 dark:bg-white/5 border-none rounded-xl text-sm font-bold focus-visible:ring-electric-blue"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-white/20 bg-black/5 dark:bg-white/5 rounded-xl">
                                <FilterIcon className="w-4 h-4" />
                            </Button>
                        </div>
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-full rounded-xl h-10 border-white/20 bg-black/5 dark:bg-white/5 font-bold text-xs">
                                <SelectValue placeholder="Fonte do Lead" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Todas as Fontes</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                                <SelectItem value="Webmotors">Webmotors</SelectItem>
                                <SelectItem value="Site">Site</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {filtered.map((lead) => (
                                <div
                                    key={lead.id}
                                    onClick={() => setSelected(lead.id)}
                                    className={cn(
                                        "p-4 cursor-pointer rounded-2xl transition-all relative border border-transparent",
                                        selected === lead.id
                                            ? "bg-electric-blue/5 border-electric-blue/20 shadow-sm"
                                            : "hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-extrabold text-sm text-pure-black dark:text-off-white truncate pr-4">{lead.name}</h3>
                                        {lead.score > 90 && <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] px-1.5 h-4">HOT</Badge>}
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground mb-3">
                                        <span>{lead.car}</span>
                                        <span>{lead.source}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-mono-numbers font-extrabold text-pure-black dark:text-off-white">R$ {(lead.value / 1000).toFixed(0)}k</span>
                                        <Badge variant="secondary" className="text-[9px] font-bold bg-black/5 dark:bg-white/10">{lead.stage}</Badge>
                                    </div>
                                    {selected === lead.id && <div className="absolute right-2 top-1/2 -translate-y-1/2"><ChevronRight className="w-4 h-4 text-electric-blue" /></div>}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>

                {/* Detail Section */}
                <div className="flex-1 overflow-y-auto">
                    {selectedLead ? (
                        <Card className="h-full border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden flex flex-col">
                            <CardHeader className="p-8 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-electric-blue/[0.03] to-transparent">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                                        <div className="w-16 h-16 rounded-3xl bg-electric-blue/10 flex items-center justify-center text-electric-blue">
                                            <User className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                                                <h2 className="text-2xl sm:text-3xl font-extrabold text-pure-black dark:text-off-white">{selectedLead.name}</h2>
                                                <Badge className="bg-electric-blue text-white border-none rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase">{selectedLead.stage}</Badge>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-bold text-muted-foreground">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Recebido há 2h</span>
                                                <span className="flex items-center gap-1.5 transition-colors hover:text-electric-blue cursor-pointer"><Phone className="w-3.5 h-3.5" /> (31) 98783-XXXX</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full sm:w-auto gap-2">
                                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/20 bg-white dark:bg-black">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                        </Button>
                                        <Button className="flex-1 sm:flex-none h-12 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold">
                                            <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Interesse</span>
                                        <p className="font-extrabold text-lg text-pure-black dark:text-off-white">{selectedLead.car}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Potencial</span>
                                        <p className="font-extrabold text-lg text-pure-black dark:text-off-white font-mono-numbers">R$ {selectedLead.value.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead Score</span>
                                        <div className="flex items-center gap-2">
                                            <p className="font-extrabold text-lg text-emerald-500 font-mono-numbers">{selectedLead.score}</p>
                                            <div className="flex -space-x-1">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} className={cn("w-3 h-3", s <= Math.round(selectedLead.score / 20) ? "text-yellow-500 fill-yellow-500" : "text-muted/30")} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendedor</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-electric-blue/10 flex items-center justify-center text-[10px] text-electric-blue font-bold">JV</div>
                                            <p className="font-extrabold text-sm text-pure-black dark:text-off-white">João Vendedor</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-extrabold text-sm text-pure-black dark:text-off-white flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-electric-blue" /> Histórico de Atividades
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { time: 'Há 5m', action: 'Lead movido para ' + selectedLead.stage, user: 'João Vendedor', icon: TrendingUp },
                                            { time: 'Há 1h', action: 'Mensagem enviada via WhatsApp', user: 'João Vendedor', icon: MessageCircle },
                                            { time: 'Há 2h', action: 'Lead recebido (Meta Ads)', user: 'Sistema', icon: Zap },
                                        ].map((activity, i) => (
                                            <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                                                {i !== 2 && <div className="absolute left-[9px] top-6 bottom-0 w-[1px] bg-black/5 dark:bg-white/5"></div>}
                                                <div className="w-[19px] h-[19px] rounded-full bg-white dark:bg-black border-2 border-electric-blue/20 flex items-center justify-center shrink-0 z-10">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-electric-blue"></div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-pure-black dark:text-off-white">{activity.action}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{activity.time} • Por {activity.user}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-white dark:bg-[#111] rounded-3xl animate-pulse">
                            <User className="w-12 h-12 mb-4 opacity-20" />
                            <span className="font-bold text-sm">Selecione uma oportunidade no painel lateral</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
