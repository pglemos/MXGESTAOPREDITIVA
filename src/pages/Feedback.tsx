import { useState, useMemo } from 'react'
import { MessageSquare, Star, TrendingUp, Target, Zap, Sparkles, RefreshCw, Search, ChevronRight, MoreVertical, Plus, Award, User, MessageCircle, BarChart3, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

const INITIAL_FEEDBACKS = [
  { id: '1', author: 'Admin MX', type: 'performance', content: 'Excelente evolução no funil de internet. Mantenha o foco no follow-up.', date: 'Há 2 dias', score: 5, color: 'text-status-success', bg: 'bg-status-success-surface border-mx-emerald-100' },
  { id: '2', author: 'Gestão Regional', type: 'behavior', content: 'Atenção ao tempo de resposta dos leads D0. O SLA subiu acima do aceitável.', date: 'Há 1 semana', score: 3, color: 'text-status-warning', bg: 'bg-status-warning-surface border-mx-amber-100' },
]

export default function Feedback() {
  const { team, refetch: refetchAll } = useAppStore()
  const [feedbacks, setFeedbacks] = useState(INITIAL_FEEDBACKS)
  const [isRefetching, setIsRefetching] = useState(false)

  const stats = [
    { label: 'Nota Média', value: '4.8', icon: Star, tone: 'bg-status-warning-surface text-status-warning' },
    { label: 'Evolução', value: '+12%', icon: TrendingUp, tone: 'bg-status-success-surface text-status-success' },
    { label: 'Feedbacks', value: '24', icon: MessageCircle, tone: 'bg-brand-primary-surface text-brand-primary' },
    { label: 'Rank Alpha', value: 'Top 5', icon: Award, tone: 'bg-brand-secondary text-white' },
  ]

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Matriz de <span className="text-brand-primary">Feedback</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Evolução & Desenvolvimento Contínuo</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); setTimeout(() => setIsRefetching(false), 800)}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <button className="mx-button-primary bg-brand-secondary">Solicitar Mentoria</button>
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
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform rotate-3"><MessageSquare size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Histórico de Mentoria</h3><p className="mx-text-caption">Acompanhamento do Consultor</p></div>
              </div>
              <Badge className="bg-brand-primary text-white border-none">PERFORMANCE OK</Badge>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-lg relative">
              <AnimatePresence mode="popLayout">
                {feedbacks.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn("p-mx-lg rounded-mx-2xl border transition-all hover:shadow-mx-lg group/item relative overflow-hidden", f.bg)}>
                    <div className="flex justify-between items-start mb-mx-md relative z-10">
                      <div className="flex items-center gap-mx-md">
                        <div className="w-12 h-12 rounded-mx-lg bg-white border border-border-default flex items-center justify-center shadow-mx-sm"><User size={24} className="text-text-tertiary" /></div>
                        <div><h4 className="font-black text-sm text-text-primary uppercase tracking-tight">{f.author}</h4><p className="mx-text-caption !text-[8px] opacity-60">{f.date} • Mentoria Técnica</p></div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={cn(s <= f.score ? "text-status-warning fill-current" : "text-mx-slate-200")} />)}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-text-secondary leading-relaxed italic relative z-10">"{f.content}"</p>
                    <div className="mt-mx-lg pt-mx-md border-t border-border-subtle flex items-center gap-mx-sm relative z-10">
                      <button className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">Reconhecer</button>
                      <div className="w-1 h-1 rounded-full bg-mx-slate-300" />
                      <button className="text-[9px] font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary">Discutir em 1:1</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg h-full">
          <div className="mx-card p-mx-lg flex flex-col h-full bg-brand-secondary text-white relative overflow-hidden group shadow-mx-elite">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10 flex items-center gap-mx-sm mb-mx-xl">
              <div className="w-12 h-12 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center"><Target size={24} className="text-status-warning" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Foco Evolutivo</h3>
            </div>
            <div className="space-y-mx-lg relative z-10 flex-1">
              {[
                { label: 'Conversão Web', val: 82, color: 'bg-status-success' },
                { label: 'Follow-up D0', val: 45, color: 'bg-status-error' },
                { label: 'Mix Adicionais', val: 68, color: 'bg-status-warning' },
              ].map((skill, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between mx-text-caption !text-[8px] text-white/40"><span>{skill.label}</span><span className="font-mono-numbers">{skill.val}%</span></div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden p-px shadow-inner"><div className={cn("h-full rounded-full shadow-mx-sm", skill.color)} style={{ width: `${skill.val}%` }} /></div>
                </div>
              ))}
            </div>
            <button className="mx-button-primary !bg-white/10 !text-white border border-white/10 w-full mt-mx-xl">Solicitar Avaliação 360º</button>
          </div>
        </div>
      </div>
    </div>
  )
}
