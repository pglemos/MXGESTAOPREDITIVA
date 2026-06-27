import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, History, X, ArrowLeft, Send, Users, Globe, CalendarClock, DollarSign } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { supabase } from '@/lib/supabase'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'
import { toast } from 'sonner'
import type { DailyCheckin } from '@/types/database'
import { addDaysDateOnly } from '../lib/crm-derived-totals'
import { isRegularizacaoBloqueada } from '../lib/regularizacao-lock'

interface PillarProgress {
  key: string
  label: string
  filled: boolean
}

interface CheckinHeaderProps {
dateStr: string
pillars: PillarProgress[]
totalAgendamentosD1?: number
creditosValidos?: number
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
totalAgendamentosD1 = 0,
creditosValidos = 0,
setCustomReferenceDate,
historyOpen,
setHistoryOpen,
  checkins = [],
  userId = 'vendedor',
  saveCheckin,
  ..._props
}: CheckinHeaderProps) {
  const { requestCorrection, loading: auditorLoading } = useCheckinAuditor()

  const [activeView, setActiveView] = useState<'list' | 'form'>('list')
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  // Trava de regularização (Especificação Funcional §22 / EV-1.9): um
  // "Pendente de Fechamento" só fica editável depois que o gerente liberar
  // — mesma fonte (`fechamento_liberacoes`) que o fluxo principal usa.
  const [liberacaoStatus, setLiberacaoStatus] = useState<'none' | 'pendente' | 'liberado'>('none')
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

        // Disciplina (EV-1.5): valor oficial persistido pelo servidor em
        // lancamentos_diarios.pontuacao_disciplina_final. Fallback para
        // localStorage só para lançamentos antigos (pré EV-1.5) que não têm
        // o campo preenchido.
        const score = checkin.pontuacao_disciplina_final != null
          ? String(Math.round(checkin.pontuacao_disciplina_final))
          : localStorage.getItem(`mx-checkin-score:${userId}:${date}`) || '70'

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

  // Busca a liberação real (EV-1.6) para o dia selecionado — só importa
  // quando o item é "Pendente de Fechamento" (row.finalized === false);
  // um dia já finalizado não precisa de liberação para ser corrigido.
  useEffect(() => {
    if (!selectedRow || selectedRow.finalized) {
      setLiberacaoStatus('none')
      return
    }
    let cancelled = false
    supabase
      .from('fechamento_liberacoes')
      .select('status')
      .eq('vendedor_id', userId)
      .eq('data_fechamento', selectedRow.date)
      .order('data_hora_solicitacao', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setLiberacaoStatus(data?.status === 'liberado' ? 'liberado' : data?.status === 'pendente' ? 'pendente' : 'none')
      })
    return () => { cancelled = true }
  }, [selectedRow, userId])

  const regularizacaoBloqueada = isRegularizacaoBloqueada({
    rowSelected: Boolean(selectedRow),
    rowFinalized: Boolean(selectedRow?.finalized),
    liberacaoStatus,
  })

  const handleFieldChange = (field: string, val: number) => {
    setFormValues(prev => ({
      ...prev,
      [field]: Math.max(0, Math.floor(val)),
    }))
  }

  const handleSubmitCorrection = async () => {
    if (!selectedRow) return
    if (regularizacaoBloqueada) {
      toast.error('Solicite a liberação do gerente antes de regularizar este fechamento.')
      return
    }
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

const completedPillars = pillars.filter((pillar) => pillar.filled).length
const baseReady = completedPillars >= 3
const safeTotalAgendamentosD1 = Math.max(0, Number(totalAgendamentosD1) || 0)
const safeCreditosValidos = Math.max(0, Number(creditosValidos) || 0)
const detailRatio = safeTotalAgendamentosD1 > 0 ? Math.min(1, safeCreditosValidos / safeTotalAgendamentosD1) : baseReady ? 1 : 0
const detailsComplete = baseReady && detailRatio >= 1
const activeStep = baseReady ? 4 : Math.min(3, Math.max(1, completedPillars + 1))
const progressPercent = baseReady
? detailsComplete
? 100
: Math.min(99, 70 + Math.round(detailRatio * 30))
: Math.min(70, completedPillars * 20)
const stepItems = [
{ step: 1, label: 'Showroom', percent: 20, done: completedPillars >= 1 },
{ step: 2, label: 'Carteira', percent: 20, done: completedPillars >= 2 },
{ step: 3, label: 'Internet', percent: 30, done: baseReady },
{ step: 4, label: 'Vendas / Agendamentos', percent: 30, done: detailsComplete },
]
const activeStepLabel = stepItems.find((item) => item.step === activeStep)?.label ?? 'Internet'

return (
<header className="relative z-40 -mx-mx-sm shrink-0 space-y-3 border-b border-border-default/60 bg-surface-alt px-mx-sm pb-3 pt-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:-mx-mx-md sm:px-mx-md md:sticky md:top-0 md:pt-3 2xl:-mx-mx-lg 2xl:px-mx-lg">
      {/* Top Header Row */}
<div className="hidden flex-wrap items-center justify-between gap-2 md:flex md:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="min-w-0 truncate text-[20px] font-extrabold tracking-tight text-[#111827] sm:text-[26px]">
            FECHAMENTO DIÁRIO
          </h1>

          <div className="inline-flex h-8 max-w-full items-center gap-2 rounded-full border border-[#e5eaf2] bg-white px-3 text-xs font-semibold text-[#475569] shadow-sm sm:h-9 sm:px-4 sm:text-sm">
            <CalendarDays size={14} className="text-[#2563eb]" />
            <span className="truncate">{dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveView('list')
              setHistoryOpen(true)
            }}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5eaf2] bg-white px-4 text-sm font-bold text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc] sm:h-10 sm:px-5"
          >
            <History size={14} />
            Histórico
          </button>
        </div>
      </div>


