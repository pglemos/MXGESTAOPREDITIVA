import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Filter, MessageSquare, MoreVertical, Phone, Search, Sparkles, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const leads = [
  { id: 1, name: 'Carlos Silva', phone: '(11) 98765-4321', vehicle: 'Jeep Compass 2022', source: 'Meta Ads', status: 'Novo', sla: 'estourado', time: '15m', owner: 'Joao', score: 92, aiSuggestion: 'Alta intencao de compra. Ligue imediatamente e ofereca test-drive.' },
  { id: 2, name: 'Ana Oliveira', phone: '(11) 91234-5678', vehicle: 'Honda Civic 2021', source: 'RD Station', status: 'Em Contato', sla: 'ok', time: '2h', owner: 'Maria', score: 75, aiSuggestion: 'Perfil analitico. Envie comparativo com concorrentes via WhatsApp.' },
  { id: 3, name: 'Roberto Santos', phone: '(11) 99876-5432', vehicle: 'VW Nivus 2023', source: 'WhatsApp', status: 'Agendado', sla: 'ok', time: '1d', owner: 'Joao', score: 88, aiSuggestion: 'Agendamento para sabado. Envie video do carro 1 dia antes para aquecer.' },
  { id: 4, name: 'Fernanda Lima', phone: '(11) 98765-1234', vehicle: 'Toyota Corolla 2020', source: 'Meta Ads', status: 'Novo', sla: 'alerta', time: '4m', owner: 'Pedro', score: 45, aiSuggestion: 'Lead frio. Tente contato via WhatsApp primeiro.' },
  { id: 5, name: 'Lucas Souza', phone: '(11) 91234-8765', vehicle: 'Hyundai Creta 2022', source: 'Site', status: 'Proposta', sla: 'ok', time: '3d', owner: 'Maria', score: 95, aiSuggestion: 'Negociacao avancada. Ofereca bonus na avaliacao do usado para fechar hoje.' },
]

