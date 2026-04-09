import { useCheckins } from '@/hooks/useCheckins'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
    Calendar, Search, Filter, Download, ChevronRight, 
    RefreshCw, X, FileText, CheckCircle2, AlertTriangle, 
    TrendingUp, Car, Users, Globe, Smartphone, ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function HistoryPage() {
  const { checkins, loading, fetchCheckins: refetch } = useCheckins()
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)

  const filteredCheckins = useMemo(() => {
    return [...checkins]
        .filter(c => c.reference_date.includes(searchTerm))
        .sort((a, b) => new Date(b.reference_date).getTime() - new Date(a.reference_date).getTime())
  }, [checkins, searchTerm])

  const stats = useMemo(() => {
    const total = checkins.reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
    const avg = checkins.length > 0 ? total / checkins.length : 0
    return [
      { label: 'Volume Acumulado', value: total, icon: TrendingUp, tone: 'brand' },
      { label: 'Média Diária', value: avg.toFixed(1), icon: CheckCircle2, tone: 'success' },
      { label: 'Dias Ativos', value: checkins.length, icon: Calendar, tone: 'info' },
    ]
  }, [checkins])

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
        <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Logs...</Typography>
    </div>
  )

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      {/* Header / History Toolbar */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Logs de <span className="text-brand-primary">Auditoria</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">HISTÓRICO OPERACIONAL CONSOLIDADO</Typography>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <Button variant="outline" size="icon" onClick={() => {setIsRefetching(true); refetch().then(() => {setIsRefetching(false); toast.success('Logs sincronizados!')})}} className="w-12 h-12 rounded-xl shadow-mx-sm">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Button variant="outline" className="h-12 px-6 rounded-full shadow-mx-sm uppercase font-black tracking-widest text-[10px]">
            <Filter size={16} className="mr-2" /> PERÍODO
          </Button>
          <Button className="h-12 px-8 shadow-mx-lg bg-brand-secondary">
            <Download size={18} className="mr-2" /> EXPORTAR AUDIT
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
        {stats.map((item) => (
          <Card key={item.label} className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-[8px]">{item.label}</Typography>
                <Typography variant="h1" className="text-4xl tabular-nums leading-none">{item.value}</Typography>
              </div>
              <div className={cn(
                'h-12 w-12 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                item.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                'bg-status-info-surface border-mx-blue-100 text-status-info'
              )}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Audit Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col border-none shadow-mx-xl bg-white mb-20">
        <CardHeader className="p-10 border-b border-border-default bg-surface-alt/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-2"><FileText size={28} /></div>
            <div>
              <Typography variant="h2" className="text-2xl uppercase">Timeline de Registros</Typography>
              <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">SINC: LIVE AUDIT SYSTEM</Typography>
            </div>
          </div>
          <div className="relative group w-64 hidden sm:block">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
            <Input 
                placeholder="BUSCAR DATA..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
            />
          </div>
        </CardHeader>

        <div className="flex-1 overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
                <tr className="bg-surface-alt/50 border-b border-border-default text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary">
                    <th scope="col" className="pl-10 py-6">DATA OPERAÇÃO</th>
                    <th scope="col" className="px-6 py-6 text-center">PORTA</th>
                    <th scope="col" className="px-6 py-6 text-center">CARTEIRA</th>
                    <th scope="col" className="px-6 py-6 text-center">DIGITAL</th>
                    <th scope="col" className="px-6 py-6 text-center">FUNIL (L/A/V)</th>
                    <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border-default bg-white">
              {filteredCheckins.map((c, i) => (
                <tr key={c.id} className="hover:bg-surface-alt/30 transition-colors h-24 group">
                  <td className="pl-10">
                    <div className="flex flex-col">
                        <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                            {format(parseISO(c.reference_date), "dd 'de' MMMM", { locale: ptBR })}
                        </Typography>
                        <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase mt-1">Snapshot Consolidado</Typography>
                    </div>
                  </td>
                  <td className="px-6 text-center font-black text-lg tabular-nums text-text-primary opacity-60">{c.vnd_porta_prev_day || 0}</td>
                  <td className="px-6 text-center font-black text-lg tabular-nums text-text-primary opacity-60">{c.vnd_cart_prev_day || 0}</td>
                  <td className="px-6 text-center font-black text-lg tabular-nums text-text-primary opacity-60">{c.vnd_net_prev_day || 0}</td>
                  <td className="px-6 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-surface-alt border border-border-default shadow-inner">
                        <div className="flex flex-col items-center">
                            <Typography variant="mono" tone="brand" className="text-xs">{c.leads_prev_day || 0}</Typography>
                            <Typography variant="caption" className="text-[6px] opacity-40">L</Typography>
                        </div>
                        <div className="w-px h-4 bg-border-strong opacity-20" />
                        <div className="flex flex-col items-center">
                            <Typography variant="mono" tone="warning" className="text-xs">{c.agd_total || 0}</Typography>
                            <Typography variant="caption" className="text-[6px] opacity-40">A</Typography>
                        </div>
                        <div className="w-px h-4 bg-border-strong opacity-20" />
                        <div className="flex flex-col items-center">
                            <Typography variant="mono" tone="success" className="text-xs">{c.visit_prev_day || 0}</Typography>
                            <Typography variant="caption" className="text-[6px] opacity-40">V</Typography>
                        </div>
                    </div>
                  </td>
                  <td className="pr-10 text-right">
                    <Badge variant="success" className="px-6 py-1.5 rounded-lg shadow-sm border uppercase font-black tracking-widest text-[8px]">
                        VERIFICADO
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}
