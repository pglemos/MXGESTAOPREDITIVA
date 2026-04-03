import { useState, useMemo } from 'react'
import { Send, MessageSquare, Megaphone, Users, Search, RefreshCw, X, MoreVertical, Plus, CheckCircle2, Clock, AlertTriangle, ChevronRight, Zap, Sparkles, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

const INITIAL_MESSAGES = [
  { id: '1', author: 'Admin MX', role: 'System', content: 'Nova campanha de blindagem ativa. Verifique o Mix de Produtos.', date: 'Hoje, 09:00', type: 'system', priority: 'High' },
  { id: '2', author: 'Gestão Regional', role: 'Gerente', content: 'Reunião de alinhamento às 14h via Teams.', date: 'Hoje, 10:15', type: 'user', priority: 'Medium' },
  { id: '3', author: 'Elite Club', role: 'Leaderboard', content: 'João Silva atingiu o nível Platinum! Parabéns.', date: 'Ontem, 18:45', type: 'achievement', priority: 'Low' },
]

export default function Communication() {
  const { team, refetch: refetchAll } = useAppStore()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const stats = [
    { label: 'Broadcasts', value: '12', icon: Megaphone, tone: 'bg-brand-primary-surface text-brand-primary' },
    { label: 'Engajamento', value: '94%', icon: Zap, tone: 'bg-status-success-surface text-status-success' },
    { label: 'Não Lidas', value: '03', icon: MessageSquare, tone: 'bg-status-error-surface text-status-error' },
    { label: 'Alcance', value: '48', icon: Users, tone: 'bg-mx-slate-50 text-text-tertiary' },
  ]

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Hub de <span className="text-brand-primary">Comunicação</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Broadcast & Alinhamento Tático</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); setTimeout(() => setIsRefetching(false), 800)}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <div className="relative group w-48 hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input type="text" placeholder="Buscar informe..." className="mx-input !h-9 !pl-9 !text-[10px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="mx-button-primary bg-brand-secondary flex items-center gap-2"><Plus size={18} /> Novo Broadcast</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0">
        {stats.map((item) => (
          <div key={item.label} className="mx-card p-mx-md flex flex-col justify-between group relative overflow-hidden">
            <div className="flex items-center justify-between gap-mx-xs relative z-10">
              <div><p className="mx-text-caption mb-1">{item.label}</p><p className="text-3xl font-black tracking-tighter font-mono-numbers leading-none">{item.value}</p></div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm', item.tone)}><item.icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Megaphone size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Broadcast Ativo</h3><p className="mx-text-caption">Mural de Avisos Prioritários</p></div>
              </div>
              <Badge className="bg-status-success-surface text-status-success border-none">SISTEMA ONLINE</Badge>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-lg relative">
              <div className="absolute left-[calc(2.5rem+24px)] top-mx-lg bottom-0 w-px bg-mx-slate-100" />
              <div className="space-y-mx-lg">
                {messages.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="relative z-10 flex gap-mx-lg group/msg">
                    <div className={cn("w-12 h-12 rounded-full shrink-0 flex items-center justify-center border-4 border-white shadow-mx-md transition-all group-hover/msg:scale-110", m.type === 'system' ? "bg-brand-secondary text-white" : m.type === 'achievement' ? "bg-status-warning-surface text-status-warning border-mx-amber-100" : "bg-mx-slate-50 text-text-primary border-border-default")}>
                      {m.type === 'system' ? <Megaphone size={20} /> : m.type === 'achievement' ? <Sparkles size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div className="flex-1 bg-mx-slate-50/50 border border-border-subtle rounded-mx-xl p-mx-md hover:bg-white hover:shadow-mx-lg transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-sm text-text-primary uppercase tracking-tight">{m.author}</h4>
                            <Badge variant="outline" className="text-[8px] font-black uppercase h-5 rounded-md px-2 opacity-60">{m.role}</Badge>
                          </div>
                          <span className="font-black text-[10px] text-text-tertiary font-mono-numbers">{m.date}</span>
                        </div>
                        <Badge className={cn("text-[8px] border-none px-2", m.priority === 'High' ? "bg-status-error-surface text-status-error" : "bg-mx-slate-100 text-text-tertiary")}>{m.priority}</Badge>
                      </div>
                      <p className="text-sm font-bold text-text-secondary leading-relaxed border-t border-border-subtle pt-3 mt-2">"{m.content}"</p>
                      <div className="flex items-center gap-mx-sm mt-mx-md">
                        <button className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">Confirmar Leitura</button>
                        <div className="w-1 h-1 rounded-full bg-mx-slate-200" />
                        <button className="text-[9px] font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary">Responder</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <div className="mx-card flex flex-col overflow-hidden group h-full">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <h3 className="text-xl font-black text-text-primary tracking-tight leading-none uppercase">Canais Diretos</h3>
              <Filter size={16} className="text-text-tertiary" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-sm">
              {['Gerência Geral', 'Marketing & Leads', 'Suporte Técnico', 'RH & Treinamentos'].map((canal, i) => (
                <div key={canal} className="p-mx-md rounded-mx-lg border border-border-subtle bg-white hover:border-brand-primary/30 hover:bg-brand-primary-surface/10 transition-all cursor-pointer group/canal flex items-center justify-between">
                  <div className="flex items-center gap-mx-sm">
                    <div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 flex items-center justify-center text-brand-primary group-hover/canal:bg-brand-secondary group-hover/canal:text-white transition-all shadow-inner"><MessageSquare size={18} /></div>
                    <span className="text-xs font-black text-text-primary uppercase tracking-tight">{canal}</span>
                  </div>
                  <ChevronRight size={16} className="text-mx-slate-200 group-hover/canal:text-brand-primary group-hover/canal:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
            <div className="p-mx-lg border-t border-border-subtle bg-mx-slate-50/30"><button className="mx-button-primary bg-brand-primary w-full shadow-mx-lg">Iniciar Nova Mensagem</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
