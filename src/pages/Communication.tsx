import { useState, useMemo } from 'react'
import { 
    Send, MessageSquare, Megaphone, Users, Search, RefreshCw, 
    X, MoreVertical, Plus, CheckCircle2, Clock, AlertTriangle, 
    ChevronRight, Zap, Sparkles, Filter, LayoutDashboard,
    Smartphone, History, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

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
    { label: 'Avisos da Rede', value: '12', icon: Megaphone, tone: 'brand' },
    { label: 'Engajamento', value: '94%', icon: Zap, tone: 'success' },
    { label: 'Não Lidas', value: '03', icon: MessageSquare, tone: 'error' },
    { label: 'Alcance', value: '48', icon: Users, tone: 'info' },
  ]

  const filteredMessages = useMemo(() => {
    return messages.filter(m => 
        m.author.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [messages, searchTerm])

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Hub Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Hub de <span className="text-brand-primary">Comunicação</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">INFORMATIVOS & ALINHAMENTO TÁTICO</Typography>
        </div>

        <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); setTimeout(() => {setIsRefetching(false); toast.success('Sincronizado!')}, 800)}} className="w-12 h-12 rounded-xl shadow-mx-sm bg-white">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <div className="relative group w-full sm:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
                placeholder="BUSCAR INFORME..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 !h-12 uppercase tracking-widest"
            />
          </div>
          <Button className="h-12 px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest">
            <Plus size={18} className="mr-2" /> NOVO AVISO
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12 opacity-50" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest font-black">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums leading-none">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-12 w-12 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'error' ? 'bg-status-error-surface border-mx-rose-100 text-status-error' :
                'bg-status-info-surface border-mx-blue-100 text-status-info'
              )}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        {/* Messages Feed */}
        <section className="lg:col-span-8 flex flex-col">
          <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group relative">
            <div className="absolute top-0 right-0 p-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors">
              <Megaphone size={240} strokeWidth={2.5} />
            </div>

            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-row items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl"><Megaphone size={32} /></div>
                <div>
                  <Typography variant="h2" className="text-2xl uppercase tracking-tighter">Mural de Avisos</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SINALIZAÇÕES DE REDE</Typography>
                </div>
              </div>
              <Badge variant="success" className="px-6 py-2 rounded-full font-black shadow-mx-sm uppercase">Rede Ativa</Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-10 md:p-14 relative z-10">
              <div className="relative">
                <div className="absolute left-7 top-0 bottom-0 w-px bg-border-default/50 z-0" />
                <div className="space-y-14">
                  <AnimatePresence mode="popLayout">
                    {filteredMessages.map((m, i) => (
                      <motion.div key={m.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="relative z-10 flex gap-10 group/msg">
                        <div className={cn("w-14 h-14 rounded-full shrink-0 flex items-center justify-center border-4 border-white shadow-mx-lg transition-transform group-hover/msg:scale-110 group-hover/msg:rotate-3", 
                            m.type === 'system' ? "bg-brand-secondary text-white" : m.type === 'achievement' ? "bg-status-warning text-white" : "bg-surface-alt text-text-primary"
                        )}>
                          {m.type === 'system' ? <Megaphone size={22} strokeWidth={2.5} /> : m.type === 'achievement' ? <Sparkles size={22} strokeWidth={2.5} /> : <MessageSquare size={22} strokeWidth={2.5} />}
                        </div>
                        <div className="flex-1 bg-surface-alt/50 border border-border-default rounded-mx-3xl p-8 hover:bg-white hover:shadow-mx-xl transition-all relative">
                          <header className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <Typography variant="h3" className="text-lg leading-none uppercase tracking-tight font-black">{m.author}</Typography>
                                <Badge variant="outline" className="rounded-md border-border-strong opacity-60 uppercase font-black">{m.role}</Badge>
                              </div>
                              <Typography variant="mono" tone="muted" className="opacity-40 uppercase font-black tracking-widest">{m.date}</Typography>
                            </div>
                            <Badge variant={m.priority === 'High' ? 'danger' : 'outline'} className="px-4 py-1 rounded-lg uppercase font-black shadow-sm">{m.priority}</Badge>
                          </header>
                          <Typography variant="p" tone="muted" className="text-base font-bold leading-relaxed border-t border-border-default pt-6 mt-2 italic uppercase tracking-tight opacity-60">
                            "{m.content}"
                          </Typography>
                          <footer className="flex items-center gap-6 mt-8">
                            <Button variant="ghost" size="sm" className="px-4 font-black text-brand-primary uppercase tracking-widest hover:underline hover:bg-transparent">Confirmar Leitura</Button>
                            <div className="w-1.5 h-1.5 rounded-full bg-border-strong opacity-20" />
                            <Button variant="ghost" size="sm" className="px-4 font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary hover:bg-transparent">Responder</Button>
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

        {/* Sidebar Channels */}
        <aside className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <Card className="flex flex-col overflow-hidden group h-full border-none shadow-mx-lg bg-white">
            <CardHeader className="p-8 border-b border-border-default bg-surface-alt/30 flex items-center justify-between">
              <Typography variant="h3" className="uppercase tracking-tight">Canais Diretos</Typography>
              <Filter size={18} className="text-text-tertiary" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-4">
              {['Gerência Geral', 'Marketing & Leads', 'Suporte Técnico', 'RH & Treinamentos'].map((canal) => (
                <div key={canal} className="p-6 rounded-mx-2xl border border-border-default bg-white hover:border-brand-primary/20 hover:bg-mx-indigo-50/30 transition-all cursor-pointer group/canal flex items-center justify-between shadow-sm hover:shadow-mx-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary group-hover/canal:bg-brand-secondary group-hover/canal:text-white transition-all shadow-inner"><MessageSquare size={20} /></div>
                    <Typography variant="h3" className="text-sm uppercase tracking-tight leading-none">{canal}</Typography>
                  </div>
                  <ChevronRight size={18} className="text-text-tertiary/30 group-hover/canal:text-brand-primary group-hover/canal:translate-x-1 transition-all" />
                </div>
              ))}
            </CardContent>
            <footer className="p-8 border-t border-border-default bg-surface-alt/30">
                <Button className="w-full h-14 rounded-full shadow-mx-lg font-black uppercase tracking-widest">
                    <Plus size={18} className="mr-2" /> INICIAR NOVA MENSAGEM
                </Button>
            </footer>
          </Card>
        </aside>
      </div>
    </main>
  )
}
