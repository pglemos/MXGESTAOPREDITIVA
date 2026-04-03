import { useState, useMemo } from 'react'
import { Bell, CheckCircle2, Clock, AlertTriangle, X, Search, RefreshCw, MoreVertical, Trash2, ChevronRight, MessageSquare, Megaphone, Zap, Filter, CheckCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/useData'

export default function Notificacoes() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const filtered = useMemo(() => {
    return notifications.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [notifications, searchTerm])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Central de <span className="text-brand-primary">Notificações</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Inbox de Alertas Operacionais</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); setTimeout(() => setIsRefetching(false), 800)}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <button onClick={() => markAllAsRead()} className="mx-button-primary !bg-white !text-brand-primary border border-mx-indigo-100 flex items-center gap-2"><CheckCheck size={18} /> Marcar Tudo</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Bell size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Alertas Recentes</h3><p className="mx-text-caption">Sinalizações do Sistema</p></div>
              </div>
              <Badge className="bg-brand-primary text-white border-none">{unreadCount} NOVAS</Badge>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-sm">
              <AnimatePresence mode="popLayout">
                {filtered.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className={cn("p-mx-md rounded-mx-xl border transition-all relative group flex gap-mx-md", n.read ? "bg-white border-border-subtle opacity-60" : "bg-brand-primary-surface/20 border-brand-primary/20 shadow-mx-sm")}>
                    <div className={cn("w-12 h-12 rounded-mx-lg shrink-0 flex items-center justify-center shadow-inner", n.read ? "bg-mx-slate-50 text-text-tertiary" : "bg-white text-brand-primary")}>
                      {n.type === 'system' ? <Zap size={20} /> : n.type === 'alert' ? <AlertTriangle size={20} /> : <Megaphone size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-sm text-text-primary uppercase tracking-tight truncate">{n.title}</h4>
                        <span className="text-[10px] font-black text-text-tertiary font-mono-numbers">{n.time || 'Agora'}</span>
                      </div>
                      <p className="text-xs font-bold text-text-secondary leading-relaxed line-clamp-2">"{n.message}"</p>
                      <div className="flex items-center gap-mx-sm mt-3">
                        {!n.read && <button onClick={() => markAsRead(n.id)} className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">Marcar Leitura</button>}
                        <button onClick={() => deleteNotification(n.id)} className="text-[9px] font-black text-status-error uppercase tracking-widest hover:underline">Excluir</button>
                      </div>
                    </div>
                    {!n.read && <div className="absolute right-mx-md top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />}
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <div className="py-mx-3xl flex flex-col items-center justify-center text-center opacity-40"><Bell size={40} className="text-mx-slate-200 mb-mx-lg" /><p className="mx-text-caption">Inbox Vazio ✨</p></div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="mx-card p-mx-lg space-y-mx-lg h-full flex flex-col">
            <h3 className="text-xl font-black text-text-primary tracking-tight leading-none uppercase mb-mx-sm">Filtro Tático</h3>
            <div className="relative group"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" /><input type="text" placeholder="Filtrar alertas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mx-input !h-11 !pl-11 !text-[10px]" /></div>
            <div className="space-y-2 flex-1">
              {['Prioridade Máxima', 'Alertas de Lead', 'Metas & Performance', 'Comunicados'].map(f => (
                <button key={f} className="w-full p-mx-md rounded-mx-lg border border-border-subtle bg-mx-slate-50/50 hover:bg-white hover:border-brand-primary/30 transition-all text-left flex items-center justify-between group/f">
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{f}</span>
                  <ChevronRight size={14} className="text-mx-slate-200 group-hover/f:text-brand-primary transition-all" />
                </button>
              ))}
            </div>
            <div className="pt-mx-lg border-t border-border-subtle"><button className="mx-button-primary !bg-mx-slate-100 !text-text-tertiary border-none w-full">Configurações de Push</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
