import { Play, CheckCircle, Clock, GraduationCap, Trophy, ChevronRight, Search, Filter, RefreshCw, X, Download, Star, Sparkles, BookOpen, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

const trilhas = [
  { id: 1, title: 'Masterizando o Pitch MX', modules: 8, completed: 5, xp: 450, color: 'text-brand-primary', bg: 'bg-brand-primary-surface', icon: Sparkles },
  { id: 2, title: 'Gestão de LeadOps', modules: 12, completed: 12, xp: 1200, color: 'text-status-success', bg: 'bg-status-success-surface', icon: GraduationCap },
  { id: 3, title: 'Negociação High-End', modules: 6, completed: 2, xp: 300, color: 'text-status-warning', bg: 'bg-status-warning-surface', icon: Trophy },
]

export default function Treinamentos() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const stats = [
    { label: 'Cursos Ativos', value: '14', icon: BookOpen, tone: 'bg-mx-indigo-50 text-mx-indigo-600' },
    { label: 'XP Conquistado', value: '4.2k', icon: Trophy, tone: 'bg-status-warning-surface text-status-warning' },
    { label: 'Certificações', value: '08', icon: CheckCircle, tone: 'bg-status-success-surface text-status-success' },
    { label: 'Horas Aula', value: '32h', icon: Clock, tone: 'bg-mx-slate-50 text-text-tertiary' },
  ]

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Academia <span className="text-brand-primary">MX</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Centro de Capacitação & Desenvolvimento</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); setTimeout(() => setIsRefetching(false), 800)}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <div className="relative group w-48 hidden sm:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input type="text" placeholder="Buscar treinamento..." className="mx-input !h-9 !pl-9 !text-[10px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="mx-button-primary bg-brand-secondary">Minha Jornada</button>
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
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Layers size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Trilhas de Performance</h3><p className="mx-text-caption">Evolução do Consultor</p></div>
              </div>
              <Badge className="bg-brand-primary-surface text-brand-primary border-none">3 EM CURSO</Badge>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-lg">
              {trilhas.map((trilha, i) => (
                <motion.div key={trilha.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-mx-slate-50/50 border border-border-subtle rounded-mx-2xl p-mx-lg hover:bg-white hover:shadow-mx-lg transition-all cursor-pointer group/item relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-mx-lg relative z-10">
                    <div className={cn("w-16 h-16 rounded-mx-xl flex items-center justify-center border-4 border-white shadow-mx-md shrink-0", trilha.bg, trilha.color)}><trilha.icon size={32} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-mx-sm">
                        <div><h4 className="text-lg font-black text-text-primary uppercase tracking-tight truncate">{trilha.title}</h4><p className="mx-text-caption !text-[8px] opacity-60 uppercase">{trilha.modules} Módulos • {trilha.xp} XP Disponível</p></div>
                        <span className="font-black text-xs text-brand-primary font-mono-numbers">{Math.round((trilha.completed/trilha.modules)*100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white border border-border-subtle rounded-full overflow-hidden p-px shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${(trilha.completed/trilha.modules)*100}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full shadow-mx-sm", trilha.bg.replace('-surface', ''))} /></div>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform group-hover/item:scale-110 group-hover/item:rotate-12 transition-all shrink-0"><Play size={20} fill="currentColor" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="mx-card p-mx-lg flex flex-col h-full bg-brand-secondary text-white relative overflow-hidden group shadow-mx-elite">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-brand-primary/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="flex items-center gap-mx-sm mb-mx-xl relative z-10">
              <div className="w-12 h-12 rounded-mx-lg bg-white/10 flex items-center justify-center border border-white/10 shadow-inner"><Star size={24} className="text-status-warning" fill="currentColor" /></div>
              <div><h3 className="text-xl font-black text-white tracking-tight uppercase">Ranking Treinos</h3><p className="mx-text-caption text-white/40">Engagement Board</p></div>
            </div>
            <div className="space-y-mx-md flex-1 relative z-10">
              {[1, 2, 3].map(pos => (
                <div key={pos} className="flex items-center gap-mx-md p-mx-md rounded-mx-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                  <div className="w-8 h-8 rounded-mx-md bg-white/10 flex items-center justify-center font-black text-xs text-white/40">{pos}º</div>
                  <div className="w-10 h-10 rounded-full bg-mx-slate-50 overflow-hidden border-2 border-white/10"><img src={`https://i.pravatar.cc/150?u=${pos}`} alt={`Avatar do participante ${pos}`} width={40} height={40} loading="lazy" /></div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-black truncate uppercase">Elite Member {pos}</p><p className="mx-text-caption !text-[8px] text-white/30">Master Certified</p></div>
                  <div className="text-right"><p className="text-xs font-black text-status-warning font-mono-numbers">{(4 - pos) * 1200} XP</p></div>
                </div>
              ))}
            </div>
            <button className="mx-button-primary !bg-white/10 !text-white border border-white/10 mt-mx-lg w-full flex items-center justify-center gap-2 group/btn">Ver Placar Completo <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
