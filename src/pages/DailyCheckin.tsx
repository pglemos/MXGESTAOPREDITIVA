import { useState, useEffect, useCallback } from 'react'
import { CheckSquare, Save, Clock, Calendar, Zap, TrendingUp, RefreshCw, X, ChevronRight, User, Target, Car, FileText, ClipboardCheck, Sparkles, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TerminalCheckin() {
  const { profile } = useAuth()
  const { saveCheckin, loading: saving, checkins } = useCheckins()
  
  const [porta, setPorta] = useState('0')
  const [cart, setCart] = useState('0')
  const [net, setNet] = useState('0')
  const [agd, setAgd] = useState('0')
  const [vis, setVis] = useState('0')
  const [leads, setLeads] = useState('0')

  const stats = [
    { label: 'Sua Meta', value: '25', icon: Target, tone: 'bg-brand-primary-surface text-brand-primary' },
    { label: 'Realizado', value: '18', icon: CheckSquare, tone: 'bg-status-success-surface text-status-success' },
    { label: 'Pacing', value: '72%', icon: TrendingUp, tone: 'bg-status-warning-surface text-status-warning' },
    { label: 'Dias Rest.', value: '12', icon: Clock, tone: 'bg-mx-slate-50 text-text-tertiary' },
  ]

  const handleSave = async () => {
    try {
      await saveCheckin({
        vnd_porta: Number(porta), vnd_cart: Number(cart), vnd_net: Number(net),
        agd_total: Number(agd), visitas: Number(vis), leads: Number(leads),
        date: new Date().toISOString().split('T')[0]
      })
      toast.success('Check-in Consolidado no Cluster!')
    } catch (e) { toast.error('Falha na sincronização.') }
  }

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
            <h1 className="mx-heading-hero">Terminal de <span className="text-brand-primary">Check-in</span></h1>
          </div>
          <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Input de Resultados D0</p>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <div className="flex items-center gap-2 px-mx-md py-4 rounded-full border border-border-default bg-white shadow-mx-sm"><Calendar size={18} className="text-brand-primary" /><span className="mx-text-caption text-text-primary uppercase tracking-widest">Operação: {format(new Date(), 'dd MMMM yyyy', { locale: ptBR })}</span></div>
          <button onClick={handleSave} disabled={saving} className="mx-button-primary bg-brand-secondary">{saving ? <RefreshCw className="animate-spin" /> : <><ClipboardCheck size={18} /> Consolidar Dia</>}</button>
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
        <div className="lg:col-span-8">
          <div className="mx-card h-full flex flex-col overflow-hidden group">
            <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-center gap-mx-sm">
              <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Car size={24} /></div>
              <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Conversões Realizadas</h3><p className="mx-text-caption">Contagem de Ativos Diretos</p></div>
            </div>
            <div className="p-mx-lg md:p-mx-xl grid grid-cols-1 sm:grid-cols-3 gap-mx-lg">
              {[
                { label: 'Porta / Showroom', val: porta, set: setPorta, icon: MapPin },
                { label: 'Carteira / CRM', val: cart, set: setCart, icon: User },
                { label: 'Internet / Digital', val: net, set: setNet, icon: Globe },
              ].map((input, i) => (
                <div key={i} className="flex flex-col gap-mx-md p-mx-lg bg-mx-slate-50/50 border border-border-subtle rounded-mx-3xl group/input hover:bg-white hover:shadow-mx-lg transition-all">
                  <div className="flex items-center gap-2 text-brand-primary"><input.icon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{input.label}</span></div>
                  <input type="text" inputMode="numeric" value={input.val} onChange={e => input.set(e.target.value.replace(/\D/g, ''))} className="w-full bg-transparent text-6xl font-black font-mono-numbers text-text-primary text-center focus:outline-none tracking-tighter" />
                  <div className="flex justify-center gap-2">
                    <button onClick={() => input.set(String(Math.max(0, Number(input.val) - 1)))} className="w-10 h-10 rounded-mx-md bg-white border border-border-default flex items-center justify-center text-text-tertiary hover:text-status-error transition-all">-</button>
                    <button onClick={() => input.set(String(Number(input.val) + 1))} className="w-10 h-10 rounded-mx-md bg-white border border-border-default flex items-center justify-center text-text-tertiary hover:text-status-success transition-all">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-mx-lg md:p-mx-xl border-t border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-mx-lg bg-mx-slate-50/10">
              {[
                { label: 'Leads Recebidos', val: leads, set: setLeads, icon: Sparkles, color: 'text-brand-primary' },
                { label: 'Agendamentos', val: agd, set: setAgd, icon: Clock, color: 'text-status-warning' },
                { label: 'Visitas Efetivas', val: vis, set: setVis, icon: User, color: 'text-status-info' },
              ].map((input, i) => (
                <div key={i} className="flex items-center justify-between p-mx-md rounded-mx-xl border border-border-subtle bg-white shadow-mx-sm">
                  <div className="flex items-center gap-3"><div className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center shadow-inner", input.color.replace('text', 'bg') + '-surface', input.color)}><input.icon size={18} /></div><span className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">{input.label}</span></div>
                  <input type="text" inputMode="numeric" value={input.val} onChange={e => input.set(e.target.value.replace(/\D/g, ''))} className="w-12 bg-transparent text-2xl font-black font-mono-numbers text-text-primary text-right focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-mx-lg">
          <div className="mx-card p-mx-lg bg-brand-secondary text-white shadow-mx-elite relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/20 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="relative z-10">
              <div className="flex items-center gap-mx-sm mb-mx-xl">
                <div className="w-12 h-12 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center"><MessageCircle size={24} className="text-status-warning" /></div>
                <h3 className="text-xl font-black uppercase tracking-tight">Pitch do Dia</h3>
              </div>
              <p className="text-sm font-bold text-white/60 leading-relaxed italic mb-mx-xl">"Foque na avaliação do usado como diferencial competitivo para os leads Webmotors de hoje."</p>
              <button className="mx-button-primary !bg-white/10 !text-white border border-white/10 w-full flex items-center justify-center gap-2 group/btn">Ver Script Completo <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /></button>
            </div>
          </div>
          <div className="h-full border-2 border-dashed border-border-default rounded-mx-3xl bg-mx-slate-50/30 flex flex-col items-center justify-center p-mx-xl text-center group hover:bg-mx-slate-50 transition-all">
            <FileText size={48} className="text-mx-slate-200 mb-mx-lg group-hover:text-brand-primary transition-colors" />
            <h3 className="text-2xl font-black text-text-primary tracking-tighter mb-mx-sm uppercase leading-none">Matinal Pendente</h3>
            <p className="text-xs font-bold text-text-tertiary leading-relaxed max-w-[200px]">Complete seu check-in para desbloquear o relatório de hoje.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
