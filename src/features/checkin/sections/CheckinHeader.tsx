import { useMemo, useState } from 'react'
import { CalendarDays, History, X, ArrowLeft, Send, Users, Globe, CalendarClock, DollarSign } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { supabase } from '@/lib/supabase'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'
import { toast } from 'sonner'
import type { DailyCheckin } from '@/types/database'
import { addDaysDateOnly } from '../lib/crm-derived-totals'

interface PillarProgress {
  key: string
  label: string
  filled: boolean
}

interface CheckinHeaderProps {
  dateStr: string
  pillars: PillarProgress[]
  setCustomReferenceDate: (value: string) => void
  handleExit: () => void
  historyOpen: boolean
  setHistoryOpen: (open: boolean) => void
  checkins?: DailyCheckin[]
  userId?: string
  saveCheckin: (
    formData: any,
    scope?: any,
    customDate?: string
  ) => Promise<{ error: string | null }>
}

const ADJUSTMENT_REASONS = [
  'Correção de registro',
  'Inclusão de dado',
  'Ajuste de contagem',
  'Erro operacional',
  'Duplicidade removida',
  'Fechamento esquecido',
  'Outro',
]

export function CheckinHeader({
  dateStr,
  pillars,
  setCustomReferenceDate,
  historyOpen,
  setHistoryOpen,
  checkins = [],
  userId = 'vendedor',
  saveCheckin,
}: CheckinHeaderProps) {
  const filledCount = pillars.filter(p => p.filled).length
  const { requestCorrection, loading: auditorLoading } = useCheckinAuditor()

  const [activeView, setActiveView] = useState<'list' | 'form'>('list')
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [formValues, setFormValues] = useState({
    leads_cart: 0,
    leads_net: 0,
    visitas_porta: 0,
    visitas_cart: 0,
    visitas_net: 0,
    agd_cart: 0,
    agd_net: 0,
    vnd_porta: 0,
    vnd_cart: 0,
    vnd_net: 0,
    reason: '',
    note: '',
  })

  // Generate last 7 days of history (starting from yesterday backwards)
  const historyRows = useMemo(() => {
    const list = []
    const spString = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    const todaySP = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(spString))

    for (let i = 1; i <= 7; i++) {
      const date = addDaysDateOnly(todaySP, -i)
      const checkin = checkins.find(c => c.reference_date === date)

      if (checkin) {
        // Read sales count (merge localStorage & DB)
        let salesCount = 0
        const localClients = localStorage.getItem(`mx-checkin-clientes:${userId}:${date}`)
        if (localClients) {
          try {
            salesCount = JSON.parse(localClients).filter((c: any) => c.vendaRealizada === 'Sim').length
          } catch {
            salesCount = (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
          }
        } else {
          salesCount = (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
        }

        // Read discipline score
        const score = localStorage.getItem(`mx-checkin-score:${userId}:${date}`) || '70'

        // Formatted time
        const formattedTime = new Date(checkin.submitted_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        const leads = checkin.leads_prev_day || 0
        const atend = checkin.visit_prev_day || 0
        const agend = (checkin.agd_cart_today || 0) + (checkin.agd_net_today || 0)

        list.push({
          date,
          finalized: true,
          status: 'Finalizado',
          score: score.includes('%') ? score : `${score}%`,
          time: formattedTime,
          sales: salesCount,
          leads,
          atend,
          agend,
          vendas: salesCount,
        })
      } else {
        list.push({
          date,
          finalized: false,
          status: 'Pendente de Fechamento',
          score: '—',
          time: '—',
          sales: 0,
          leads: 0,
          atend: 0,
          agend: 0,
          vendas: 0,
        })
      }
    }
    return list
  }, [checkins, userId])

  const handleSelectRow = (row: any) => {
    setSelectedRow(row)
    if (row.finalized) {
      const checkin = checkins.find(c => c.reference_date === row.date)
      if (checkin) {
        setFormValues({
          leads_cart: checkin.leads_prev_day || 0,
          leads_net: 0,
          visitas_porta: checkin.visit_prev_day || 0,
          visitas_cart: 0,
          visitas_net: 0,
          agd_cart: checkin.agd_cart_today || 0,
          agd_net: checkin.agd_net_today || 0,
          vnd_porta: checkin.vnd_porta_prev_day || 0,
          vnd_cart: checkin.vnd_cart_prev_day || 0,
          vnd_net: checkin.vnd_net_prev_day || 0,
          reason: '',
          note: '',
        })
      } else {
        setFormValues({
          leads_cart: 0, leads_net: 0,
          visitas_porta: 0, visitas_cart: 0, visitas_net: 0,
          agd_cart: 0, agd_net: 0,
          vnd_porta: 0, vnd_cart: 0, vnd_net: 0,
          reason: '', note: '',
        })
      }
    } else {
      setFormValues({
        leads_cart: 0, leads_net: 0,
        visitas_porta: 0, visitas_cart: 0, visitas_net: 0,
        agd_cart: 0, agd_net: 0,
        vnd_porta: 0, vnd_cart: 0, vnd_net: 0,
        reason: '', note: '',
      })
    }
    setActiveView('form')
  }

  const handleFieldChange = (field: string, val: number) => {
    setFormValues(prev => ({
      ...prev,
      [field]: Math.max(0, Math.floor(val)),
    }))
  }

  const handleSubmitCorrection = async () => {
    if (!selectedRow) return
    if (!formValues.reason) {
      toast.error('Por favor, selecione o motivo da alteração.')
      return
    }
    if (!formValues.note.trim()) {
      toast.error('Por favor, descreva as observações operacionais do ajuste.')
      return
    }
    if (formValues.reason === 'Outro' && formValues.note.trim().length < 15) {
      toast.error('Para o motivo "Outro", forneça uma justificativa detalhada de pelo menos 15 caracteres.')
      return
    }

    try {
      let checkinId = ''
      
      if (selectedRow.finalized) {
        const existing = checkins.find(c => c.reference_date === selectedRow.date)
        if (existing) {
          checkinId = existing.id
        }
      }
      
      // If no checkin exists (Pendente), create a placeholder checkin first
      if (!checkinId) {
        const placeholderPayload = {
          leads: 0,
          leads_cart: 0,
          leads_net: 0,
          agd_cart_prev: 0,
          agd_net_prev: 0,
          agd_cart: 0,
          agd_net: 0,
          vnd_porta: 0,
          vnd_cart: 0,
          vnd_net: 0,
          visitas: 0,
          visitas_porta: 0,
          visitas_cart: 0,
          visitas_net: 0,
          note: 'Lançamento retroativo criado para aprovação',
          zero_reason: 'Outro',
        }
        
        const res = await saveCheckin(placeholderPayload, 'historical', selectedRow.date)
        if (res.error) {
          toast.error(`Erro ao iniciar regularização: ${res.error}`)
          return
        }
        
        // Fetch newly created checkin ID
        const { data: checkinData, error: fetchError } = await supabase
          .from('lancamentos_diarios')
          .select('id')
          .eq('seller_user_id', userId)
          .eq('reference_date', selectedRow.date)
          .single()
          
        if (fetchError || !checkinData) {
          toast.error('Erro ao buscar identificador do fechamento.')
          return
        }
        checkinId = checkinData.id
      }
      
      // Build the requested values payload
      const requestedValues = {
        reference_date: selectedRow.date,
        leads: Number(formValues.leads_cart) + Number(formValues.leads_net),
        leads_cart: Number(formValues.leads_cart),
        leads_net: Number(formValues.leads_net),
        visitas: Number(formValues.visitas_porta) + Number(formValues.visitas_cart) + Number(formValues.visitas_net),
        visitas_porta: Number(formValues.visitas_porta),
        visitas_cart: Number(formValues.visitas_cart),
        visitas_net: Number(formValues.visitas_net),
        agd_cart: Number(formValues.agd_cart),
        agd_net: Number(formValues.agd_net),
        agd_cart_prev_day: 0,
        agd_net_prev_day: 0,
        agd_cart_today: Number(formValues.agd_cart),
        agd_net_today: Number(formValues.agd_net),
        vnd_porta_prev_day: Number(formValues.vnd_porta),
        vnd_cart_prev_day: Number(formValues.vnd_cart),
        vnd_net_prev_day: Number(formValues.vnd_net),
        visit_prev_day: Number(formValues.visitas_porta) + Number(formValues.visitas_cart) + Number(formValues.visitas_net),
        zero_reason: (Number(formValues.leads_cart) + Number(formValues.leads_net) + Number(formValues.visitas_porta) + Number(formValues.visitas_cart) + Number(formValues.visitas_net) + Number(formValues.agd_cart) + Number(formValues.agd_net) + Number(formValues.vnd_porta) + Number(formValues.vnd_cart) + Number(formValues.vnd_net) === 0) ? 'Outro' : undefined,
        note: formValues.note,
      }
      
      const res = await requestCorrection(checkinId, requestedValues, `${formValues.reason}: ${formValues.note}`)
      if (res.error) {
        toast.error(`Erro ao enviar solicitação: ${res.error}`)
      } else {
        toast.success(selectedRow.finalized ? 'Solicitação de correção enviada ao gestor!' : 'Lançamento retroativo enviado para aprovação do gestor!')
        setActiveView('list')
      }
    } catch (err) {
      toast.error('Erro inesperado ao processar solicitação.')
      console.error(err)
    }
  }

  return (
    <header className="shrink-0 pb-4 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#111827]">
            FECHAMENTO DIÁRIO
          </h1>

          <div className="inline-flex h-9 items-center gap-2 rounded-full border border-[#e5eaf2] bg-white px-4 text-sm font-semibold text-[#475569] shadow-sm">
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span>{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveView('list')
              setHistoryOpen(true)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5eaf2] bg-white px-5 text-sm font-bold text-[#334155] shadow-sm hover:bg-[#f8fafc] transition-colors"
          >
            <History size={14} />
            Histórico
          </button>
        </div>
      </div>

      {/* Progress Bar and Pillar Badges */}
      <div className="w-full bg-white rounded-2xl border border-[#e5eaf2] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#94a3b8]">Progresso do Lançamento</span>
            <h2 className="text-sm font-bold text-[#111827] mt-0.5">
              {filledCount === 4 
                ? 'Todos os pilares preenchidos!' 
                : `${filledCount} de 4 pilares preenchidos`}
            </h2>
          </div>
          <span className="text-2xl font-black text-[#2563eb] tabular-nums">
            {Math.round((filledCount / 4) * 100)}%
          </span>
        </div>

        {/* Progress bar container */}
        <div className="h-3 w-full bg-[#f1f5f9] rounded-full overflow-hidden flex gap-0.5">
          {pillars.map((p) => (
            <div
              key={p.key}
              className={`h-full flex-1 transition-all duration-500 ${
                p.filled 
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] shadow-[0_0_8px_rgba(37,99,235,0.3)]' 
                  : 'bg-[#e2e8f0]'
              }`}
            />
          ))}
        </div>

        {/* Pillars status badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {pillars.map((p) => (
            <div
              key={p.key}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-300 ${
                p.filled
                  ? 'bg-[#ecfdf5] border-[#bbf7d0] text-[#16a34a] shadow-sm'
                  : 'bg-white border-[#e5eaf2] text-[#94a3b8]'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  p.filled 
                    ? 'bg-[#16a34a] animate-pulse' 
                    : 'bg-[#cbd5e1]'
                }`}
              />
              <span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico de Fechamentos Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 backdrop-blur-[3px] p-4" role="dialog" aria-modal="true" aria-label="Histórico de Fechamentos">
          <div className="w-full max-w-2xl rounded-2xl border border-[#e5eaf2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] overflow-hidden flex flex-col max-h-[90vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <header className="px-6 py-5 border-b border-[#eef2f7] flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight">
                  {activeView === 'list' ? 'Histórico de Fechamentos' : 'Regularizar Lançamento'}
                </h2>
                <p className="text-xs font-semibold text-[#64748b] mt-1">
                  {activeView === 'list' 
                    ? 'Visualize ou regularize seus fechamentos operacionais dos últimos 7 dias.' 
                    : `Data de referência operacional: ${selectedRow?.date.split('-').reverse().join('/')}`
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryOpen(false)
                  setActiveView('list')
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              
              {activeView === 'list' ? (
                /* --- LIST VIEW (Rounded Cards matching Mockup) --- */
                <div className="flex flex-col gap-3">
                  {historyRows.map(row => {
                    const dateObj = new Date(row.date + 'T12:00:00')
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                    const weekdayFormatted = weekday.charAt(0).toUpperCase() + weekday.slice(1, 3)

                    return (
                      <div
                        key={row.date}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-2xl transition-all ${
                          row.finalized
                            ? 'border-[#e2e8f0] bg-[#f8fafc]/80'
                            : 'border-[#fecaca] bg-[#fef2f2]/60'
                        }`}
                      >
                        {/* Left Side: Date & Icon */}
                        <div className="flex items-center gap-3">
                          <div className={`grid h-9 w-9 place-items-center rounded-xl ${
                            row.finalized ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-[#fef2f2] text-[#ef4444]'
                          }`}>
                            <CalendarClock size={18} />
                          </div>
                          <div>
                            <span className="font-extrabold text-[#111827] text-sm">{formattedDate}</span>
                            <span className="text-[#94a3b8] text-xs font-bold ml-2 uppercase tracking-wide">{weekdayFormatted}</span>
                          </div>
                        </div>

                        {/* Right Side: Status/Metrics & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 flex-wrap">
                          {row.finalized ? (
                            <>
                              {/* Metrics */}
                              <div className="flex items-center gap-3 text-xs flex-wrap">
                                <div>
                                  <span className="text-[#2563eb] font-black">{row.leads}</span>{' '}
                                  <span className="text-[#64748b] font-semibold">leads</span>
                                </div>
                                <div className="h-3 w-px bg-slate-200" />
                                <div>
                                  <span className="text-[#7c3aed] font-black">{row.atend}</span>{' '}
                                  <span className="text-[#64748b] font-semibold">atend.</span>
                                </div>
                                <div className="h-3 w-px bg-slate-200" />
                                <div>
                                  <span className="text-[#ea580c] font-black">{row.agend}</span>{' '}
                                  <span className="text-[#64748b] font-semibold">agend.</span>
                                </div>
                                <div className="h-3 w-px bg-slate-200" />
                                <div>
                                  <span className="text-[#16a34a] font-black">{row.vendas}</span>{' '}
                                  <span className="text-[#64748b] font-semibold">vendas</span>
                                </div>
                              </div>
                              {/* Action to correct */}
                              <button
                                type="button"
                                onClick={() => handleSelectRow(row)}
                                className="inline-flex h-7 items-center justify-center rounded-lg border border-[#e5eaf2] bg-white px-3 text-[10px] font-black text-[#2563eb] hover:bg-[#eff6ff] transition-colors shadow-sm cursor-pointer"
                              >
                                Ajustar
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Pending Badge */}
                              <span className="inline-flex items-center rounded-full bg-[#fef2f2] border border-[#fecaca] px-2.5 py-0.5 text-[10px] font-extrabold text-[#ef4444]">
                                Pendente de Fechamento
                              </span>
                              {/* Action to regularize */}
                              <button
                                type="button"
                                onClick={() => handleSelectRow(row)}
                                className="text-[#2563eb] font-black hover:underline text-xs cursor-pointer"
                              >
                                Regularizar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* --- FORM VIEW (CORRECTION / LATE CLOSING FORM) --- */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Leads Pillar */}
                    <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-[#eef2f7] pb-2">
                        <Users size={16} className="text-[#2563eb]" />
                        <h3 className="text-xs font-black uppercase text-[#475569] tracking-wider">1. Leads Recebidos</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.leads_cart}
                            onChange={(e) => handleFieldChange('leads_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Internet</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.leads_net}
                            onChange={(e) => handleFieldChange('leads_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Atendimentos Pillar */}
                    <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-[#eef2f7] pb-2">
                        <Globe size={16} className="text-[#2563eb]" />
                        <h3 className="text-xs font-black uppercase text-[#475569] tracking-wider">2. Atendimentos</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Porta</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_porta}
                            onChange={(e) => handleFieldChange('visitas_porta', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_cart}
                            onChange={(e) => handleFieldChange('visitas_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Internet</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_net}
                            onChange={(e) => handleFieldChange('visitas_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Agendamentos Pillar */}
                    <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-[#eef2f7] pb-2">
                        <CalendarClock size={16} className="text-[#2563eb]" />
                        <h3 className="text-xs font-black uppercase text-[#475569] tracking-wider">3. Agend. p/ Amanhã</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.agd_cart}
                            onChange={(e) => handleFieldChange('agd_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#94a3b8] uppercase">Internet</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.agd_net}
                            onChange={(e) => handleFieldChange('agd_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vendas Pillar */}
                    <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-[#eef2f7] pb-2">
                        <DollarSign size={16} className="text-[#2563eb]" />
                        <h3 className="text-xs font-black uppercase text-[#475569] tracking-wider">4. Vendas</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Porta</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_porta}
                            onChange={(e) => handleFieldChange('visitas_porta', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_cart}
                            onChange={(e) => handleFieldChange('visitas_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-[#94a3b8] uppercase">Internet</label>
                          <input
                            type="number"
                            min="0"
                            value={formValues.visitas_net}
                            onChange={(e) => handleFieldChange('visitas_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Justification and Notes */}
                  <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider">
                        Motivo do Ajuste
                      </label>
                      <select
                        value={formValues.reason}
                        onChange={(e) => setFormValues(prev => ({ ...prev, reason: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-[#e5eaf2] bg-white px-3 text-xs font-semibold text-[#111827] outline-none focus:border-[#2563eb]"
                      >
                        <option value="">Selecione o motivo...</option>
                        {ADJUSTMENT_REASONS.map(reason => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider">
                        Observações Operacionais (Justificativa)
                      </label>
                      <textarea
                        value={formValues.note}
                        onChange={(e) => setFormValues(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Descreva detalhadamente o motivo deste ajuste retroativo..."
                        className="min-h-[80px] w-full resize-none rounded-xl border border-[#e5eaf2] bg-white p-3 text-xs text-[#111827] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb]"
                        maxLength={250}
                      />
                      <span className="text-[10px] text-right text-[#94a3b8] font-mono">
                        {formValues.note.length}/250 caracteres
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <footer className="px-6 py-4 border-t border-[#eef2f7] flex justify-between items-center bg-[#f8fafc]">
              {activeView === 'list' ? (
                <>
                  <span />
                  <Button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className="h-10 px-5 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-sm transition-colors"
                  >
                    Fechar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => setActiveView('list')}
                    className="h-10 px-4 text-xs font-bold border border-[#e5eaf2] bg-white hover:bg-slate-50 text-[#475569] rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft size={14} /> Voltar
                  </Button>
                  <Button
                    type="button"
                    disabled={auditorLoading}
                    onClick={handleSubmitCorrection}
                    className="h-10 px-5 text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Send size={14} /> {selectedRow?.finalized ? 'Enviar Correção' : 'Enviar p/ Aprovação'}
                  </Button>
                </>
              )}
            </footer>

          </div>
        </div>
      )}
    </header>
  )
}
