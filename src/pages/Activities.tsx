import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { 
    AlertTriangle, Calendar, Car, CheckCircle, Clock, FileText, 
    PhoneCall, XCircle, Search, RefreshCw, X, MoreVertical, 
    Trash2, MapPin, UserCheck, Send, Sparkles, Smartphone,
    ChevronRight, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

const INITIAL_ACTIVITIES = [
  { id: '1', type: 'attempt', label: 'Tentativa de Contato', icon: PhoneCall, tone: 'brand', lead: 'Carlos Silva', time: '10:30', result: 'Sem sucesso' },
  { id: '2', type: 'scheduled', label: 'Retorno Agendado', icon: Clock, tone: 'warning', lead: 'Ana Oliveira', time: '11:15', result: 'Para amanhã 14h' },
  { id: '3', type: 'appointment', icon: Calendar, label: 'Agendamento Feito', tone: 'info', lead: 'Roberto Santos', time: '14:00', result: 'Sábado 10h' },
  { id: '4', type: 'visit', icon: UserCheck, label: 'Visita Realizada', tone: 'success', lead: 'Fernanda Lima', time: '15:45', result: 'Test-drive feito' },
  { id: '5', type: 'proposal', icon: FileText, label: 'Proposta Enviada', tone: 'brand', lead: 'Lucas Souza', time: '16:20', result: 'Aguardando aprovação' },
  { id: '6', type: 'won', icon: CheckCircle, label: 'Venda Fechada', tone: 'secondary', lead: 'Juliana Costa', time: '17:00', result: 'R$ 120.000' },
  { id: '7', type: 'lost', icon: XCircle, label: 'Lead Perdido', tone: 'error', lead: 'Marcos Paulo', time: '17:30', result: 'Comprou concorrente' },
]

const QUICK_ACTIONS = [
  { label: 'Tentei Contato', icon: PhoneCall, tone: 'brand' },
  { label: 'Retorno Agendado', icon: Clock, tone: 'warning' },
  { label: 'Agendamento', icon: Calendar, tone: 'info' },
  { label: 'Visita Feita', icon: UserCheck, tone: 'success' },
  { label: 'Proposta', icon: FileText, tone: 'brand' },
  { label: 'Perdido', icon: XCircle, tone: 'error' },
]

export default function Activities() {
  const { leads, refetch: refetchAll } = useAppStore()
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES)
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '')
  const [isRefetching, setIsRefetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const undoRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (undoRef.current) {
          e.preventDefault(); undoRef.current(); undoRef.current = null
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const executionRate = useMemo(() => {
    const total = 30; const current = activities.length
    return Math.round((current / total) * 100)
  }, [activities])

  const handleRefresh = async () => {
    setIsRefetching(true); await refetchAll?.(); setIsRefetching(false)
    toast.success('Linha do tempo operacional atualizada!')
  }

  const addActivity = (actionLabel: string) => {
    const lead = leads.find(l => l.id === selectedLeadId)
    if (!lead) { toast.error('Selecione um alvo válido.'); return }

    const config = QUICK_ACTIONS.find(a => a.label === actionLabel)
    const newAct = {
      id: crypto.randomUUID(),
      type: 'manual',
      label: actionLabel,
      icon: config?.icon || FileText,
      tone: config?.tone || 'brand',
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
      wasCanceled = true; undoRef.current = null;
      toast.success(`Registro "${actToDelete.label}" preservado!`)
    };

    undoRef.current = cancelAction;
    toast.warning(`Removendo: ${actToDelete.label}`, {
      description: "Pressione Ctrl+Z para desfazer agora.",
      action: { label: "DESFAZER", onClick: cancelAction },
      onAutoClose: () => {
        if (!wasCanceled) {
          setActivities(prev => prev.filter(a => a.id !== id))
          if (undoRef.current === cancelAction) undoRef.current = null
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
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Cadência Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Cadência <span className="text-brand-primary">Operacional</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">Timeline de Atividades Real-time • MX PERFORMANCE</Typography>
        </div>

        <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <div className="flex items-center gap-4 bg-white border border-border-default px-8 h-12 rounded-full shadow-mx-sm">
            <Calendar size={18} className="text-brand-primary" />
            <Typography variant="caption" className="whitespace-nowrap font-black uppercase tracking-widest">Hoje, {format(new Date(), 'dd MMM', { locale: ptBR })}</Typography>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {[
          { label: 'Ações Hoje', value: activities.length, icon: PhoneCall, tone: 'brand' },
          { label: 'Agendamentos', value: '06', icon: Calendar, tone: 'info' },
          { label: 'Propostas', value: '04', icon: FileText, tone: 'warning' },
          { label: 'Pendências', value: '03', icon: AlertTriangle, tone: 'error' },
        ].map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-14 w-14 rounded-mx-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'info' ? 'bg-status-info-surface border-mx-blue-100 text-status-info' :
                item.tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                'bg-status-error-surface border-mx-rose-100 text-status-error'
              )}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        
        {/* Registration Section */}
        <section className="lg:col-span-4 flex flex-col gap-mx-lg">
          <Card className="p-10 border-none shadow-mx-lg bg-white space-y-10">
            <header className="border-b border-border-default pb-8">
              <Typography variant="h3">Registro Rápido</Typography>
              <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">INPUT EM UM TOQUE</Typography>
            </header>

            <div className="space-y-10">
              <div className="space-y-4">
                <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Lead Alvo</Typography>
                <div className="relative group">
                  <select
                    className="w-full h-14 bg-surface-alt border border-border-default rounded-mx-xl px-6 text-sm font-bold text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-inner"
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                  >
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {leads.length === 0 && <option value="">Nenhum lead disponível</option>}
                  </select>
                  <Smartphone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <button 
                    key={action.label} 
                    onClick={() => addActivity(action.label)}
                    aria-label={`Registrar ${action.label}`}
                    className="group rounded-mx-2xl border border-border-default bg-surface-alt/50 p-6 transition-all hover:bg-white hover:border-brand-primary/30 hover:shadow-mx-lg hover:-translate-y-1 text-left relative overflow-hidden"
                  >
                    <div className={cn(
                        "w-12 h-12 rounded-mx-xl flex items-center justify-center mb-4 transition-all shadow-mx-sm border border-white group-hover:scale-110",
                        action.tone === 'brand' ? 'bg-mx-indigo-50 text-brand-primary' :
                        action.tone === 'warning' ? 'bg-status-warning-surface text-status-warning' :
                        action.tone === 'info' ? 'bg-status-info-surface text-status-info' :
                        action.tone === 'success' ? 'bg-status-success-surface text-status-success' :
                        'bg-status-error-surface text-status-error'
                    )}>
                      <action.icon size={20} strokeWidth={2.5} />
                    </div>
                    <Typography variant="caption" className="font-black leading-tight block">{action.label}</Typography>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Discipline Card */}
          <Card className="p-10 border-none shadow-mx-lg bg-white space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-status-warning-surface rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <header className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-mx-xl bg-status-warning-surface text-status-warning flex items-center justify-center border border-mx-amber-100 shadow-inner group-hover:scale-110 transition-transform">
                <AlertTriangle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <Typography variant="h3">Disciplina</Typography>
                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">TAXA DE EXECUÇÃO</Typography>
              </div>
            </header>
            
            <div className="space-y-10 relative z-10">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Ações do Ciclo</Typography>
                  <Typography variant="mono" tone="brand" className="text-sm font-black">{activities.length} / 30</Typography>
                </div>
                <div className="w-full bg-surface-alt border border-border-default rounded-mx-full h-3 overflow-hidden p-0.5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${executionRate}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="bg-brand-primary h-full rounded-full shadow-mx-sm" 
                  />
                </div>
              </div>
              
              <Card className="p-6 bg-status-warning-surface border border-mx-amber-100 shadow-inner">
                <div className="flex gap-4">
                    <AlertTriangle className="h-5 w-5 text-status-warning shrink-0" strokeWidth={2.5} />
                    <Typography variant="p" className="text-xs font-black text-status-warning leading-relaxed uppercase tracking-tight">
                        A cadência sugere contato com <span className="text-mx-amber-900 underline decoration-2">3 leads estagnados</span> para evitar perda de propensão.
                    </Typography>
                </div>
              </Card>
            </div>
          </Card>
        </section>

        {/* Timeline Area */}
        <section className="lg:col-span-8 flex flex-col">
          <Card className="bg-white border-none shadow-mx-xl overflow-hidden h-full flex flex-col group relative">
            <div className="absolute top-0 right-0 p-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors">
              <Clock size={240} strokeWidth={2.5} />
            </div>

            <header className="p-10 md:p-14 border-b border-border-default bg-surface-alt/30 flex flex-col sm:flex-row sm:items-center justify-between gap-8 shrink-0 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl group-hover:scale-110 transition-transform">
                  <Clock size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <Typography variant="h2">Timeline do Dia</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">SEQUÊNCIA OPERACIONAL VALIDADA</Typography>
                </div>
              </div>
              <div className="relative group w-full sm:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                <Input 
                  placeholder="FILTRAR EVENTOS..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                />
              </div>
            </header>

            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-10 md:p-14 relative z-10">
              <div className="relative">
                <div className="absolute left-7 top-0 bottom-0 w-px bg-border-default/50 z-0" />
                
                <div className="space-y-14">
                  <AnimatePresence mode="popLayout">
                    {filteredActivities.map((activity, idx) => (
                      <motion.div
                        key={activity.id}
                        layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03 }}
                        className="relative z-10 flex gap-10 group/item"
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-mx-xl shrink-0 flex items-center justify-center border-4 border-white shadow-mx-lg transition-transform group-hover/item:scale-110 group-hover/item:rotate-3",
                          activity.tone === 'brand' ? 'bg-brand-primary text-white' :
                          activity.tone === 'warning' ? 'bg-status-warning text-white' :
                          activity.tone === 'info' ? 'bg-status-info text-white' :
                          activity.tone === 'success' ? 'bg-status-success text-white' :
                          activity.tone === 'secondary' ? 'bg-brand-secondary text-white' :
                          'bg-status-error text-white'
                        )}>
                          <activity.icon size={22} strokeWidth={2.5} />
                        </div>
                        
                        <div className="flex-1 bg-surface-alt/50 border border-border-default rounded-mx-3xl p-8 hover:bg-white hover:shadow-mx-xl transition-all relative">
                          <header className="flex justify-between items-start mb-6">
                            <div>
                              <Typography variant="h3" className="text-base uppercase tracking-tight mb-2">{activity.label}</Typography>
                              <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-status-error" />
                                <Typography variant="caption" tone="muted" className="text-[9px] font-black uppercase tracking-widest">Showroom Alpha</Typography>
                              </div>
                            </div>
                            <Badge variant="outline" className="font-mono-numbers px-4 py-1.5 rounded-lg bg-white shadow-mx-sm border-border-default">{activity.time}</Badge>
                          </header>
                          
                          <footer className="flex items-center justify-between gap-6 border-t border-border-default pt-6">
                            <Typography variant="p" className="text-sm font-bold text-text-secondary leading-relaxed uppercase tracking-tight">
                              <span className="text-text-primary font-black mr-2">{activity.lead}</span>
                              <span className="opacity-40 italic">"{activity.result}"</span>
                            </Typography>
                            <Button variant="ghost" size="sm" onClick={() => deleteActivity(activity.id)} className="opacity-0 group-hover/item:opacity-100 text-text-tertiary hover:text-status-error transition-all p-2 h-10 w-10 rounded-full">
                              <Trash2 size={18} />
                            </Button>
                          </footer>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
