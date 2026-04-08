import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, X, Search, RefreshCw, 
  MoreVertical, Trash2, ChevronRight, MessageSquare, Megaphone, 
  Zap, Filter, CheckCheck, TrendingUp 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/useData'
import { format } from 'date-fns'

export default function Notificacoes() {
  const { notifications, markRead, markAllAsRead, deleteNotification, unreadCount, fetchNotifications } = useNotifications()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType ? n.type === filterType : true
      return matchesSearch && matchesType
    })
  }, [notifications, searchTerm, filterType])

  const grouped = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().split('T')[0]

    return filtered.reduce((acc, n) => {
      const date = n.created_at.split('T')[0]
      let group = 'Anteriores'
      if (date === today) group = 'Hoje'
      else if (date === yesterday) group = 'Ontem'
      
      if (!acc[group]) acc[group] = []
      acc[group].push(n)
      return acc
    }, {} as Record<string, typeof filtered>)
  }, [filtered])

  const handleRefresh = async () => {
    setIsRefetching(true)
    await fetchNotifications()
    setIsRefetching(false)
    toast.success('Central de Alertas sincronizada!')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discipline': return <AlertTriangle size={20} className="text-rose-600" />
      case 'performance': return <TrendingUp size={20} className="text-emerald-600" />
      case 'alert': return <Clock size={20} className="text-amber-600" />
      default: return <Bell size={20} className="text-indigo-600" />
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Central de <span className="text-indigo-600">Notificações</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-[0.3em] font-black text-[9px]">Motor de Disciplina & Alertas MX</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={handleRefresh} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all active:scale-90"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <button onClick={() => markAllAsRead()} className="mx-button-primary !bg-white !text-indigo-600 border border-indigo-100 flex items-center gap-2 h-12 px-6 rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest"><CheckCheck size={18} /> Marcar Tudo</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-8 flex flex-col gap-mx-lg h-full">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] h-full flex flex-col overflow-hidden shadow-sm group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg"><Bell size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Alertas Recentes</h3><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sinalizações de Auditoria</p></div>
              </div>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] px-4 py-2 rounded-full">{unreadCount} NOVAS</Badge>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-10">
              <AnimatePresence mode="popLayout">
                {Object.entries(grouped).map(([group, list]) => (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{group}</span>
                      <div className="h-px flex-1 bg-gray-50" />
                    </div>
                    {list.map((n, i) => (
                      <motion.div 
                        key={n.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className={cn(
                          "p-6 rounded-[2rem] border transition-all relative group flex gap-6 cursor-pointer", 
                          n.read ? "bg-white border-gray-100 opacity-60" : "bg-white border-indigo-100 shadow-xl shadow-indigo-500/5",
                          !n.read && n.priority === 'high' && "border-rose-200 bg-rose-50/30"
                        )}
                        onClick={() => {
                          markRead(n.id)
                          if (n.link) navigate(n.link)
                        }}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", 
                          n.read ? "bg-gray-50 text-gray-300" : "bg-white border border-gray-50"
                        )}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-base text-slate-950 uppercase tracking-tight truncate">{n.title}</h4>
                              {!n.read && n.priority === 'high' && <Badge className="bg-rose-600 text-white text-[7px] font-black border-none px-2 h-4 rounded-full">CRÍTICO</Badge>}
                            </div>
                            <span className="text-[9px] font-black text-slate-400 font-mono-numbers uppercase tracking-widest">{format(new Date(n.created_at), 'HH:mm')}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-500 leading-relaxed italic line-clamp-2">"{n.message}"</p>
                          <div className="flex items-center gap-4 mt-4">
                            {n.link && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-1">Ação Imediata <ChevronRight size={10} /></span>}
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }} 
                              className="text-[9px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                        {!n.read && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && <div className="py-mx-3xl flex flex-col items-center justify-center text-center opacity-40"><Bell size={40} className="text-slate-200 mb-mx-lg" /><p className="mx-text-caption uppercase font-black text-slate-300 tracking-[0.4em]">Inbox Limpo ✨</p></div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-mx-lg h-fit flex flex-col shadow-sm">
            <h3 className="text-xl font-black text-slate-950 tracking-tight leading-none uppercase mb-mx-sm">Filtro Disciplinar</h3>
            <div className="relative group"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Filtrar alertas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 h-12 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:bg-white focus:border-indigo-200 transition-all" /></div>
            <div className="space-y-3 flex-1 mt-6">
              {[
                { label: 'Atrasos de Check-in', type: 'discipline' },
                { label: 'Feedbacks Pendentes', type: 'performance' },
                { label: 'Revisões de PDI', type: 'alert' },
                { label: 'Comunicados MX', type: 'system' }
              ].map(f => (
                <button 
                  key={f.label} 
                  onClick={() => setFilterType(filterType === f.type ? null : f.type)}
                  className={cn(
                    "w-full p-5 rounded-2xl border transition-all text-left flex items-center justify-between group/f",
                    filterType === f.type ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-gray-50 border-gray-100 hover:bg-white hover:border-indigo-200"
                  )}
                >
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", filterType === f.type ? "text-white" : "text-slate-900")}>{f.label}</span>
                  <ChevronRight size={14} className={cn(filterType === f.type ? "text-indigo-200" : "text-gray-300 group-hover/f:text-indigo-600")} />
                </button>
              ))}
            </div>
            {filterType && (
              <button onClick={() => setFilterType(null)} className="text-[8px] font-black uppercase text-indigo-600 text-center tracking-widest mt-4 hover:underline">Limpar Filtros</button>
            )}
            <div className="pt-8 border-t border-gray-100 mt-6"><button className="w-full h-14 rounded-full bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:bg-slate-950 hover:text-white transition-all shadow-inner">Ajustes de Alerta</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}
