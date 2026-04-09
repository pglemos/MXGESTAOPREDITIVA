import { useState, useMemo, useCallback } from 'react'
import { 
    MessageSquare, Star, TrendingUp, Target, User, 
    MessageCircle, Award, RefreshCw, Smartphone, 
    ShieldCheck, History, ArrowRight
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useFeedbacks } from '@/hooks/useData'

export default function Feedback() {
  const { feedbacks, loading, refetch } = useFeedbacks()
  const [isRefetching, setIsRefetching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true); await refetch(); setIsRefetching(false)
    toast.success('Feedbacks sincronizados!')
  }, [refetch])

  const stats = useMemo(() => [
    { label: 'Nota Média', value: '4.8', icon: Star, tone: 'warning' },
    { label: 'Evolução', value: '+12%', icon: TrendingUp, tone: 'success' },
    { label: 'Mentorias', value: feedbacks.length.toString(), icon: MessageCircle, tone: 'brand' },
    { label: 'Arena Rank', value: 'Top 5', icon: Award, tone: 'secondary' },
  ], [feedbacks])

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f: any) => 
        f.content?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.manager_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [feedbacks, searchTerm])

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
        <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Feedbacks...</Typography>
    </div>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / Feedback Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Matriz de <span className="text-brand-primary">Feedback</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">EVOLUÇÃO & DESENVOLVIMENTO CONTÍNUO</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Button className="h-12 px-8 shadow-mx-lg bg-brand-secondary">
            SOLICITAR MENTORIA
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-14 w-14 rounded-mx-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                item.tone === 'secondary' ? 'bg-brand-secondary text-white border-white/10' :
                'bg-status-warning-surface border-mx-amber-100 text-status-warning'
              )}>
                <item.icon size={24} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        {/* Main Feedback List */}
        <section className="lg:col-span-8 flex flex-col">
          <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group relative">
            <div className="absolute top-0 right-0 p-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors">
              <MessageSquare size={240} strokeWidth={2.5} />
            </div>

            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-row items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl"><MessageSquare size={32} /></div>
                <div>
                  <Typography variant="h2" className="text-2xl uppercase">Linha do Tempo</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">ACOMPANHAMENTO DO CONSULTOR</Typography>
                </div>
              </div>
              <Badge variant="brand" className="px-6 py-2 rounded-full font-black shadow-mx-sm uppercase">Performance OK</Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-10 md:p-14 relative z-10">
              {filteredFeedbacks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <History size={48} className="text-text-tertiary/20 mb-6" />
                    <Typography variant="h3" tone="muted">Vácuo de Mentoria</Typography>
                    <Typography variant="p" tone="muted" className="text-xs uppercase mt-2">Nenhum registro de feedback localizado.</Typography>
                </div>
              ) : (
                <div className="space-y-8">
                  <AnimatePresence mode="popLayout">
                    {filteredFeedbacks.map((f: any, i: number) => (
                      <motion.article key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-8 md:p-10 bg-surface-alt/50 border border-border-default rounded-mx-3xl hover:bg-white hover:shadow-mx-xl transition-all relative group/item">
                          <header className="flex justify-between items-start mb-8 border-b border-border-default pb-6">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center shadow-mx-sm group-hover/item:scale-110 transition-transform"><User size={24} className="text-text-tertiary" /></div>
                              <div>
                                <Typography variant="h3" className="text-sm uppercase tracking-tight">{f.manager_name || 'Gestão MX'}</Typography>
                                <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase">{new Date(f.created_at).toLocaleDateString('pt-BR')} • FEEDBACK</Typography>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className={cn(s <= (f.score || 5) ? "text-status-warning fill-current" : "text-border-strong opacity-30")} />)}
                            </div>
                          </header>
                          <Typography variant="p" className="text-base font-bold text-text-secondary leading-relaxed italic border-none bg-transparent p-0 mb-8">
                            "{f.content}"
                          </Typography>
                          <footer className="pt-6 border-t border-border-default flex items-center gap-6">
                            <Button variant="ghost" size="sm" className="h-8 px-4 text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline hover:bg-transparent">Reconhecer</Button>
                            <div className="w-1.5 h-1.5 rounded-full bg-border-strong opacity-20" />
                            <Button variant="ghost" size="sm" className="h-8 px-4 text-[9px] font-black text-text-tertiary uppercase tracking-widest hover:text-text-primary hover:bg-transparent">Discutir em 1:1</Button>
                          </footer>
                        </Card>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Sidebar Skill Analysis */}
        <aside className="lg:col-span-4 flex flex-col h-full">
          <Card className="p-10 md:p-14 flex flex-col h-full bg-brand-secondary text-white border-none shadow-mx-elite relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
            <header className="relative z-10 flex items-center gap-4 mb-14 border-b border-white/10 pb-8">
              <div className="w-14 h-14 rounded-mx-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:rotate-6 transition-transform shadow-inner"><Target size={28} className="text-indigo-400" /></div>
              <div>
                <Typography variant="h3" tone="white">Foco Evolutivo</Typography>
                <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest mt-1">META TÉCNICA DO CICLO</Typography>
              </div>
            </header>
            
            <div className="space-y-10 relative z-10 flex-1">
              {[
                { label: 'Conversão Web', val: 82, tone: 'success' },
                { label: 'Follow-up D0', val: 45, tone: 'error' },
                { label: 'Mix Adicionais', val: 68, tone: 'warning' },
              ].map((skill, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Typography variant="caption" tone="white" className="text-[10px] font-black uppercase opacity-60">{skill.label}</Typography>
                    <Typography variant="mono" tone="white" className="text-xs font-black">{skill.val}%</Typography>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 shadow-inner border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${skill.val}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                        className={cn("h-full rounded-full shadow-mx-sm", 
                            skill.tone === 'success' ? 'bg-status-success' : 
                            skill.tone === 'error' ? 'bg-status-error' : 'bg-status-warning'
                        )} 
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <footer className="pt-10 mt-auto relative z-10">
                <Button variant="outline" className="w-full h-16 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 font-black uppercase tracking-[0.2em] text-[10px] shadow-mx-lg">
                    SOLICITAR AVALIAÇÃO 360º
                </Button>
            </footer>
          </Card>
        </aside>
      </div>
    </main>
  )
}
