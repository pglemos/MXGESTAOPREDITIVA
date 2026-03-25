import { useState } from 'react'
import { AlertTriangle, Calendar, Car, CheckCircle, Clock, FileText, PhoneCall, XCircle } from 'lucide-react'
import clsx from 'clsx'

const activities = [
  { id: 1, type: 'attempt', label: 'Tentativa de Contato', icon: PhoneCall, color: 'bg-indigo-50 text-indigo-600', lead: 'Carlos Silva', time: '10:30', result: 'Sem sucesso' },
  { id: 2, type: 'scheduled', label: 'Retorno Agendado', icon: Clock, color: 'bg-orange-50 text-orange-600', lead: 'Ana Oliveira', time: '11:15', result: 'Para amanha 14h' },
  { id: 3, type: 'appointment', label: 'Agendamento Feito', icon: Calendar, color: 'bg-slate-100 text-[#1A1D20]', lead: 'Roberto Santos', time: '14:00', result: 'Sabado 10h' },
  { id: 4, type: 'visit', label: 'Visita Realizada', icon: Car, color: 'bg-indigo-50 text-indigo-600', lead: 'Fernanda Lima', time: '15:45', result: 'Test-drive feito' },
  { id: 5, type: 'proposal', label: 'Proposta Enviada', icon: FileText, color: 'bg-orange-50 text-orange-600', lead: 'Lucas Souza', time: '16:20', result: 'Aguardando aprovacao' },
  { id: 6, type: 'won', label: 'Venda Fechada', icon: CheckCircle, color: 'bg-[#1A1D20] text-white', lead: 'Juliana Costa', time: '17:00', result: 'R$ 120.000' },
  { id: 7, type: 'lost', label: 'Lead Perdido', icon: XCircle, color: 'bg-orange-50 text-orange-600', lead: 'Marcos Paulo', time: '17:30', result: 'Comprou concorrente' },
]

const quickActions = [
  { label: 'Tentei Contato', icon: PhoneCall, tone: 'group-hover:text-indigo-600 group-hover:bg-indigo-50/70' },
  { label: 'Retorno Agendado', icon: Clock, tone: 'group-hover:text-orange-600 group-hover:bg-orange-50/70' },
  { label: 'Agendamento', icon: Calendar, tone: 'group-hover:text-[#1A1D20] group-hover:bg-slate-100' },
  { label: 'Visita Feita', icon: Car, tone: 'group-hover:text-indigo-600 group-hover:bg-indigo-50/70' },
  { label: 'Proposta', icon: FileText, tone: 'group-hover:text-orange-600 group-hover:bg-orange-50/70' },
  { label: 'Perdido', icon: XCircle, tone: 'group-hover:text-orange-600 group-hover:bg-orange-50/70' },
]

export default function Activities() {
  const [selectedLead, setSelectedLead] = useState('Carlos Silva')

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 text-[#1A1D20]">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.35)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Cadencia Operacional</span>
          </div>
          <h1 className="text-[38px] font-black tracking-tighter leading-none">Registro de Atividades</h1>
          <p className="mt-3 text-sm font-bold text-gray-500 max-w-2xl">
            Timeline operacional e registro rapido de acoes no mesmo visual do sistema principal.
          </p>
        </div>

        <button className="soft-pill px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1D20] hover:shadow-lg transition-all self-start lg:self-auto">
          Hoje
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Acoes hoje', value: '24', tone: 'bg-indigo-50 text-indigo-600', icon: PhoneCall },
          { label: 'Agendamentos', value: '6', tone: 'bg-slate-100 text-[#1A1D20]', icon: Calendar },
          { label: 'Propostas', value: '4', tone: 'bg-orange-50 text-orange-600', icon: FileText },
          { label: 'Pendencias', value: '3', tone: 'bg-rose-50 text-rose-600', icon: AlertTriangle },
        ].map((item) => (
          <div key={item.label} className="inner-card p-5">
            <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', item.tone)}>
              <item.icon size={20} />
            </div>
            <p className="text-3xl font-black tracking-tighter">{item.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="inner-card p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black tracking-tight">Registro Rapido</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Input em um toque</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Lead selecionado</label>
              <select
                className="block w-full pl-4 pr-10 py-4 text-sm border border-gray-100 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl font-bold"
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
              >
                <option>Carlos Silva</option>
                <option>Ana Oliveira</option>
                <option>Roberto Santos</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button key={action.label} className="group rounded-[1.5rem] border border-gray-100 bg-[#F8FAFC]/70 p-5 transition-all hover:-translate-y-1 hover:shadow-xl text-left">
                  <div className={clsx('w-11 h-11 rounded-2xl bg-white text-gray-400 flex items-center justify-center mb-4 transition-all', action.tone)}>
                    <action.icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-black text-[#1A1D20]">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="inner-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Taxa de Execucao</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Disciplina de cadencia</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-black mb-2">
                  <span className="text-gray-500">Acoes realizadas</span>
                  <span className="text-indigo-600 font-mono-numbers">24 / 30</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-600 h-3 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-[1.5rem] border border-orange-100">
                <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-sm font-bold text-[#1A1D20]">
                  Voce tem 3 leads estagnados ha mais de 48h. A cadencia D+3 exige contato hoje.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="inner-card p-6 h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Timeline de Hoje</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Sequencia operacional do dia</p>
              </div>
            </div>

            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {activities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== activities.length - 1 ? (
                        <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-4">
                        <div>
                          <span className={clsx(activity.color, 'h-10 w-10 rounded-2xl flex items-center justify-center ring-8 ring-white')}>
                            <activity.icon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-bold text-gray-500">
                              <span className="font-black text-[#1A1D20] mr-2">{activity.label}</span>
                              para <span className="font-black text-[#1A1D20]">{activity.lead}</span>
                            </p>
                            <p className="mt-1 text-sm font-bold text-gray-500">{activity.result}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap font-black text-[#1A1D20] font-mono-numbers">
                            <time dateTime={activity.time}>{activity.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
