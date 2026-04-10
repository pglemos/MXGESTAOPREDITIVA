import React, { useState, useMemo, useEffect } from 'react'
import { 
    AlertCircle, CheckCircle2, Clock, Filter, MessageSquare, 
    MoreVertical, Phone, Search, Sparkles, TrendingUp, X,
    ChevronRight, Zap, Target, Smartphone, History, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

const INITIAL_LEADS = [
  { id: 1, name: 'Carlos Silva', phone: '11987654321', vehicle: 'Jeep Compass 2022', source: 'Meta Ads', status: 'Novo', sla: 'estourado', time: '15m', owner: 'Joao', score: 92, aiSuggestion: 'Alta intenção de compra. Ligue imediatamente e ofereça test-drive.' },
  { id: 2, name: 'Ana Oliveira', phone: '11912345678', vehicle: 'Honda Civic 2021', source: 'RD Station', status: 'Em Contato', sla: 'ok', time: '2h', owner: 'Maria', score: 75, aiSuggestion: 'Perfil analítico. Envie comparativo com concorrentes via WhatsApp.' },
  { id: 3, name: 'Roberto Santos', phone: '11998765432', vehicle: 'VW Nivus 2023', source: 'WhatsApp', status: 'Agendado', sla: 'ok', time: '1d', owner: 'Joao', score: 88, aiSuggestion: 'Agendamento para sábado. Envie vídeo do carro 1 dia antes para aquecer.' },
  { id: 4, name: 'Fernanda Lima', phone: '11987651234', vehicle: 'Toyota Corolla 2020', source: 'Meta Ads', status: 'Novo', sla: 'alerta', time: '4m', owner: 'Pedro', score: 45, aiSuggestion: 'Lead frio. Tente contato via WhatsApp primeiro.' },
  { id: 5, name: 'Lucas Souza', phone: '11912348765', vehicle: 'Hyundai Creta 2022', source: 'Site', status: 'Proposta', sla: 'ok', time: '3d', owner: 'Maria', score: 95, aiSuggestion: 'Negociação avançada. Ofereça bônus na avaliação do usado para fechar hoje.' },
]

export default function LeadOps() {
  const [expandedLead, setExpandedLead] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredLeads = useMemo(() => {
    let result = [...INITIAL_LEADS]
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(term) || lead.vehicle.toLowerCase().includes(term) || lead.phone.includes(term)
      )
    }
    return result.sort((a, b) => b.score - a.score)
  }, [debouncedSearch])

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    window.open(`https://wa.me/${finalPhone}`, '_blank')
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / LeadOps Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Lead<span className="text-brand-primary">Ops</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">MOTOR DE PRIORIZAÇÃO OPERACIONAL • MX</Typography>
        </div>

        <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
          <Button variant="outline" className="h-mx-xl px-6 rounded-mx-full shadow-mx-sm uppercase font-black tracking-widest text-mx-tiny">
            <Filter size={16} className="mr-2" /> FILTROS
          </Button>
          <Button className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary">
            DISTRIBUIR MANUAL
          </Button>
        </div>
      </header>

      {/* Stats Quick Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-lg shrink-0">
        {[
          { label: 'SLA OK', value: '12', icon: CheckCircle2, tone: 'success' },
          { label: 'Alerta', value: '03', icon: Clock, tone: 'warning' },
          { label: 'Atrasado', value: '01', icon: AlertCircle, tone: 'error' },
          { label: 'IA Hot', value: '05', icon: Sparkles, tone: 'brand' },
        ].map((item) => (
          <Card key={item.label} className="p-mx-lg border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white overflow-hidden relative">
            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-mx-tiny">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-mx-micro">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums leading-none group-hover:scale-110 transition-transform origin-left">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-mx-xl w-mx-xl rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                'bg-status-error-surface border-mx-rose-100 text-status-error'
              )}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Table Area */}
      <Card className="flex-1 overflow-hidden flex flex-col border-none shadow-mx-xl bg-white mb-20">
        <CardHeader className="p-mx-10 border-b border-border-default bg-surface-alt/30 flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg">
          <div className="relative group w-full lg:w-mx-card-lg">
            <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
            <Input 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest"
                placeholder="BUSCAR POR NOME, VEÍCULO OU FONE..."
            />
          </div>
          <div className="flex items-center gap-mx-xs bg-white px-6 py-2.5 rounded-mx-full border border-border-default shadow-mx-sm">
            <TrendingUp size={16} className="text-brand-primary" strokeWidth={2.5} />
            <Typography variant="caption" className="font-black uppercase tracking-widest">Prioridade Inteligente</Typography>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-mx-elite-table">
            <thead>
                <tr className="bg-surface-alt/50 border-b border-border-default text-mx-tiny font-black uppercase tracking-mx-wide text-text-tertiary">
                    <th scope="col" className="pl-10 py-6">LEAD / CONTATO</th>
                    <th scope="col" className="px-6 py-6">ATIVO DE INTERESSE</th>
                    <th scope="col" className="px-6 py-6 text-center">SCORE IA</th>
                    <th scope="col" className="px-6 py-6 text-center">STATUS / SLA</th>
                    <th scope="col" className="px-6 py-6 text-center">CONSULTOR</th>
                    <th scope="col" className="pr-10 py-6 text-right">AÇÕES</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr 
                        onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} 
                        className={cn('hover:bg-surface-alt/30 transition-colors cursor-pointer group h-mx-3xl', expandedLead === lead.id && 'bg-mx-indigo-50/30')}
                    >
                      <td className="pl-10">
                        <div className="flex items-center gap-mx-sm">
                          <div className="h-mx-xl w-mx-xl rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center font-black text-sm shadow-mx-lg group-hover:rotate-6 transition-transform">{lead.name.charAt(0)}</div>
                          <div className="min-w-0">
                            <Typography variant="h3" className="text-sm uppercase tracking-tight leading-none mb-1 group-hover:text-brand-primary transition-colors">{lead.name}</Typography>
                            <Typography variant="caption" tone="muted" className="text-mx-tiny font-black">{lead.phone}</Typography>
                          </div>
                        </div>
                      </td>
                      <td className="px-6">
                        <Typography variant="h3" className="text-sm uppercase tracking-tight leading-none mb-1">{lead.vehicle}</Typography>
                        <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase opacity-60">{lead.source}</Typography>
                      </td>
                      <td className="px-6">
                        <div className="flex items-center justify-center gap-mx-xs">
                          <div className={cn('flex items-center justify-center h-mx-10 w-mx-10 rounded-mx-xl font-black text-sm border shadow-inner', 
                            lead.score >= 80 ? 'bg-brand-secondary text-white border-white/10' : 'bg-surface-alt text-text-tertiary'
                          )}>{lead.score}</div>
                          {lead.score >= 80 && <Sparkles size={14} className="text-brand-primary animate-pulse" />}
                        </div>
                      </td>
                      <td className="px-6">
                        <div className="flex flex-col items-center gap-mx-xs">
                          <Badge variant="outline" className="text-mx-micro font-black px-3 h-mx-5 border-border-strong">{lead.status.toUpperCase()}</Badge>
                          <div className="flex items-center gap-1.5 text-mx-micro font-black">
                            {lead.sla === 'estourado' ? <AlertCircle size={12} className="text-status-error" /> : lead.sla === 'alerta' ? <Clock size={12} className="text-status-warning" /> : <CheckCircle2 size={12} className="text-status-success" />}
                            <span className={cn(lead.sla === 'estourado' ? 'text-status-error' : lead.sla === 'alerta' ? 'text-status-warning' : 'text-status-success')}>{lead.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 text-center">
                        <Typography variant="caption" tone="muted" className="text-mx-micro font-black opacity-70 uppercase">{lead.owner}</Typography>
                      </td>
                      <td className="pr-10 text-right">
                        <div className="flex items-center justify-end gap-mx-xs" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${lead.phone}`)} className="w-mx-10 h-mx-10 rounded-mx-xl text-text-tertiary hover:text-brand-primary hover:bg-mx-indigo-50"><Phone size={18} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleWhatsApp(lead.phone)} className="w-mx-10 h-mx-10 rounded-mx-xl text-text-tertiary hover:text-status-success hover:bg-status-success-surface"><MessageSquare size={18} /></Button>
                          <Button variant="ghost" size="icon" className="w-mx-10 h-mx-10 rounded-mx-xl text-text-tertiary"><MoreVertical size={18} /></Button>
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                        {expandedLead === lead.id && (
                        <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-surface-alt/30">
                            <td colSpan={6} className="p-mx-0 overflow-hidden">
                                <div className="p-mx-10 md:p-14 border-t border-border-default flex flex-col md:flex-row items-start gap-mx-10">
                                    <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform -rotate-3 shrink-0"><Sparkles size={32} /></div>
                                    <div className="flex-1 space-y-mx-md">
                                        <div>
                                            <Typography variant="caption" tone="brand" className="mb-2 block font-black uppercase tracking-widest">Diagnóstico Preditivo MX</Typography>
                                            <Typography variant="p" className="text-lg font-bold text-text-secondary leading-relaxed italic">"{lead.aiSuggestion}"</Typography>
                                        </div>
                                        <div className="flex gap-mx-sm pt-4">
                                            <Button className="h-mx-xl px-8 rounded-mx-full shadow-mx-lg">EXECUTAR PLANO</Button>
                                            <Button variant="outline" className="h-mx-xl px-8 rounded-mx-full shadow-sm bg-white">VER LOGS</Button>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </motion.tr>
                        )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}
