import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, X, Search, RefreshCw, 
  MoreVertical, Trash2, ChevronRight, MessageSquare, Megaphone, 
  Zap, Filter, CheckCheck, TrendingUp, History, Smartphone, ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
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
    return (notifications || []).filter(n => {
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

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true); await fetchNotifications(); setIsRefetching(false)
    toast.success('Central sincronizada!')
  }, [fetchNotifications])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discipline': return <AlertTriangle size={20} className="text-status-error" />
      case 'performance': return <TrendingUp size={20} className="text-status-success" />
      case 'alert': return <Clock size={20} className="text-status-warning" />
      default: return <Bell size={20} className="text-brand-primary" />
    }
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Central de <Typography as="span" className="text-brand-primary">Alertas</Typography></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">MOTOR DE DISCIPLINA & INTELIGÊNCIA MX</Typography>
        </div>

        <div className="flex items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
          <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={() => {markAllAsRead(); toast.success('Tudo lido!')}} className="h-mx-xl px-6 flex-1 lg:flex-none rounded-mx-full shadow-mx-sm uppercase font-black text-xs bg-white tracking-widest">
            <CheckCheck size={18} className="mr-2" /> MARCAR TUDO
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        <section className="lg:col-span-8 flex flex-col order-2 lg:order-1">
          <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group relative">
            <div className="absolute top-mx-0 right-mx-0 p-mx-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors hidden md:block">
              <Bell size={240} strokeWidth={2} />
            </div>

            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg md:p-10 flex flex-col sm:flex-row items-center justify-between relative z-10 gap-mx-md">
              <div className="flex items-center gap-mx-md">
                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl shrink-0"><Bell size={32} strokeWidth={2} /></div>
                <div>
                  <Typography variant="h2" className="text-xl sm:text-2xl uppercase tracking-tighter leading-none">Meu Inbox</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SINALIZAÇÕES DE AUDITORIA</Typography>
                </div>
              </div>
              <Badge variant="brand" className="px-6 py-2 rounded-mx-full font-black shadow-mx-sm uppercase text-xs w-full sm:w-auto text-center">{unreadCount} NOVAS</Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-mx-lg md:p-14 relative z-10">
              <AnimatePresence mode="popLayout">
                {Object.entries(grouped).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                        <ShieldCheck size={64} className="text-text-tertiary mb-8" />
                        <Typography variant="h2" className="uppercase tracking-tighter">Inbox Limpo</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-xs mt-4 uppercase font-black tracking-widest">Nenhuma sinalização pendente na malha operacional.</Typography>
                    </div>
                ) : (Object.entries(grouped) as Array<[string, typeof filtered]>).map(([group, list]) => (
                  <div key={group} className="space-y-mx-md mb-14 last:mb-0">
                    <div className="flex items-center gap-mx-md px-4">
                      <Typography variant="caption" tone="muted" className="font-black tracking-widest uppercase whitespace-nowrap">{group}</Typography>
                      <div className="h-px flex-1 bg-border-default opacity-50" />
                    </div>
                    {list.map((n, i) => (
                      <motion.article 
                        key={n.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                        onClick={() => { markRead(n.id); if (n.link) navigate(n.link) }}
                        className={cn(
                          "p-mx-lg rounded-mx-3xl border transition-all relative group/item flex flex-col sm:flex-row gap-mx-lg cursor-pointer", 
                          n.read ? "bg-surface-alt/30 border-border-default opacity-60" : "bg-white border-brand-primary/20 shadow-mx-lg",
                          !n.read && n.priority === 'high' && "border-status-error/20 bg-status-error-surface/30"
                        )}
                      >
                        <div className={cn(
                          "w-mx-2xl h-mx-2xl rounded-mx-2xl shrink-0 flex items-center justify-center shadow-inner transition-transform group-hover/item:scale-110", 
                          n.read ? "bg-surface-alt text-text-tertiary" : "bg-white border border-border-default"
                        )}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <header className="flex justify-between items-start mb-2 gap-mx-sm">
                            <div className="flex items-center gap-mx-sm min-w-0">
                              <Typography variant="h3" className="text-base group-hover/item:text-brand-primary transition-colors truncate uppercase font-black tracking-tight">{n.title}</Typography>
                              {!n.read && n.priority === 'high' && <Badge variant="danger" className="text-mx-nano sm:text-xs font-black h-mx-5 px-3 rounded-mx-full animate-pulse shadow-sm shrink-0">CRÍTICO</Badge>}
                            </div>
                            <Typography variant="mono" tone="muted" className="text-mx-tiny sm:text-xs font-black uppercase tracking-widest shrink-0">{format(new Date(n.created_at), 'HH:mm')}</Typography>
                          </header>
                          <Typography variant="p" tone="muted" className="text-sm font-bold leading-relaxed italic line-clamp-2 uppercase tracking-tight opacity-60">"{n.message}"</Typography>
                          <footer className="flex flex-wrap items-center gap-mx-md mt-6">
                            {n.link && <Typography variant="caption" tone="brand" className="text-xs font-black uppercase tracking-widest flex items-center gap-mx-xs group-hover/item:translate-x-1 transition-transform">Ação Imediata <ChevronRight size={12} strokeWidth={3} /></Typography>}
                            <Button 
                              variant="ghost" size="sm" 
                              onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); toast.success('Alerta removido!') }} 
                              className="text-xs font-black text-text-tertiary hover:text-status-error uppercase tracking-widest p-mx-0 h-auto hover:bg-transparent"
                            >
                              Remover
                            </Button>
                          </footer>
                        </div>
                        {!n.read && <div className="absolute right-mx-lg top-mx-sm sm:top-1/2 sm:-translate-y-1/2 w-2.5 h-2.5 rounded-mx-full bg-brand-primary shadow-mx-md animate-pulse" />}
                      </motion.article>
                    ))}
                  </div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-mx-lg order-1 lg:order-2">
          <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white space-y-mx-10">
            <header className="border-b border-border-default pb-8">
                <Typography variant="h3" className="uppercase tracking-tight">Filtro Disciplinar</Typography>
                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SEGMENTAÇÃO DE ALERTAS</Typography>
            </header>
            
            <div className="relative group">
                <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                <Input 
                    placeholder="LOCALIZAR ALERTA..." value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="!pl-11 !h-12 uppercase tracking-widest text-xs"
                />
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-mx-xs" role="navigation" aria-label="Filtros de notificação">
              {[
                { label: 'Check-ins', type: 'discipline', icon: Smartphone, tone: 'error' },
                { label: 'Feedbacks', type: 'performance', icon: TrendingUp, tone: 'success' },
                { label: 'PDI', type: 'alert', icon: History, tone: 'warning' },
                { label: 'Geral', type: 'system', icon: Megaphone, tone: 'brand' }
              ].map(f => (
                <button 
                  key={f.label} 
                  onClick={() => setFilterType(filterType === f.type ? null : f.type)}
                  className={cn(
                    "w-full p-mx-md rounded-mx-2xl border transition-all text-left flex items-center justify-between group/f",
                    filterType === f.type ? "bg-brand-primary border-brand-primary text-white shadow-mx-lg" : "bg-surface-alt border-border-default hover:bg-white hover:border-brand-primary/20 shadow-inner"
                  )}
                >
                  <div className="flex items-center gap-mx-sm">
                    <f.icon size={16} className={cn(filterType === f.type ? "text-white" : "text-text-tertiary opacity-40")} />
                    <Typography variant="caption" className={cn("font-black uppercase tracking-widest", filterType === f.type ? "text-white" : "text-text-primary")}>{f.label}</Typography>
                  </div>
                  <ChevronRight size={14} className={cn(filterType === f.type ? "text-white/40" : "text-text-tertiary opacity-20 group-hover/f:text-brand-primary")} />
                </button>
              ))}
            </nav>

            <footer className="pt-8 border-t border-border-default">
                <Button variant="outline" className="w-full h-mx-14 rounded-mx-full shadow-sm font-black uppercase tracking-widest text-xs bg-white border-border-strong hover:border-brand-primary">
                    AJUSTES DE ALERTA
                </Button>
            </footer>
          </Card>
        </aside>
      </div>
    </main>
  )
}
