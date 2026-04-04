import { useCheckins } from '@/hooks/useCheckins'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Search, Filter, Download, ChevronRight, RefreshCw, X, FileText, CheckCircle2, AlertTriangle, TrendingUp, Car, Users, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Historico() {
  const { checkins, loading, fetchCheckins: refetch } = useCheckins()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => new Date(b.reference_date).getTime() - new Date(a.reference_date).getTime())
  }, [checkins])

  const stats = useMemo(() => {
    const total = checkins.reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
    const avg = checkins.length > 0 ? total / checkins.length : 0
    return [
      { label: 'Volume Acumulado', value: total, icon: TrendingUp, tone: 'bg-brand-primary-surface text-brand-primary' },
      { label: 'Média Diária', value: avg.toFixed(1), icon: CheckCircle2, tone: 'bg-status-success-surface text-status-success' },
      { label: 'Dias Ativos', value: checkins.length, icon: Calendar, tone: 'bg-mx-slate-50 text-text-tertiary' },
    ]
  }, [checkins])

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Histórico <span className="text-brand-primary">Operacional</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Logs de Performance & Auditoria</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <button onClick={() => {setIsRefetching(true); refetch().then(() => setIsRefetching(false))}} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
          <button className="mx-button-primary bg-white !text-text-primary border border-border-default flex items-center gap-2"><Filter size={16} /> Período</button>
          <button onClick={() => toast.success('Gerando Report de Auditoria...')} className="mx-button-primary bg-brand-secondary"><Download size={18} /> Exportar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <div key={item.label} className="mx-card p-mx-md flex flex-col justify-between group relative overflow-hidden">
            <div className="flex items-center justify-between gap-mx-xs relative z-10">
              <div><p className="mx-text-caption mb-1">{item.label}</p><p className="text-3xl font-black tracking-tighter font-mono-numbers leading-none">{item.value}</p></div>
              <div className={cn('h-10 w-10 rounded-mx-md flex items-center justify-center border shadow-sm', item.tone)}><item.icon size={18} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-card flex-1 min-h-[500px] overflow-hidden flex flex-col group mb-mx-3xl">
        <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-mx-sm">
            <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><FileText size={24} /></div>
            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Linha do Tempo</h3><p className="mx-text-caption">Registros de Check-in Consolidados</p></div>
          </div>
          <Badge className="bg-brand-primary text-white border-none">LIVE AUDIT</Badge>
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Data Operação</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Porta</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">CRM</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Web</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Funil (L/A/V)</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Status</th></tr></thead>
            <tbody className="divide-y divide-border-subtle bg-white">
              {filteredCheckins.map((c, i) => (
                <tr key={c.id} className={cn("hover:bg-mx-slate-50/50 transition-colors h-20 group border-none", i % 2 !== 0 && "bg-mx-slate-50/20")}>
                  <td className="pl-mx-lg py-4"><span className="font-black text-sm text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors">{format(parseISO(c.reference_date), "dd 'de' MMMM", { locale: ptBR })}</span><p className="mx-text-caption !text-[8px] opacity-60 uppercase">Check-in Consolidado</p></td>
                  <td className="py-4 text-center font-black text-lg font-mono-numbers text-text-primary">{c.vnd_porta_prev_day || 0}</td>
                  <td className="py-4 text-center font-black text-lg font-mono-numbers text-text-primary">{c.vnd_cart_prev_day || 0}</td>
                  <td className="py-4 text-center font-black text-lg font-mono-numbers text-text-primary">{c.vnd_net_prev_day || 0}</td>
                  <td className="py-4 text-center"><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mx-slate-100 border border-border-default"><span className="text-[10px] font-black text-brand-primary">{c.leads_prev_day || 0}</span><div className="w-1 h-1 rounded-full bg-mx-slate-300" /><span className="text-[10px] font-black text-status-warning">{c.agd_total || 0}</span><div className="w-1 h-1 rounded-full bg-mx-slate-300" /><span className="text-[10px] font-black text-status-success">{c.visit_prev_day || 0}</span></div></td>
                  <td className="pr-mx-lg py-4 text-right"><Badge className="bg-status-success-surface text-status-success border-none text-[8px] px-3 h-7 rounded-full shadow-sm">VERIFICADO</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