export default function LeadOps() {
  const [expandedLead, setExpandedLead] = useState<number | null>(null)

  const toggleLead = (id: number) => {
    setExpandedLead(expandedLead === id ? null : id)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-[#1A1D20]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.35)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Operacao de Leads</span>
          </div>
          <h1 className="text-[38px] font-black tracking-tighter leading-none">LeadOps</h1>
          <p className="mt-3 text-sm font-bold text-gray-500 max-w-2xl">
            Priorizacao, SLA e distribuicao operacional no padrao visual do admin cockpit.
          </p>
        </div>

        <div className="flex w-full lg:w-auto flex-col sm:flex-row flex-wrap gap-3 self-start lg:self-auto">
          <button className="soft-pill px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1D20] hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4" strokeWidth={2.5} />
            Filtros
          </button>
          <button className="rounded-full bg-[#1A1D20] text-white px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg w-full sm:w-auto">
            Distribuir Manualmente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'SLA ok', value: '12', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600' },
          { label: 'Alerta', value: '3', icon: Clock, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Estourado', value: '1', icon: AlertCircle, tone: 'bg-orange-50 text-orange-600' },
          { label: 'Leads quentes', value: '5', icon: Sparkles, tone: 'bg-indigo-50 text-indigo-600' },
        ].map((item) => (
          <div key={item.label} className="inner-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{item.label}</p>
                <p className="text-4xl font-black tracking-tighter">{item.value}</p>
              </div>
              <div className={clsx('h-12 w-12 rounded-2xl flex items-center justify-center', item.tone)}>
                <item.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="inner-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#F8FAFC]/70">
          <div className="relative w-full lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
              placeholder="Buscar leads..."
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
            <TrendingUp className="h-4 w-4 text-indigo-600" strokeWidth={2.5} />
            Ordenado por score IA
          </div>
        </div>

        <div className="md:hidden p-4 space-y-4">
          {leads.sort((a, b) => b.score - a.score).map((lead) => (
            <div key={lead.id} className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-black text-[#1A1D20] truncate">{lead.name}</p>
                  <p className="text-xs font-bold text-gray-500">{lead.phone}</p>
                </div>
                <div className={clsx(
                  'flex items-center justify-center h-10 w-10 rounded-xl font-black text-sm shrink-0',
                  lead.score >= 80 ? 'bg-[#1A1D20] text-white' : lead.score >= 60 ? 'bg-gray-100 text-[#1A1D20]' : 'bg-orange-50 text-orange-600'
                )}>
                  {lead.score}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F8FAFC] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{lead.vehicle}</span>
                <span className="px-3 py-1 rounded-full bg-[#F8FAFC] text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{lead.source}</span>
                <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1D20]">{lead.status}</span>
              </div>
              <p className="text-sm font-bold text-gray-600">{lead.aiSuggestion}</p>
              <div className="grid grid-cols-3 gap-2">
                <button className="rounded-2xl border border-gray-100 bg-[#F8FAFC] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A1D20]">Ligar</button>
                <button className="rounded-2xl border border-gray-100 bg-[#F8FAFC] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A1D20]">Whats</button>
                <button className="rounded-2xl bg-[#1A1D20] py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white">Abrir</button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#F8FAFC]/70">
              <tr>
                {['Lead', 'Veiculo', 'Score IA', 'Status / SLA', 'Dono', 'Acoes'].map((head) => (
                  <th key={head} scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.sort((a, b) => b.score - a.score).map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr
                    className={clsx('hover:bg-[#F8FAFC]/70 transition-colors cursor-pointer', expandedLead === lead.id && 'bg-[#F8FAFC]')}
                    onClick={() => toggleLead(lead.id)}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-[#1A1D20] flex items-center justify-center text-white font-black text-sm">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-[#1A1D20]">{lead.name}</div>
                          <div className="text-sm font-bold text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-black text-[#1A1D20]">{lead.vehicle}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{lead.source}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          'flex items-center justify-center h-9 w-9 rounded-xl font-black text-sm',
                          lead.score >= 80 ? 'bg-[#1A1D20] text-white' : lead.score >= 60 ? 'bg-gray-100 text-[#1A1D20]' : 'bg-orange-50 text-orange-600'
                        )}>
                          {lead.score}
                        </div>
                        {lead.score >= 80 && <Sparkles className="h-4 w-4 text-indigo-600" strokeWidth={2.5} />}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span className="px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-[0.2em] rounded-full bg-white border border-gray-200 text-[#1A1D20] w-fit">
                          {lead.status}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          {lead.sla === 'estourado' && <AlertCircle className="h-4 w-4 text-orange-600" strokeWidth={2.5} />}
                          {lead.sla === 'alerta' && <Clock className="h-4 w-4 text-amber-600" strokeWidth={2.5} />}
                          {lead.sla === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />}
                          <span className={clsx(lead.sla === 'estourado' && 'text-orange-600', lead.sla === 'alerta' && 'text-amber-600', lead.sla === 'ok' && 'text-emerald-600')}>
                            {lead.time}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#1A1D20] text-xs font-black">
                          {lead.owner.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-[#1A1D20]">{lead.owner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button className="text-gray-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-colors">
                          <Phone className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <button className="text-gray-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 transition-colors">
                          <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                        <button className="text-gray-400 hover:text-[#1A1D20] p-2 rounded-xl hover:bg-black/5 transition-colors">
                          <MoreVertical className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedLead === lead.id && (
                    <tr className="bg-[#F8FAFC]/80">
                      <td colSpan={6} className="px-6 py-6 border-t border-gray-100">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-[#1A1D20] rounded-2xl">
                            <Sparkles className="h-6 w-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Analise e sugestao da IA</h4>
                            <p className="text-base font-bold text-gray-600">{lead.aiSuggestion}</p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button className="px-5 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                Executar acao sugerida
                              </button>
                              <button className="px-5 py-3 bg-white border border-gray-200 text-[#1A1D20] text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-gray-50 transition-colors">
                                Ver historico completo
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
      </div>
    </div>
  )
}