<div className="space-y-3 md:hidden">
<div className="flex justify-center">
<button
type="button"
onClick={() => setCustomReferenceDate('')}
className="inline-flex h-10 max-w-full items-center gap-2 rounded-full border border-[#e5eaf2] bg-white px-4 text-[14px] font-black text-[#111827] shadow-sm"
>
<CalendarDays size={16} className="text-[#0b63f6]" />
<span className="truncate">{dateStr}</span>
</button>
</div>

<section className="rounded-[16px] border border-[#e5eaf2] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
<div className="flex items-start justify-between gap-4">
<div>
<div className="flex items-center gap-1.5">
<p className="text-[16px] font-black tracking-tight text-[#111827]">Progresso do Fechamento</p>
<span className="grid h-5 w-5 place-items-center rounded-full border border-[#94a3b8] text-[12px] font-black text-[#64748b]">i</span>
</div>
<p className="mt-3 text-[13px] font-bold text-[#334155]">
Etapa {activeStep} de 4 <span className="text-[#94a3b8]">•</span> <span className="text-[#0b63f6]">{activeStepLabel}</span>
</p>
</div>
<div className="text-right">
<p className="text-[31px] font-black leading-none text-[#0b63f6]">{progressPercent}%</p>
<p className="mt-1 text-[12px] font-semibold text-[#94a3b8]">preenchido</p>
</div>
</div>
<div className="mt-4 h-3 rounded-full bg-[#e5e7eb]">
<div className="h-full rounded-full bg-[#0b63f6]" style={{ width: `${progressPercent}%` }} />
</div>
</section>

<section className="grid grid-cols-4 overflow-hidden rounded-[16px] border border-[#e5eaf2] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
{stepItems.map((item) => {
const active = item.step === activeStep
return (
<div key={item.step} className="flex min-w-0 flex-col items-center gap-1 border-r border-[#eef2f7] px-2 py-3 text-center last:border-r-0">
<span className={item.done ? 'grid h-8 w-8 place-items-center rounded-full bg-[#34c759] text-[15px] font-black text-white' : active ? 'grid h-8 w-8 place-items-center rounded-full bg-[#0b63f6] text-[14px] font-black text-white' : 'grid h-8 w-8 place-items-center rounded-full border border-[#94a3b8] text-[14px] font-black text-[#64748b]'}>
{item.done ? '✓' : item.step}
</span>
<span className={active ? 'max-w-full text-[11px] font-black leading-tight text-[#0b63f6]' : 'max-w-full text-[11px] font-bold leading-tight text-[#111827]'}>
{item.step}. {item.label}
</span>
<span className={active ? 'text-[11px] font-black text-[#0b63f6]' : 'text-[11px] font-semibold text-[#64748b]'}>
{item.percent}%
</span>
</div>
)
})}
</section>
</div>

