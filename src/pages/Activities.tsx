import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { AlertTriangle, Calendar, Car, CheckCircle, Clock, FileText, PhoneCall, XCircle, Search, RefreshCw, X, MoreVertical, Trash2, MapPin, UserCheck, Send, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const INITIAL_ACTIVITIES = [
  { id: '1', type: 'attempt', label: 'Tentativa de Contato', icon: PhoneCall, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', lead: 'Carlos Silva', time: '10:30', result: 'Sem sucesso' },
  { id: '2', type: 'scheduled', label: 'Retorno Agendado', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-100', lead: 'Ana Oliveira', time: '11:15', result: 'Para amanhã 14h' },
  { id: '3', type: 'appointment', label: 'Agendamento Feito', icon: Calendar, color: 'bg-blue-50 text-blue-600 border-blue-100', lead: 'Roberto Santos', time: '14:00', result: 'Sábado 10h' },
  { id: '4', type: 'visit', label: 'Visita Realizada', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', lead: 'Fernanda Lima', time: '15:45', result: 'Test-drive feito' },
  { id: '5', type: 'proposal', label: 'Proposta Enviada', icon: FileText, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', lead: 'Lucas Souza', time: '16:20', result: 'Aguardando aprovação' },
  { id: '6', type: 'won', label: 'Venda Fechada', icon: CheckCircle, color: 'bg-pure-black text-white border-black', lead: 'Juliana Costa', time: '17:00', result: 'R$ 120.000' },
  { id: '7', type: 'lost', label: 'Lead Perdido', icon: XCircle, color: 'bg-rose-50 text-rose-600 border-rose-100', lead: 'Marcos Paulo', time: '17:30', result: 'Comprou concorrente' },
]

const QUICK_ACTIONS = [
  { label: 'Tentei Contato', icon: PhoneCall, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Retorno Agendado', icon: Clock, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  { label: 'Agendamento', icon: Calendar, tone: 'text-blue-600 bg-blue-50 border-blue-100' },
  { label: 'Visita Feita', icon: UserCheck, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Proposta', icon: FileText, tone: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { label: 'Perdido', icon: XCircle, tone: 'text-rose-600 bg-rose-50 border-rose-100' },
]

export default function Activities() {
  const { leads, refetch: refetchAll } = useAppStore()
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES)
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '')
  const [isRefetching, setIsRefetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const undoRef = useRef<(() => void) | null>(null)

  // Atalho Global Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (undoRef.current) {
          e.preventDefault()
          undoRef.current()
          undoRef.current = null
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 3. UI Failure: Dynamic progress width
  const executionRate = useMemo(() => {
    const total = 30
    const current = activities.length
    return Math.round((current / total) * 100)
  }, [activities])

  const handleRefresh = async () => {
    setIsRefetching(true)
    await refetchAll?.()
    setIsRefetching(false)
    toast.success('Linha do tempo operacional atualizada!')
  }

  // 2. & 12. Logic & Mutation logic
  const addActivity = (actionLabel: string) => {
    const lead = leads.find(l => l.id === selectedLeadId)
    if (!lead) { toast.error('Selecione um alvo válido.'); return }

    const newAct = {
      id: crypto.randomUUID(),
      type: 'manual',
      label: actionLabel,
      icon: QUICK_ACTIONS.find(a => a.label === actionLabel)?.icon || FileText,
      color: QUICK_ACTIONS.find(a => a.label === actionLabel)?.tone || 'bg-gray-50',
      lead: lead.name,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      result: 'Registro manual via cockpit'
    }
    setActivities(prev => [newAct, ...prev])
    toast.success(`Atividade registrada para ${lead.name}`)
  }

  const deleteActivity = (id: string) => {
    const actToDelete = activities.find(a => a.id === id);
    if (!actToDelete) return;

    let wasCanceled = false;

    const cancelAction = () => {
      wasCanceled = true;
      undoRef.current = null;
      toast.success(`Registro "${actToDelete.label}" preservado!`, {
        icon: <RefreshCw size={14} className="animate-spin text-indigo-600" />
      });
    };

    undoRef.current = cancelAction;

    toast.warning(`Removendo: ${actToDelete.label}`, {
      description: "Pressione Ctrl+Z para desfazer agora.",
      action: {
        label: "DESFAZER",
        onClick: cancelAction
      },
      onAutoClose: () => {
        if (!wasCanceled) {
          setActivities(prev => prev.filter(a => a.id !== id));
          if (undoRef.current === cancelAction) undoRef.current = null;
        }
      },
      duration: 5000,
    });
  }

  const filteredActivities = useMemo(() => {
    return activities.filter(a => 
      a.lead.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [activities, searchTerm])

  return (
    <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none">Cadência <span className="text-indigo-600">Operacional</span></h1>
          </div>
          <div className="flex items-center gap-3 pl-6 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Timeline de Atividades Real-time</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <button 
            onClick={handleRefresh}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
          >
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </button>
          {/* 4. UX Gap: Date selector simulation */}
          <button className="flex items-center justify-center gap-3 px-8 py-4 rounded-full border border-gray-100 bg-white text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm hover:text-pure-black transition-all">
            <Calendar size={18} className="text-indigo-600" /> Hoje, {format(new Date(), 'dd MMM', { locale: ptBR })}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
        {[
          { label: 'Ações Hoje', value: activities.length, icon: PhoneCall, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Agendamentos', value: '06', icon: Calendar, tone: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Propostas', value: '04', icon: FileText, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Pendências', value: '03', icon: AlertTriangle, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-[2.2rem] p-6 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity", item.tone.split(' ')[1])} />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white shadow-sm", item.tone)}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{item.label}</p>
            </div>
            <h3 className="text-3xl font-black text-pure-black tracking-tighter font-mono-numbers relative z-10">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 pb-32">
        
        {/* Left Column (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col group">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div>
                <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Registro Rápido</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Input em um toque</p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2 leading-none">Lead Alvo</label>
                {/* 14. Dynamic lead selector */}
                <select
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl h-14 px-6 text-sm font-bold text-pure-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer shadow-inner"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                >
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  {leads.length === 0 && <option value="">Nenhum lead disponível</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <button 
                    key={action.label} 
                    onClick={() => addActivity(action.label)}
                    // 15. Acessibilidade fix
                    aria-label={`Registrar ${action.label}`}
                    className="group rounded-2xl border border-gray-50 bg-gray-50/50 p-5 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 text-left relative overflow-hidden"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all shadow-sm border border-white", action.tone)}>
                      <action.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-pure-black uppercase tracking-widest leading-tight block">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm relative group overflow-hidden">
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <AlertTriangle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Disciplina</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Taxa de Execução</p>
              </div>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Ações do Ciclo</span>
                  <span className="text-sm font-black text-indigo-600 font-mono-numbers leading-none">{activities.length} / 30</span>
                </div>
                <div className="w-full bg-gray-50 border border-gray-100 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                  {/* 3. Dynamic progress fixed */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${executionRate}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="bg-indigo-600 h-full rounded-full shadow-lg shadow-indigo-200" 
                  />
                </div>
              </div>
              
              <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-xs font-bold text-amber-900/70 leading-relaxed">
                  Atenção: A cadência D+3 sugere contato imediato com <span className="text-amber-900 font-black">3 leads estagnados</span> para evitar perda de propensão.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Area (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group relative">
            <div className="absolute top-0 right-0 p-10 text-gray-50 -rotate-12 pointer-events-none group-hover:text-indigo-50/50 transition-colors">
              <Clock size={160} strokeWidth={2.5} />
            </div>

            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl">
                  <Clock size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1">Timeline do Dia</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sequência Operacional Validada</p>
                </div>
              </div>
              <div className="relative group w-full max-w-[240px] hidden sm:block">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar eventos..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-full pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-200 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 sm:p-12 relative z-10">
              <div className="relative">
                {/* 13. & 19. Timeline line fix */}
                <div className="absolute left-7 top-0 bottom-0 w-px bg-gray-100 z-0" />
                
                <div className="space-y-12">
                  <AnimatePresence mode="popLayout">
                    {filteredActivities.map((activity, idx) => (
                      <motion.div
                        key={activity.id} // 9. Fixed key
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="relative z-10 flex gap-8 group/item"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center border-4 border-white shadow-lg transition-transform group-hover/item:scale-110 group-hover/item:rotate-3",
                          activity.color
                        )}>
                          <activity.icon size={22} strokeWidth={2.5} />
                        </div>
                        
                        <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl transition-all relative">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              {/* 17. Accents fixed */}
                              <h4 className="font-black text-sm text-pure-black uppercase tracking-tight leading-none mb-1.5">{activity.label}</h4>
                              <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <MapPin size={10} className="text-rose-500" /> Showroom Alpha
                              </div>
                            </div>
                            <span className="font-black text-xs text-pure-black font-mono-numbers bg-white border border-gray-100 px-3 py-1 rounded-lg shadow-sm">{activity.time}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                            <p className="text-sm font-bold text-gray-500 leading-relaxed">
                              <span className="text-pure-black font-black">{activity.lead}</span> • {/* 7. Contrast fixed */} <span className="text-gray-400 italic">"{activity.result}"</span>
                            </p>
                            <button onClick={() => deleteActivity(activity.id)} className="opacity-0 group-hover/item:opacity-100 text-gray-300 hover:text-rose-500 transition-all p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
