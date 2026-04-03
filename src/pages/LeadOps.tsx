import React, { useState, useMemo, useEffect } from 'react'
import { AlertCircle, CheckCircle2, Clock, Filter, MessageSquare, MoreVertical, Phone, Search, Sparkles, TrendingUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filteredLeads = useMemo(() => {
    let result = [...INITIAL_LEADS]
    
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase()
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(lowerSearch) ||
        lead.vehicle.toLowerCase().includes(lowerSearch) ||
        lead.phone.includes(lowerSearch)
      )
    }

    return result.sort((a, b) => b.score - a.score)
  }, [debouncedSearch])

  const toggleLead = (id: number) => {
    setExpandedLead(expandedLead === id ? null : id)
  }

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    window.open(`https://wa.me/${finalPhone}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 text-pure-black p-4 md:p-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Operação de Leads</span>
          </div>
          <h1 className="text-[42px] font-black tracking-tighter leading-none mb-4">LeadOps</h1>
          <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">
            Priorização inteligente baseada em score de IA e monitoramento de SLA em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="soft-pill px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-pure-black hover:shadow-xl transition-all flex items-center justify-center gap-2 border border-gray-100">
            <Filter className="h-4 w-4" strokeWidth={3} /> Filtros
          </button>
          <button className="rounded-full bg-pure-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-3xl">
            Distribuir Manual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'SLA OK', value: '12', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Alerta', value: '03', icon: Clock, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Atrasado', value: '01', icon: AlertCircle, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
          { label: 'Quentes', value: '05', icon: Sparkles, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{item.label}</p>
                <p className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-left">{item.value}</p>
              </div>
              <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center border', item.tone)}>
                <item.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-elevation overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gray-50/30">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-12 py-4 border border-gray-100 rounded-full bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue/20 focus:border-electric-blue/30 text-sm font-bold transition-all shadow-sm"
              placeholder="Buscar por nome, veículo ou fone..."
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">
            <TrendingUp className="h-4 w-4 text-electric-blue" strokeWidth={3} />
            Prioridade por Score IA
          </div>
        </div>

        {isMobile ? (
          <div className="p-4 space-y-4 bg-gray-50/20">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-black text-pure-black truncate">{lead.name}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">{lead.phone}</p>
                  </div>
                  <div className={cn(
                    'flex items-center justify-center h-12 w-12 rounded-2xl font-black text-sm shrink-0 border shadow-inner',
                    lead.score >= 80 ? 'bg-pure-black text-white border-black' : 
                    lead.score >= 60 ? 'bg-gray-100 text-pure-black border-gray-200' : 
                    'bg-rose-50 text-rose-600 border-rose-100'
                  )}>
                    {lead.score}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-gray-50 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 border border-gray-100">{lead.vehicle}</span>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                    lead.status === 'Novo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-pure-black border-gray-200'
                  )}>{lead.status}</span>
                </div>

                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={12} className="text-electric-blue" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-electric-blue">Insight IA</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed">{lead.aiSuggestion}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button onClick={() => window.open(`tel:${lead.phone}`)} className="rounded-2xl border border-gray-100 bg-gray-50 py-4 flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-95 transition-all">
                    <Phone size={18} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleWhatsApp(lead.phone)} className="rounded-2xl border border-emerald-100 bg-emerald-50 py-4 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all">
                    <MessageSquare size={18} strokeWidth={2.5} />
                  </button>
                  <button className="rounded-2xl bg-pure-black py-4 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  {['Lead / Contato', 'Interesse', 'Prioridade', 'Status / SLA', 'Responsável', 'Ações'].map((head) => (
                    <th key={head} scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr
                      className={cn(
                        'hover:bg-gray-50/50 transition-colors cursor-pointer group', 
                        expandedLead === lead.id && 'bg-indigo-50/20'
                      )}
                      onClick={() => toggleLead(lead.id)}
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-pure-black flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:rotate-6 transition-transform">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-pure-black">{lead.name}</div>
                            <div className="text-xs font-bold text-gray-400 mt-0.5">{lead.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-black text-pure-black">{lead.vehicle}</div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{lead.source}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex items-center justify-center h-10 w-10 rounded-xl font-black text-sm border shadow-sm',
                            lead.score >= 80 ? 'bg-pure-black text-white border-black' : 
                            lead.score >= 60 ? 'bg-gray-50 text-pure-black border-gray-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          )}>
                            {lead.score}
                          </div>
                          {lead.score >= 80 && <Sparkles className="h-4 w-4 text-electric-blue animate-pulse" strokeWidth={3} />}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span className={cn(
                            "px-3 py-1 inline-flex text-[9px] font-black uppercase tracking-[0.2em] rounded-full border w-fit",
                            lead.status === 'Novo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white text-pure-black border-gray-200'
                          )}>
                            {lead.status}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-black">
                            {lead.sla === 'estourado' && <AlertCircle className="h-4 w-4 text-rose-600" strokeWidth={2.5} />}
                            {lead.sla === 'alerta' && <Clock className="h-4 w-4 text-amber-600" strokeWidth={2.5} />}
                            {lead.sla === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />}
                            <span className={cn(
                              lead.sla === 'estourado' && 'text-rose-600', 
                              lead.sla === 'alerta' && 'text-amber-600', 
                              lead.sla === 'ok' && 'text-emerald-600'
                            )}>
                              {lead.time}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-pure-black text-xs font-black">
                            {lead.owner.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-pure-black uppercase tracking-widest opacity-70">{lead.owner}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => window.open(`tel:${lead.phone}`)} className="text-gray-400 hover:text-electric-blue p-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
                            <Phone size={20} strokeWidth={2.5} />
                          </button>
                          <button onClick={() => handleWhatsApp(lead.phone)} className="text-gray-400 hover:text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
                            <MessageSquare size={20} strokeWidth={2.5} />
                          </button>
                          <button className="text-gray-300 hover:text-pure-black p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                            <MoreVertical size={20} strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedLead === lead.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-8 py-10 border-t border-gray-100">
                          <div className="flex items-start gap-8 max-w-4xl">
                            <div className="p-5 bg-pure-black rounded-3xl shadow-2xl transform -rotate-3">
                              <Sparkles className="h-8 w-8 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-electric-blue mb-3">Diagnóstico Preditivo MX</h4>
                              <p className="text-lg font-bold text-gray-600 leading-relaxed mb-8">{lead.aiSuggestion}</p>
                              <div className="flex flex-wrap gap-4">
                                <button className="px-8 py-4 bg-electric-blue text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                                  Executar Ação Sugerida
                                </button>
                                <button className="px-8 py-4 bg-white border border-gray-200 text-pure-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                                  Ver Histórico
                                </button>
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