{/* Histórico de Fechamentos Modal */}
{historyOpen && (
<div className="fixed inset-0 z-[140] grid place-items-center bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-label="Histórico de Fechamentos">
<div className="flex max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#e5eaf2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] transition-all animate-in fade-in zoom-in-95 duration-200">
            
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
                            {row.finalized && row.time && row.time !== '—' && (
                              <span className="text-[#64748b] text-xs font-bold ml-2">
                                · {row.time}
                              </span>
                            )}
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
                  {!selectedRow?.finalized && (
                    regularizacaoBloqueada ? (
                      <div className="rounded-xl border border-status-error/30 bg-status-error-surface p-4 text-sm font-bold text-status-error">
                        Prazo encerrado às 09h30. Solicite liberação ao seu gerente para finalizar este fechamento. Os campos abaixo ficam bloqueados até a liberação.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-status-success/30 bg-status-success-surface p-4 text-sm font-bold text-status-success">
                        Fechamento liberado pelo gerente. Ao enviar, será aplicada penalização de 10% por atraso.
                      </div>
                    )
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Leads Pillar */}
                    <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-[#eef2f7] pb-2">
                        <Users size={16} className="text-[#2563eb]" />
                        <h3 className="text-xs font-black uppercase text-[#475569] tracking-wider">1. Leads Recebidos</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="adjustment-leads-cart" className="text-[10px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                            <input
                              id="adjustment-leads-cart"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.leads_cart}
                            onChange={(e) => handleFieldChange('leads_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-leads-net" className="text-[10px] font-bold text-[#94a3b8] uppercase">Internet</label>
                            <input
                              id="adjustment-leads-net"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.leads_net}
                            onChange={(e) => handleFieldChange('leads_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
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
                            <label htmlFor="adjustment-visitas-porta" className="text-[9px] font-bold text-[#94a3b8] uppercase">Porta</label>
                            <input
                              id="adjustment-visitas-porta"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.visitas_porta}
                            onChange={(e) => handleFieldChange('visitas_porta', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-visitas-cart" className="text-[9px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                            <input
                              id="adjustment-visitas-cart"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.visitas_cart}
                            onChange={(e) => handleFieldChange('visitas_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-visitas-net" className="text-[9px] font-bold text-[#94a3b8] uppercase">Internet</label>
                            <input
                              id="adjustment-visitas-net"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.visitas_net}
                            onChange={(e) => handleFieldChange('visitas_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
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
                            <label htmlFor="adjustment-agd-cart" className="text-[10px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                            <input
                              id="adjustment-agd-cart"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.agd_cart}
                            onChange={(e) => handleFieldChange('agd_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-agd-net" className="text-[10px] font-bold text-[#94a3b8] uppercase">Internet</label>
                            <input
                              id="adjustment-agd-net"
                              type="number"
                            min="0"
                            disabled={regularizacaoBloqueada}
                            value={formValues.agd_net}
                            onChange={(e) => handleFieldChange('agd_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-3 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
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
                            <label htmlFor="adjustment-vnd-porta" className="text-[9px] font-bold text-[#94a3b8] uppercase">Porta</label>
                            <input
                              id="adjustment-vnd-porta"
                              type="number"
                              min="0"
                            disabled={regularizacaoBloqueada}
                              value={formValues.vnd_porta}
                              onChange={(e) => handleFieldChange('vnd_porta', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-vnd-cart" className="text-[9px] font-bold text-[#94a3b8] uppercase">Carteira</label>
                            <input
                              id="adjustment-vnd-cart"
                              type="number"
                              min="0"
                            disabled={regularizacaoBloqueada}
                              value={formValues.vnd_cart}
                              onChange={(e) => handleFieldChange('vnd_cart', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                        <div>
                            <label htmlFor="adjustment-vnd-net" className="text-[9px] font-bold text-[#94a3b8] uppercase">Internet</label>
                            <input
                              id="adjustment-vnd-net"
                              type="number"
                              min="0"
                            disabled={regularizacaoBloqueada}
                              value={formValues.vnd_net}
                              onChange={(e) => handleFieldChange('vnd_net', Number(e.target.value))}
                            className="mt-1 h-9 w-full rounded-lg border border-[#e5eaf2] bg-white px-2 text-center text-xs font-bold outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Justification and Notes */}
                  <div className="border border-[#e5eaf2] rounded-xl p-4 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="adjustment-reason" className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider">
                        Motivo do Ajuste
                      </label>
                      <select
                        id="adjustment-reason"
                        value={formValues.reason}
                        disabled={regularizacaoBloqueada}
                        onChange={(e) => setFormValues(prev => ({ ...prev, reason: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-[#e5eaf2] bg-white px-3 text-xs font-semibold text-[#111827] outline-none focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
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
                      <label htmlFor="adjustment-note" className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider">
                        Observações Operacionais (Justificativa)
                      </label>
                      <textarea
                        id="adjustment-note"
                        value={formValues.note}
                        disabled={regularizacaoBloqueada}
                        onChange={(e) => setFormValues(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Descreva detalhadamente o motivo deste ajuste retroativo..."
                        className="min-h-[80px] w-full resize-none rounded-xl border border-[#e5eaf2] bg-white p-3 text-xs text-[#111827] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#94a3b8]"
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
                    disabled={auditorLoading || regularizacaoBloqueada}
                    onClick={handleSubmitCorrection}
                    className={`h-10 px-5 text-xs font-bold text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5 ${
                      regularizacaoBloqueada
                        ? 'bg-status-error cursor-not-allowed opacity-80'
                        : 'bg-[#16a34a] hover:bg-[#15803d]'
                    }`}
                  >
                    <Send size={14} /> {regularizacaoBloqueada ? 'Aguardando liberação do gerente' : selectedRow?.finalized ? 'Enviar Correção' : 'Enviar p/ Aprovação'}
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
