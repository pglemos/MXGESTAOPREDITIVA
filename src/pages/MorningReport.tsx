import { useState, useMemo } from 'react'
import { Presentation, TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, X, Download, Coffee, MessageCircle, BarChart3, Bot, Sparkles, Filter, Users, Star, ShieldCheck, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function MorningReport() {
  const { team, refetch: refetchAll } = useAppStore()
  const [isRefetching, setIsRefetching] = useState(false)

  const diagnostics = [
    { title: 'Ritmo de Rede', value: 'Saudável', icon: CheckCircle2, color: 'text-status-success', bg: 'bg-status-success-surface', text: 'Rede operando em 104% da projeção oficial.' },
    { title: 'Gargalo D0', value: 'Webmotors', icon: AlertTriangle, color: 'text-status-error', bg: 'bg-status-error-surface', text: 'Tempo de resposta médio subiu para 18 minutos.' },
    { title: 'Top Performer', value: 'João Silva', icon: Star, color: 'text-status-warning', bg: 'bg-status-warning-surface', text: 'Conversão de leads quentes acima da média da rede.' },
  ]

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Relatório <span className="text-brand-primary">Matinal</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Briefing Tático de Abertura</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <div className="flex items-center gap-2 px-mx-md py-4 rounded-full border border-border-default bg-white shadow-mx-sm"><Coffee size={18} className="text-brand-primary" /><span className="mx-text-caption text-text-primary uppercase tracking-widest">Bom dia, {format(new Date(), 'dd MMM', { locale: ptBR })}</span></div>
          <button onClick={() => {setIsRefetching(true); setTimeout(() => setIsRefetching(false), 800)}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <button className="mx-button-primary bg-brand-secondary">Disparar para Time</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        <div className="lg:col-span-8 flex flex-col gap-mx-lg">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-3"><Presentation size={24} /></div>
                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Pauta do Dia</h3><p className="mx-text-caption">Estratégias de Tração</p></div>
              </div>
              <Badge className="bg-brand-primary text-white border-none">ALINHAMENTO TÁTICO</Badge>
            </div>
            <div className="p-mx-lg md:p-mx-xl space-y-mx-2xl flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-mx-lg">
                <h4 className="mx-text-caption text-brand-primary flex items-center gap-2"><Sparkles size={14} /> Insights da Operação</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                  {diagnostics.map((d, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col gap-mx-md p-mx-lg bg-mx-slate-50/50 border border-border-subtle rounded-mx-2xl hover:bg-white hover:shadow-mx-lg transition-all cursor-pointer group/diag">
                      <div className={cn("w-12 h-12 rounded-mx-lg flex items-center justify-center border shadow-inner transition-transform group-hover/diag:scale-110", d.bg, d.color)}><d.icon size={24} strokeWidth={2.5} /></div>
                      <div><p className="mx-text-caption mb-1">{d.title}</p><h5 className="font-black text-lg text-text-primary uppercase tracking-tight">{d.value}</h5></div>
                      <p className="text-xs font-bold text-text-secondary leading-relaxed italic border-t border-border-subtle pt-mx-md mt-auto">"{d.text}"</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-mx-lg border-t border-border-subtle space-y-mx-lg">
                <h4 className="mx-text-caption text-brand-primary flex items-center gap-2"><Target size={14} /> Objetivos Prioritários</h4>
                <div className="space-y-mx-sm">
                  {[
                    { label: 'Reativar Leads Estagnados > 24h', icon: Zap, status: 'Ativo' },
                    { label: 'Focar no Mix de Blindagem', icon: ShieldCheck, status: 'Ativo' },
                    { label: 'Confirmar Visitas de Sábado', icon: Calendar, status: 'Pend.' },
                  ].map((o, i) => (
                    <div key={i} className="p-mx-md rounded-mx-lg border border-border-subtle bg-white flex items-center justify-between group/obj hover:border-brand-primary/30 transition-all">
                      <div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 flex items-center justify-center text-brand-primary group-hover/obj:bg-brand-secondary group-hover/obj:text-white transition-all shadow-inner"><o.icon size={18} /></div><span className="text-sm font-black text-text-primary uppercase tracking-tight">{o.label}</span></div>
                      <Badge variant="outline" className={cn("text-[8px] font-black h-6 rounded-md", o.status === 'Ativo' ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-mx-slate-50 text-text-tertiary")}>{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="mx-card p-mx-lg bg-brand-secondary text-white shadow-mx-elite relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-brand-primary/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-mx-sm mb-mx-xl">
                <div className="w-12 h-12 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center shadow-inner"><Coffee size={24} className="text-status-warning" /></div>
                <h3 className="text-xl font-black uppercase tracking-tight">Recado do Gestor</h3>
              </div>
              <p className="text-sm font-bold text-white/60 leading-relaxed italic mb-mx-xl">"O segredo da performance de hoje está no detalhe do follow-up. Não deixem leads Webmotors esfriarem."</p>
              <div className="flex items-center gap-3 p-3 rounded-mx-xl bg-white/5 border border-white/5"><div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden"><img src="https://i.pravatar.cc/150?u=admin" /></div><div><p className="text-[10px] font-black uppercase tracking-widest">Admin MX</p><p className="text-[8px] text-white/40 uppercase">Especialista Sênior</p></div></div>
            </div>
          </div>
          <div className="mx-card flex-1 p-mx-lg flex flex-col items-center justify-center text-center group">
            <div className="w-16 h-16 rounded-mx-lg bg-status-info-surface text-status-info border border-mx-indigo-100 flex items-center justify-center shadow-inner mb-mx-md group-hover:rotate-6 transition-transform"><BarChart3 size={32} /></div>
            <h3 className="text-xl font-black text-text-primary tracking-tighter mb-1 uppercase">Stats do Time</h3>
            <p className="mx-text-caption !text-[8px] mb-mx-lg uppercase">Volume Consolidado D-1</p>
            <div className="w-full space-y-2"><div className="flex justify-between mx-text-caption !text-[8px] text-text-tertiary uppercase"><span>Vendas</span><span className="font-mono-numbers">12/15</span></div><div className="h-1.5 bg-mx-slate-50 rounded-full overflow-hidden p-px shadow-inner"><div className="h-full w-[80%] bg-brand-primary rounded-full shadow-mx-sm" /></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
