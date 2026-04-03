import React, { useState, useMemo, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Clock, Filter, MessageSquare, MoreVertical, Phone, Search, Sparkles, TrendingUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'

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
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">LeadOps</h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60">Motor de Priorização Operacional</p>
        </div>

        <div className="flex flex-wrap gap-mx-sm shrink-0">
          <button className="mx-button-primary !bg-white !text-text-primary border border-border-default shadow-mx-sm hover:!bg-mx-slate-50 flex items-center gap-2">
            <Filter size={14} strokeWidth={3} /> Filtros
          </button>
          <button className="mx-button-primary bg-brand-secondary">Distribuir Manual</button>
        </div>
      </div>

      {/* Stats Quick Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0">
        {[
          { label: 'SLA OK', value: '12', icon: CheckCircle2, tone: 'bg-status-success-surface text-status-success border-mx-emerald-100' },
          { label: 'Alerta', value: '03', icon: Clock, tone: 'bg-status-warning-surface text-status-warning border-mx-amber-100' },
          { label: 'Atrasado', value: '01', icon: AlertCircle, tone: 'bg-status-error-surface text-status-error border-mx-rose-100' },
          { label: 'IA Hot', value: '05', icon: Sparkles, tone: 'bg-brand-primary-surface text-brand-primary border-mx-indigo-100' },
        ].map((item) => (
          <div key={item.label} className="mx-card p-mx-md group relative overflow-hidden">
            <div className="flex items-center justify-between gap-mx-sm relative z-10">
              <div>
                <p className="mx-text-caption mb-1">{item.label}</p>
                <p className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-left">{item.value}</p>
              </div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm', item.tone)}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-card overflow-hidden flex flex-col flex-1 min-h-[500px]">
        <div className="p-mx-lg border-b border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md bg-mx-slate-50/30">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="mx-input !h-12 !pl-11"
              placeholder="Buscar por nome, veículo ou fone..."
            />
          </div>
          <div className="flex items-center gap-mx-xs mx-text-caption">
            <TrendingUp size={14} className="text-brand-primary" strokeWidth={3} /> Prioridade Inteligente
          </div>
        </div>

        {isMobile ? (
          <div className="p-mx-md space-y-mx-sm bg-mx-slate-50/20">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="rounded-mx-lg border border-border-default bg-white p-mx-md shadow-mx-sm space-y-mx-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-black text-text-primary truncate uppercase tracking-tight">{lead.name}</p>
                    <p className="text-[10px] font-bold text-text-tertiary mt-1">{lead.phone}</p>
                  </div>
                  <div className={cn(
                    'flex items-center justify-center h-10 w-10 rounded-mx-md font-black text-sm shrink-0 border shadow-inner',
                    lead.score >= 80 ? 'bg-brand-secondary text-white border-black' : 'bg-mx-slate-50 text-text-primary border-border-default'
                  )}>
                    {lead.score}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-mx-slate-50 text-[8px] font-black uppercase tracking-widest text-text-tertiary border border-border-subtle">{lead.vehicle}</span>
                  <Badge variant="outline" className="text-[8px] font-black">{lead.status}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => window.open(`tel:${lead.phone}`)} className="h-12 rounded-mx-md border border-border-default bg-mx-slate-50 flex items-center justify-center text-text-tertiary hover:bg-mx-slate-100 transition-all"><Phone size={18} strokeWidth={2.5} /></button>
                  <button onClick={() => handleWhatsApp(lead.phone)} className="h-12 rounded-mx-md border border-mx-emerald-100 bg-status-success-surface flex items-center justify-center text-status-success transition-all"><MessageSquare size={18} strokeWidth={2.5} /></button>
                  <button className="h-12 rounded-mx-md bg-brand-secondary flex items-center justify-center text-white font-black text-[9px] uppercase tracking-widest">Abrir</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-mx-slate-50/50">
                <tr className="border-b border-border-default">
                  {['Lead / Contato', 'Ativo de Interesse', 'Score IA', 'Status / SLA', 'Consultor', 'Ações'].map((head) => (
                    <th key={head} className="px-mx-lg py-mx-md mx-text-caption">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white">
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)} className={cn('hover:bg-mx-slate-50/50 transition-colors cursor-pointer group', expandedLead === lead.id && 'bg-brand-primary-surface/30')}>
                      <td className="px-mx-lg py-mx-md">
                        <div className="flex items-center gap-mx-sm">
                          <div className="h-11 w-11 rounded-mx-md bg-brand-secondary flex items-center justify-center text-white font-black text-sm group-hover:rotate-6 transition-transform">{lead.name.charAt(0)}</div>
                          <div><p className="font-black text-sm text-text-primary leading-none mb-1">{lead.name}</p><p className="text-[10px] font-bold text-text-tertiary">{lead.phone}</p></div>
                        </div>
                      </td>
                      <td className="px-mx-lg py-mx-md">
                        <p className="font-black text-sm text-text-primary uppercase tracking-tight">{lead.vehicle}</p>
                        <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mt-1 opacity-60">{lead.source}</p>
                      </td>
                      <td className="px-mx-lg py-mx-md">
                        <div className="flex items-center gap-2">
                          <div className={cn('flex items-center justify-center h-9 w-9 rounded-xl font-black text-sm border shadow-sm', lead.score >= 80 ? 'bg-brand-secondary text-white' : 'bg-mx-slate-50 text-text-tertiary border-border-default')}>{lead.score}</div>
                          {lead.score >= 80 && <Sparkles size={14} className="text-brand-primary animate-pulse" />}
                        </div>
                      </td>
                      <td className="px-mx-lg py-mx-md">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="secondary" className="w-fit text-[8px] h-5 rounded-md">{lead.status}</Badge>
                          <div className="flex items-center gap-1.5 text-[10px] font-black">
                            {lead.sla === 'estourado' ? <AlertCircle size={12} className="text-status-error" /> : lead.sla === 'alerta' ? <Clock size={12} className="text-status-warning" /> : <CheckCircle2 size={12} className="text-status-success" />}
                            <span className={cn(lead.sla === 'estourado' ? 'text-status-error' : lead.sla === 'alerta' ? 'text-status-warning' : 'text-status-success')}>{lead.time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-mx-lg py-mx-md">
                        <span className="mx-text-caption !text-[9px] opacity-70">{lead.owner}</span>
                      </td>
                      <td className="px-mx-lg py-mx-md text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => window.open(`tel:${lead.phone}`)} className="w-10 h-10 rounded-mx-md text-text-tertiary hover:text-brand-primary hover:bg-brand-primary-surface transition-all flex items-center justify-center"><Phone size={18} strokeWidth={2.5} /></button>
                          <button onClick={() => handleWhatsApp(lead.phone)} className="w-10 h-10 rounded-mx-md text-text-tertiary hover:text-status-success hover:bg-status-success-surface transition-all flex items-center justify-center"><MessageSquare size={18} strokeWidth={2.5} /></button>
                          <button className="w-10 h-10 rounded-mx-md text-mx-slate-200 hover:text-text-primary transition-all flex items-center justify-center"><MoreVertical size={18} strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr className="bg-mx-slate-50/50 border-none">
                        <td colSpan={6} className="px-mx-xl py-mx-lg border-t border-border-subtle">
                          <div className="flex items-start gap-mx-lg max-w-4xl">
                            <div className="p-mx-md bg-brand-secondary rounded-mx-xl shadow-mx-lg transform -rotate-3"><Sparkles size={24} className="text-white" /></div>
                            <div className="flex-1">
                              <h4 className="mx-text-caption text-brand-primary mb-2">Diagnóstico Preditivo MX</h4>
                              <p className="text-base font-bold text-text-secondary leading-relaxed italic mb-mx-lg">"{lead.aiSuggestion}"</p>
                              <div className="flex gap-mx-sm">
                                <button className="mx-button-primary bg-brand-primary hover:bg-brand-primary-hover !h-10 !px-6">Executar Plano</button>
                                <button className="mx-button-primary !bg-white !text-text-primary border border-border-default !h-10 !px-6">Ver Logs</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
