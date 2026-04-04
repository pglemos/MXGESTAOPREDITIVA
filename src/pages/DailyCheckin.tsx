import { useState, useMemo, useEffect } from 'react'
import { CheckSquare, Clock, Calendar, Zap, RefreshCw, ChevronRight, User, Target, Car, ClipboardCheck, Sparkles, MessageCircle, MapPin, Globe, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { validarFunil } from '@/lib/calculations'
import type { CheckinFormData } from '@/types/database'

export default function DailyCheckin() {
  const { profile } = useAuth()
  const { saveCheckin, loading: saving, todayCheckin, referenceDate } = useCheckins()
  
  const [form, setForm] = useState<CheckinFormData>({
    leads: 0,
    agd_cart_prev: 0,
    agd_net_prev: 0,
    agd_cart: 0,
    agd_net: 0,
    vnd_porta: 0,
    vnd_cart: 0,
    vnd_net: 0,
    visitas: 0,
    note: '',
    zero_reason: ''
  })

  // Sincronizar form com todayCheckin se já existir
  useEffect(() => {
    if (todayCheckin) {
      setForm({
        leads: todayCheckin.leads_prev_day,
        agd_cart_prev: todayCheckin.agd_cart_prev_day,
        agd_net_prev: todayCheckin.agd_net_prev_day,
        agd_cart: todayCheckin.agd_cart_today,
        agd_net: todayCheckin.agd_net_today,
        vnd_porta: todayCheckin.vnd_porta_prev_day,
        vnd_cart: todayCheckin.vnd_cart_prev_day,
        vnd_net: todayCheckin.vnd_net_prev_day,
        visitas: todayCheckin.visit_prev_day,
        note: todayCheckin.note || '',
        zero_reason: todayCheckin.zero_reason || ''
      })
    }
  }, [todayCheckin])

  const stats = useMemo(() => [
    { label: 'Referência', value: format(parseISO(referenceDate), 'dd/MM'), icon: Calendar, tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Status', value: todayCheckin ? 'Enviado' : 'Pendente', icon: CheckSquare, tone: todayCheckin ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600' },
    { label: 'Vendas Ontem', value: (form.vnd_porta + form.vnd_cart + form.vnd_net).toString(), icon: Car, tone: 'bg-slate-50 text-slate-600' },
    { label: 'Agend. Hoje', value: (form.agd_cart + form.agd_net).toString(), icon: Clock, tone: 'bg-amber-50 text-amber-600' },
  ], [referenceDate, todayCheckin, form])

  const handleSave = async () => {
    const error = validarFunil(form)
    if (error) {
      toast.error(error, {
        icon: <AlertTriangle className="text-rose-600" />,
        className: "bg-rose-50 border-rose-100 text-rose-900 font-bold"
      })
      return
    }

    try {
      const { error: saveError } = await saveCheckin(form)
      if (saveError) throw new Error(saveError)
      toast.success('Check-in Consolidado na Rede Oficial MX!')
    } catch (e: any) { 
      toast.error(e.message || 'Falha na sincronização.') 
    }
  }

  const updateField = (field: keyof CheckinFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: Number(value) }))
  }

  const increment = (field: keyof CheckinFormData) => {
    setForm(prev => ({ ...prev, [field]: (prev[field] as number) + 1 }))
  }

  const decrement = (field: keyof CheckinFormData) => {
    setForm(prev => ({ ...prev, [field]: Math.max(0, (prev[field] as number) - 1) }))
  }

  return (
    <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-mx-xs">
            <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" />
            <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Terminal <span className="text-indigo-600">Check-in</span></h1>
          </div>
          <div className="flex items-center gap-3 pl-mx-md">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[10px] tracking-widest uppercase">
              Operação: {format(parseISO(referenceDate), "dd 'de' MMMM", { locale: ptBR })}
            </Badge>
            <p className="mx-text-caption opacity-60 uppercase tracking-[0.3em] font-black text-[9px]">Input de Resultados • Metodologia MX</p>
          </div>
        </div>

        <div className="flex items-center gap-mx-sm shrink-0">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enviado em</span>
            <span className="text-[10px] font-bold text-slate-950 uppercase">{todayCheckin ? format(parseISO(todayCheckin.submitted_at), 'HH:mm:ss') : '--:--:--'}</span>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving || !!todayCheckin} 
            className={cn(
              "mx-button-primary h-12 px-8 flex items-center gap-3 shadow-lg transition-all",
              todayCheckin ? "bg-emerald-600 hover:bg-emerald-600 opacity-80" : "bg-slate-950 hover:bg-black"
            )}
          >
            {saving ? <RefreshCw className="animate-spin" /> : todayCheckin ? <><CheckSquare size={18} /> Consolidado</> : <><ClipboardCheck size={18} /> Consolidar Dia</>}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-sm shrink-0">
        {stats.map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 p-6 rounded-[2rem] flex flex-col justify-between group relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-mx-xs relative z-10">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-2xl font-black tracking-tighter font-mono-numbers leading-none text-slate-950">{item.value}</p>
              </div>
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner', item.tone)}>
                <item.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-mx-3xl">
        {/* Main Input Section */}
        <div className="lg:col-span-8 space-y-mx-lg">
          
          {/* SECTION 1: PRODUÇÃO DE ONTEM (D-1) */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-mx-lg border-b border-border-subtle bg-gray-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg"><Car size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Produção de Ontem</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendas e Fluxo Realizado (D-1)</p>
                </div>
              </div>
              <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black tracking-widest">MÉTRICAS RETROATIVAS</Badge>
            </div>

            <div className="p-8 md:p-10 space-y-10">
              {/* Sales Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { label: 'Porta / Showroom', field: 'vnd_porta', icon: MapPin },
                  { label: 'Carteira / CRM', field: 'vnd_cart', icon: User },
                  { label: 'Internet / Digital', field: 'vnd_net', icon: Globe },
                ].map((input) => (
                  <div key={input.field} className="flex flex-col gap-4 p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] group/input hover:bg-white hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <input.icon size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{input.label}</span>
                    </div>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={form[input.field as keyof CheckinFormData]} 
                      onChange={e => updateField(input.field as keyof CheckinFormData, e.target.value.replace(/\D/g, ''))} 
                      className="w-full bg-transparent text-6xl font-black font-mono-numbers text-slate-950 text-center focus:outline-none tracking-tighter" 
                    />
                    <div className="flex justify-center gap-3">
                      <button onClick={() => decrement(input.field as keyof CheckinFormData)} className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm">-</button>
                      <button onClick={() => increment(input.field as keyof CheckinFormData)} className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-gray-100 pt-10">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-inner">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Leads</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Ontem</p>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={form.leads} 
                    onChange={e => updateField('leads', e.target.value.replace(/\D/g, ''))} 
                    className="w-16 bg-transparent text-3xl font-black font-mono-numbers text-slate-950 text-right focus:outline-none" 
                  />
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Agend. Ontem</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Meta de Ontem</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={form.agd_cart_prev + form.agd_net_prev} 
                      readOnly
                      className="w-16 bg-transparent text-3xl font-black font-mono-numbers text-slate-950 text-right focus:outline-none opacity-50" 
                    />
                    <div className="flex gap-2">
                      <input placeholder="C" value={form.agd_cart_prev} onChange={e => updateField('agd_cart_prev', e.target.value.replace(/\D/g, ''))} className="w-8 text-[10px] font-black text-right border-b border-gray-200 focus:outline-none" />
                      <input placeholder="I" value={form.agd_net_prev} onChange={e => updateField('agd_net_prev', e.target.value.replace(/\D/g, ''))} className="w-8 text-[10px] font-black text-right border-b border-gray-200 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Visitas</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Showroom Ontem</p>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={form.visitas} 
                    onChange={e => updateField('visitas', e.target.value.replace(/\D/g, ''))} 
                    className="w-16 bg-transparent text-3xl font-black font-mono-numbers text-slate-950 text-right focus:outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: AGENDAMENTOS DE HOJE (D-0) */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-mx-lg border-b border-border-subtle bg-amber-50/30 flex items-center justify-between">
              <div className="flex items-center gap-mx-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><Clock size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Agendamentos de Hoje</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compromissos Agendados para D-0</p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white border-none text-[8px] font-black tracking-widest">PRÓXIMAS HORAS</Badge>
            </div>

            <div className="p-8 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-amber-600 flex items-center justify-center shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Carteira / CRM</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Base de Clientes</p>
                  </div>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  value={form.agd_cart} 
                  onChange={e => updateField('agd_cart', e.target.value.replace(/\D/g, ''))} 
                  className="w-16 bg-transparent text-3xl font-black font-mono-numbers text-slate-950 text-right focus:outline-none" 
                />
              </div>

              <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-amber-600 flex items-center justify-center shadow-sm">
                    <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950 uppercase tracking-tight">Internet / Digital</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Novos Leads</p>
                  </div>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  value={form.agd_net} 
                  onChange={e => updateField('agd_net', e.target.value.replace(/\D/g, ''))} 
                  className="w-16 bg-transparent text-3xl font-black font-mono-numbers text-slate-950 text-right focus:outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-mx-lg">
          <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] -mr-24 -mt-24" />
            <div className="relative z-10">
              <div className="flex items-center gap-mx-sm mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-inner"><MessageCircle size={24} className="text-amber-400" /></div>
                <h3 className="text-xl font-black uppercase tracking-tight">Pitch de Ativação</h3>
              </div>
              <p className="text-lg font-bold text-white/80 leading-relaxed italic mb-10">"O foco de hoje deve ser o valor da avaliação do usado. É o nosso maior fechador de vendas no momento."</p>
              <button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                Ver Scripts MX <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-slate-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight">Observações</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Justificativas e Notas</p>
              </div>
            </div>
            
            <textarea 
              value={form.note}
              onChange={e => updateField('note', e.target.value)}
              placeholder="Descreva observações relevantes do dia anterior ou justificativa para números zerados..."
              className="w-full h-40 bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm font-bold text-slate-600 focus:outline-none focus:border-indigo-200 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
