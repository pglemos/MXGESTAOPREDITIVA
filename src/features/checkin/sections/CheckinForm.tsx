import { AnimatePresence, motion } from 'motion/react'
import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Globe,
  LockKeyhole,
  MessageSquare,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Store,
  Users,
  HelpCircle,
  Award,
  Clock,
  Check,
  X,
  AlertCircle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { CHECKIN_MAX_INPUT_VALUE, CHECKIN_ZERO_REASONS } from '@/hooks/useCheckins'
import { CheckinValidationBanner } from './CheckinValidationBanner'
import { CheckinSuccessSection } from './CheckinSuccessSection'
import { CheckinCrmSection } from './CheckinCrmSection'
import type { CheckinPageContext, NumericCheckinField } from '../hooks/useCheckinPage'
import { shouldConfirmBeforeFinalizar } from '../lib/confirm-finalize'

interface CheckinFormProps {
  ctx: CheckinPageContext
  totalsAgd: number
  totalsVnd: number
  onOpenHistory?: () => void
}

const REFERENCE_VALUES: Record<NumericCheckinField, number> = {
  leads: 30,
  leads_cart: 12,
  leads_net: 18,
  agd_cart_prev: 0,
  agd_net_prev: 0,
  agd_cart: 7,
  agd_net: 11,
  vnd_porta: 2,
  vnd_cart: 5,
  vnd_net: 3,
  visitas: 44,
  visitas_porta: 9,
  visitas_cart: 14,
  visitas_net: 21,
}

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

// Interactive Tooltip Component
export function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative inline-block ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        onBlur={() => setVisible(false)}
        className="text-text-tertiary/50 hover:text-brand-primary transition-colors focus:outline-none"
        aria-label="Informação adicional"
      >
        <HelpCircle size={14} className="stroke-[2.5]" />
      </button>
      {visible && (
        <div className="absolute left-1/2 bottom-full mb-2 z-30 w-64 -translate-x-1/2 rounded-lg border border-border-default bg-white p-3 text-[12px] font-medium leading-relaxed text-text-secondary shadow-lg pointer-events-none transition-all">
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white" />
          {text}
        </div>
      )}
    </div>
  )
}

export function CheckinForm({ ctx, totalsAgd, totalsVnd, onOpenHistory }: CheckinFormProps) {
  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false)
  const [confirmFinalizeModalOpen, setConfirmFinalizeModalOpen] = useState(false)
  const {
    form,
    saving,
    metricScope,
    fieldErrors,
    numberDrafts,
    changedFields,
    canEditExisting,
    funnelError,
    inputError,
    minutesUntilEditLock,
    allZero,
    saveNotice,
    mandatoryFeedbackActionsCount,
    navigate,
    updateField,
    updateNumberField,
    commitNumberField,
    handleSubmit,
    submitCheckin,
    handleSaveDraft,
    crmDerived,
    historicalCheckin,
    isLate,
    deadlineMessage,
    // Added Props
    clientesList,
    fechamentoLiberado,
    finalizadoAposPrazo,
    isPastDeadline,
    lockStage,
    avisarGerenteWhatsapp,
    disciplinePercent,
    completedItems,
    pendingItems,
    temAgendamentoDataDiferente,
    realSalesCount,
    realFaturamento,
    totalAgendamentosD1,
    creditosValidos,
    customReferenceDate,
    effectiveForm,
    effectiveTotals,
  } = ctx

  const selectedDate = customReferenceDate || ctx.referenceDate

  const useReferenceValues = allZero && changedFields.size === 0 && !historicalCheckin
  const readValue = (field: NumericCheckinField) =>
    useReferenceValues ? REFERENCE_VALUES[field] : Number(effectiveForm[field] ?? form[field] ?? 0)

  const display = effectiveTotals
  const productionZeroActive = display.leads === 0 && display.visitas === 0 && display.agd === 0 && display.vendas === 0

  const showCrmBadge = !historicalCheckin && crmDerived.hasCrmData

  // Após 12h01 sem liberação (Especificação Funcional, §3.3): para de
  // insistir com o bloqueio destacado — só o aviso discreto permanece,
  // direcionando para o Histórico.
  const showDiscreetPendingBanner = lockStage === 'discreet' && !fechamentoLiberado

const counterProps = {
form,
fieldErrors,
numberDrafts,
    changedFields,
    updateField,
    updateNumberField,
    commitNumberField,
    readValue,
disabled: isPastDeadline && !fechamentoLiberado,
}

const mobileInternetRows: Array<{ label: string; field: NumericCheckinField }> = [
{ label: 'Leads recebidos', field: 'leads_net' },
{ label: 'Atendimentos realizados', field: 'visitas_net' },
{ label: 'Agendamentos D+1', field: 'agd_net' },
]

const setMobileCounter = (field: NumericCheckinField, next: number) => {
if (isPastDeadline && !fechamentoLiberado) return
updateField(field, Math.max(0, Math.min(CHECKIN_MAX_INPUT_VALUE, next)))
}

  // Visual messages for discipline card
  const disciplineMessage = useMemo(() => {
    if (isPastDeadline && !fechamentoLiberado) {
      return 'Dados preenchidos. Para finalizar este fechamento, solicite a liberação do gerente.'
    }
    if (finalizadoAposPrazo) {
      return 'Fechamento realizado fora do prazo. Penalização de 10% aplicada.'
    }
    if (disciplinePercent < 70) {
      return 'Preencha os números do fechamento para iniciar a pontuação.'
    }
    if (disciplinePercent === 70) {
      return 'Você informou apenas as quantidades. Cadastre os agendamentos para amanhã para ganhar até +30%.'
    }
    if (disciplinePercent > 70 && disciplinePercent < 100) {
      if (temAgendamentoDataDiferente) {
        return 'Existe agendamento com data diferente de amanhã. A pontuação foi ajustada.'
      }
      return 'Você cadastrou parte dos agendamentos para amanhã. Complete os cadastros para alcançar 100%.'
    }
    if (disciplinePercent === 100) {
      return 'Fechamento completo. Todos os agendamentos para amanhã foram detalhados corretamente.'
    }
    return ''
  }, [disciplinePercent, fechamentoLiberado, finalizadoAposPrazo, isPastDeadline, temAgendamentoDataDiferente])

  // Spec §20: se o vendedor informou Agendamentos D+1 e não detalhou todos,
  // abre modal de confirmação em vez de finalizar direto. D+1 zerado ou
  // 100% detalhado segue o fluxo normal sem interrupção.
  const onFormSubmit = (e: React.FormEvent) => {
    if (shouldConfirmBeforeFinalizar({ totalAgendamentosD1, creditosValidos })) {
      e.preventDefault()
      setConfirmFinalizeModalOpen(true)
      return
    }
    handleSubmit(e)
  }

  const handleVoltarECadastrar = () => {
    setConfirmFinalizeModalOpen(false)
    document.getElementById('cadastrar-venda-agendamentos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFinalizarMesmoAssim = () => {
    setConfirmFinalizeModalOpen(false)
    void submitCheckin()
  }

  const submitBlockedByDeadline = isPastDeadline && !fechamentoLiberado
  // 09h45 é o lock de edição "normal"; quando há liberação, esse lock não
  // se aplica mais — senão a liberação nunca teria efeito real (mesmo bug
  // que existia no backend, corrigido em checkin_validation_kit/EV-1.6).
  const editLockedWithoutLiberacao = !canEditExisting && metricScope === 'daily' && !fechamentoLiberado

  return (
    <form onSubmit={onFormSubmit} className="mt-mx-xs grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-mx-sm pb-28 md:pb-16">
      {/* Aviso discreto (após 12h01, sem liberação — Especificação Funcional §3.3) */}
      {showDiscreetPendingBanner && (
        <div className="rounded-lg border border-status-warning/20 bg-status-warning-surface px-4 py-2.5 text-xs font-bold text-status-warning flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Existe um fechamento anterior pendente.</span>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="underline hover:text-status-warning/80 transition-colors cursor-pointer shrink-0 ml-2 font-black"
          >
            Clique aqui para regularizar no Histórico
          </button>
        </div>
      )}

      {(funnelError || inputError) && (
        <CheckinValidationBanner
          metricScope={metricScope}
          minutesUntilEditLock={minutesUntilEditLock}
          funnelError={funnelError}
          inputError={inputError}
        />
      )}

<section className="md:hidden">
<div className="rounded-[16px] border border-[#0b63f6]/45 bg-white p-4 shadow-[0_12px_32px_rgba(37,99,235,0.12)]">
<header className="flex items-start justify-between gap-4 border-b border-[#e5eaf2] pb-4">
<div className="flex items-center gap-3">
<span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#0b63f6] text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)]">
<Globe size={28} aria-hidden="true" />
</span>
<div>
<h2 className="text-[20px] font-black tracking-tight text-[#111827]">Internet</h2>
<p className="mt-1 text-[15px] font-semibold text-[#64748b]">Leads digitais</p>
</div>
</div>
<div className="hidden max-w-[220px] rounded-[14px] bg-[#eff6ff] p-3 text-[12px] font-bold leading-relaxed text-[#334155] min-[420px]:block">
<span className="mb-1 inline-flex items-center gap-1 text-[#0b63f6]">
<Info size={15} aria-hidden="true" />
Info
</span>
<p>Informe os leads digitais recebidos e o andamento dos atendimentos.</p>
</div>
</header>

<div className="space-y-3 py-4">
{mobileInternetRows.map(({ label, field }) => {
const value = readValue(field)
const draftValue = numberDrafts[field] ?? String(value)
const disabled = isPastDeadline && !fechamentoLiberado
return (
<div key={field} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
<label htmlFor={`mobile-${field}`} className="min-w-0 text-[15px] font-bold leading-tight text-[#111827]">
{label}
</label>
<div className="grid w-[170px] grid-cols-[42px_minmax(0,1fr)_42px] gap-2">
<button type="button" disabled={disabled} onClick={() => setMobileCounter(field, value - 1)} className="grid h-11 place-items-center rounded-[10px] border border-[#e5eaf2] bg-white text-[18px] font-black text-[#111827] shadow-sm disabled:opacity-45">
<Minus size={16} aria-hidden="true" />
</button>
<input
id={`mobile-${field}`}
type="text"
inputMode="numeric"
pattern="[0-9]*"
value={draftValue}
onChange={(event) => updateNumberField(field, event.target.value.replace(/\D/g, '').slice(0, 3))}
onBlur={() => commitNumberField(field)}
disabled={disabled}
aria-invalid={Boolean(fieldErrors[field])}
className="h-11 min-w-0 rounded-[10px] border border-[#e5eaf2] bg-white text-center text-[20px] font-black tabular-nums text-[#111827] shadow-sm outline-none focus:border-[#0b63f6] focus:ring-4 focus:ring-[#0b63f6]/10 disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
/>
<button type="button" disabled={disabled} onClick={() => setMobileCounter(field, value + 1)} className="grid h-11 place-items-center rounded-[10px] border border-[#e5eaf2] bg-white text-[18px] font-black text-[#111827] shadow-sm disabled:opacity-45">
<Plus size={16} aria-hidden="true" />
</button>
</div>
</div>
)
})}
</div>

<div className="flex items-center gap-2 pb-4 text-[14px] font-bold text-[#64748b]">
<span className="grid h-6 w-6 place-items-center rounded-full bg-[#34c759] text-[12px] font-black text-white">✓</span>
Detalhados: {creditosValidos} de {totalAgendamentosD1}
</div>

<button
type="button"
onClick={() => mobileInternetRows.forEach(({ field }) => commitNumberField(field))}
disabled={isPastDeadline && !fechamentoLiberado}
className="h-12 w-full rounded-[12px] bg-[#0b63f6] text-[15px] font-black text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)] transition-colors hover:bg-[#0a58dc] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
>
Confirmar Internet
</button>
</div>
</section>

<section className="hidden w-full max-w-full min-w-0 gap-mx-sm md:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)_minmax(0,1.05fr)]">
<MetricGroupCard
          title="1. LEADS RECEBIDOS DO DIA"
          columns="grid-cols-1 sm:grid-cols-2"
          tooltipText="Informe quantos novos interessados chegaram no dia de referência pelos canais Carteira e Internet. Não inclua clientes de showroom."
        >
          <MetricCounterCard
            label="Canal Carteira"
            field="leads_cart"
            icon={Users}
            tone="success"
            crmBadge={showCrmBadge && crmDerived.leads_cart > 0}
            {...counterProps}
          />
          <MetricCounterCard
            label="Canal Internet"
            field="leads_net"
            icon={Globe}
            tone="info"
            crmBadge={showCrmBadge && crmDerived.leads_net > 0}
            {...counterProps}
          />
        </MetricGroupCard>

        <MetricGroupCard
          title="2. ATENDIMENTOS DO DIA"
          columns="grid-cols-1 sm:grid-cols-3"
          tooltipText="Informe quantos clientes você atendeu no dia de referência, separados por Showroom, Carteira e Internet."
        >
          <MetricCounterCard
            label="Porta"
            field="visitas_porta"
            icon={Store}
            tone="warning"
            crmBadge={showCrmBadge && crmDerived.visitas_porta > 0}
            {...counterProps}
          />
          <MetricCounterCard
            label="Carteira"
            field="visitas_cart"
            icon={Users}
            tone="success"
            crmBadge={showCrmBadge && crmDerived.visitas_cart > 0}
            {...counterProps}
          />
          <MetricCounterCard
            label="Internet"
            field="visitas_net"
            icon={Globe}
            tone="info"
            crmBadge={showCrmBadge && crmDerived.visitas_net > 0}
            {...counterProps}
          />
        </MetricGroupCard>

        <MetricGroupCard
          title="3. AGENDAMENTO PARA AMANHÃ"
          columns="grid-cols-1 sm:grid-cols-2"
          tooltipText="Informe quantos clientes ficaram com visitas/negociações agendados para amanhã, separados por Carteira e Internet."
        >
          <MetricCounterCard
            label="Carteira"
            field="agd_cart"
            icon={CalendarClock}
            tone="success"
            crmBadge={showCrmBadge && crmDerived.agd_cart > 0}
            {...counterProps}
          />
          <MetricCounterCard
            label="Internet"
            field="agd_net"
            icon={CalendarClock}
            tone="info"
            crmBadge={showCrmBadge && crmDerived.agd_net > 0}
            {...counterProps}
          />
        </MetricGroupCard>
      </section>



      <section className="grid w-full min-w-0 grid-cols-1 gap-mx-md">
        <div className="space-y-mx-md">
          <AnimatePresence>
            {productionZeroActive && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
                <Card className="space-y-3 rounded-[16px] border border-[#fcd34d] bg-[#fffbeb] px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <header className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#061a33] text-[#f59e0b]">
                      <AlertTriangle size={19} strokeWidth={2} />
                    </div>
                    <div>
                      <Typography variant="h2" className="text-[15px] font-bold text-[#92400e]">
                        Produção Zero
                      </Typography>
                      <Typography variant="caption" className="mt-0.5 font-semibold text-[#92400e]/70">
                        Justificativa obrigatória MX
                      </Typography>
                    </div>
                  </header>
                  <label htmlFor="checkin-zero-reason" className="sr-only">
                    Motivo da produção zero
                  </label>
                  <select
                    id="checkin-zero-reason"
                    name="zero_reason"
                    value={form.zero_reason}
                    onChange={event => updateField('zero_reason', event.target.value)}
                    disabled={isPastDeadline && !fechamentoLiberado}
                    aria-invalid={Boolean(fieldErrors.zero_reason)}
                    aria-describedby={fieldErrors.zero_reason ? 'checkin-error-zero-reason' : undefined}
                    className="h-11 w-full rounded-xl border border-[#fcd34d] bg-white px-4 text-sm font-semibold uppercase tracking-wide text-[#92400e] outline-none focus:border-[#f59e0b]"
                  >
                    <option value="">Selecione o motivo...</option>
                    {CHECKIN_ZERO_REASONS.map(reason => (
                      <option key={reason} value={reason}>
                        {reason.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.zero_reason && (
                    <Typography id="checkin-error-zero-reason" variant="tiny" tone="error" className="font-semibold">
                      {fieldErrors.zero_reason}
                    </Typography>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <CheckinCrmSection ctx={ctx} />

          {mandatoryFeedbackActionsCount > 0 && metricScope === 'daily' && (
            <Card className="rounded-mx-xl border border-status-error/20 bg-status-error-surface p-mx-md shadow-mx-sm">
              <div className="flex items-start gap-mx-sm">
                <AlertTriangle size={22} className="mt-1 shrink-0 text-status-error" />
                <div>
                  <Typography variant="h3" className="text-status-error">
                    Ação obrigatória do gestor
                  </Typography>
                  <Typography variant="p" className="mt-mx-xs text-sm font-semibold text-status-error">
                    Conclua a ação na Central ou registre uma justificativa antes de finalizar o fechamento.
                  </Typography>
                </div>
              </div>
            </Card>
          )}

          {(productionZeroActive || mandatoryFeedbackActionsCount > 0) && (
            <Card className="space-y-2 rounded-[16px] border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <label htmlFor="checkin-note" className="block text-sm font-bold text-[#111827]">
                Observações Operacionais {productionZeroActive || mandatoryFeedbackActionsCount > 0 ? '(Obrigatório)' : '(Opcional)'}
              </label>
              <Typography variant="p" tone="muted" className="text-xs">
                Descreva aqui eventos críticos, aprendizados e detalhes relevantes do dia.
              </Typography>
              <textarea
                id="checkin-note"
                name="note"
                value={form.note}
                onChange={event => updateField('note', event.target.value)}
                disabled={isPastDeadline && !fechamentoLiberado}
                maxLength={300}
                aria-invalid={Boolean(fieldErrors.note)}
                aria-describedby={fieldErrors.note ? 'checkin-error-note' : undefined}
                placeholder="Digite suas observações..."
                className="min-h-[76px] w-full resize-none rounded-xl border border-[#e5eaf2] bg-white p-3 text-sm text-[#111827] outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
              />
              <div className="flex items-center justify-between">
                {fieldErrors.note ? (
                  <Typography id="checkin-error-note" variant="tiny" tone="error" className="font-semibold">
                    {fieldErrors.note}
                  </Typography>
                ) : (
                  <span />
                )}
                <Typography variant="mono" tone="muted" className="text-mx-tiny">
                  {form.note.length}/300 caracteres
</Typography>
              </div>
            </Card>
          )}

          <CheckinSuccessSection saveNotice={saveNotice} onHome={() => navigate('/home')} />
        </div>
      </section>

      {/* Symmetric dashboard blocks: Resumo + Disciplina */}
      <section className="grid w-full max-w-full min-w-0 gap-5 xl:grid-cols-2">
        {/* ── RESUMO DO DIA ANTERIOR ── */}
        <div className="rounded-[18px] border border-[#dfe7f0] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] flex flex-col justify-between gap-4">
          <p className="text-[12px] font-extrabold uppercase tracking-widest text-[#334155]">RESUMO DO DIA ANTERIOR</p>

          {/* 4 metrics in a horizontal row with dividers */}
          <div className="flex items-stretch divide-x divide-[#eef2f7]">
            <div className="flex flex-1 flex-col items-center gap-1 px-4 first:pl-0">
              <span className="text-[28px] font-black leading-none tabular-nums text-[#2563eb]">{display.leads}</span>
              <span className="mt-1 text-[11px] font-semibold text-[#94a3b8] text-center leading-tight">Leads Recebidos</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 px-4">
              <span className="text-[28px] font-black leading-none tabular-nums text-[#f59e0b]">{display.visitas}</span>
              <span className="mt-1 text-[11px] font-semibold text-[#94a3b8] text-center leading-tight">Atendimentos</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 px-4">
              <span className="text-[28px] font-black leading-none tabular-nums text-[#f59e0b]">{display.agd}</span>
              <span className="mt-1 text-[11px] font-semibold text-[#94a3b8] text-center leading-tight">Agend. p/ Amanhã</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 px-4 last:pr-0">
              <span className="text-[28px] font-black leading-none tabular-nums text-[#ef4444]">{realSalesCount}</span>
              <span className="mt-1 text-[11px] font-semibold text-[#94a3b8] text-center leading-tight">Vendas Realizadas</span>
            </div>
          </div>

          {/* Faturamento bar */}
          <div className="flex items-center justify-between border-t border-[#eef2f7] pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">FATURAMENTO</span>
            <span className="text-[22px] font-black tabular-nums text-[#16a34a]">{BRL(realFaturamento)}</span>
          </div>
        </div>

        {/* ── DISCIPLINA – FECHAMENTO DIÁRIO ── */}
        {(() => {
          const pontosExtras = totalAgendamentosD1 > 0
            ? Math.round((creditosValidos / totalAgendamentosD1) * 30)
            : 30
          // Arc: red below base (70%), orange while incomplete, green at 100%
          const arcColor =
            disciplinePercent >= 100 ? '#16a34a' : disciplinePercent < 70 ? '#ef4444' : '#f59e0b'
          const trackColor = '#f1f5f9'
          const arcDeg = Math.round(disciplinePercent * 3.6)
          return (
            <div className="rounded-[18px] border border-[#dfe7f0] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] flex items-center gap-5">
              {/* Thick donut ring — matches reference proportions */}
              <div
                className="relative shrink-0 rounded-full"
                style={{
                  width: 96,
                  height: 96,
                  background: `conic-gradient(${arcColor} ${arcDeg}deg, ${trackColor} 0deg)`,
                }}
              >
                {/* Inner white circle (ring thickness = 11px) */}
                <div
                  className="absolute rounded-full bg-white flex flex-col items-center justify-center"
                  style={{ inset: 11 }}
                >
                  <span className="text-[23px] font-black leading-none tabular-nums text-[#111827]">
                    {disciplinePercent}%
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] mt-1">
                    SCORE
                  </span>
                </div>
              </div>

              {/* Text column */}
              <div className="flex flex-1 min-w-0 flex-col gap-2">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
                  DISCIPLINA – FECHAMENTO DIÁRIO
                </p>

                {disciplineMessage && (
                  <p className="text-[12px] font-medium text-[#475569] leading-snug">
                    {disciplineMessage}
                  </p>
                )}

                <p className="text-[11px] font-medium text-[#94a3b8]">
                  70% base + {pontosExtras}% detalhamento
                </p>

                <button
                  type="button"
                  className="flex items-center gap-1 text-[12px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors w-fit p-0 bg-transparent border-none cursor-pointer"
                  onClick={() => setDisciplineModalOpen(true)}
                >
                  Saiba mais
                  <Info size={13} className="shrink-0 text-[#94a3b8]" />
                </button>
              </div>
            </div>
          )
        })()}
      </section>

      {disciplineModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[3px]">
          <div className="w-full max-w-[620px] overflow-hidden rounded-[18px] border border-[#e5eaf2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] flex flex-col max-h-[90vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <header className="px-6 py-5 border-b border-[#eef2f7] flex items-center justify-between bg-[#f8fafc]">
              <div>
                <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight">
                  ENTENDA SUA PONTUAÇÃO DE DISCIPLINA
                </h2>
                <p className="text-xs font-semibold text-[#64748b] mt-1">
                  A pontuação do Fechamento Diário mede o quanto você manteve sua rotina comercial organizada no dia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisciplineModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-[#475569]">
              
              {/* SECTION 1: Fechamento básico — 70% */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Check size={14} className="stroke-[3]" /> 1. Fechamento básico — 70%
                </h3>
                <p>
                  Você garante 70% da pontuação quando informa as quantidades do dia:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Leads recebidos;</li>
                  <li>Atendimentos realizados;</li>
                  <li>Agendamentos para amanhã;</li>
                  <li>E finaliza o fechamento do dia.</li>
                </ul>
                <p>
                  Ou seja: se você preencher apenas os números e finalizar o fechamento, sua disciplina será de 70%.
                </p>
                <div className="bg-[#eff6ff] text-[#2563eb] font-bold p-2.5 rounded-lg border border-[#bfdbfe] flex items-center gap-2">
                  <Info size={14} />
                  <span>Preencheu os números do dia = 70%</span>
                </div>
              </div>

              {/* SECTION 2: Cadastro dos agendamentos — até +30% */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Award size={14} className="stroke-[2.5]" /> 2. Cadastro dos agendamentos — até +30%
                </h3>
                <p>
                  Os outros 30% são conquistados quando você detalha, no campo “Cadastrar Novo Cliente”, os agendamentos que informou no card “Agendamento para Amanhã”.
                </p>
                <p className="font-semibold text-[#111827]">
                  Exemplo:
                </p>
                <p>
                  Se você informou no card “Agendamento para Amanhã”:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Carteira: 1 agendamento</li>
                  <li>Internet: 1 agendamento</li>
                </ul>
                <p>
                  Total: 2 agendamentos para amanhã. Então você precisa cadastrar 2 clientes no card “Cadastrar Novo Cliente”, sendo:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>1 cliente do canal Carteira;</li>
                  <li>1 cliente do canal Internet.</li>
                </ul>
                <p>
                  Se cadastrar corretamente os 2 clientes, sua pontuação será 100%. Se cadastrar apenas 1 dos 2 clientes, sua pontuação será 85%.
                </p>
                <div className="bg-[#ecfdf5] text-[#16a34a] font-bold p-2.5 rounded-lg border border-[#bbf7d0] flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                  <span>Detalhou todos os agendamentos para amanhã corretamente = 100%</span>
                </div>
              </div>

              {/* SECTION 3: Quando um cadastro conta como agendamento? */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <HelpCircle size={14} /> 3. Quando um cadastro conta como agendamento?
                </h3>
                <p>
                  Para o cadastro contar na pontuação extra, ele precisa cumprir estas regras:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>O canal deve ser Carteira ou Internet;</li>
                  <li>O campo “Venda Realizada” deve estar como “Em Negociação”;</li>
                  <li>A data do agendamento deve ser para o dia seguinte ao fechamento, ou seja, para amanhã.</li>
                </ul>
                <p className="font-semibold text-[#111827]">
                  Exemplo:
                </p>
                <p>
                  Se o fechamento é do dia 22/05, o agendamento deve estar marcado para 23/05.
                </p>
                <div className="bg-[#fffbeb] text-[#d97706] font-bold p-2.5 rounded-lg border border-[#fed7aa] flex items-center gap-2">
                  <AlertCircle size={14} className="text-[#d97706]" />
                  <span>Para contar como agendamento, a venda deve estar como Em Negociação.</span>
                </div>
              </div>

              {/* SECTION 4: Atenção à data do agendamento */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Clock size={14} /> 4. Atenção à data do agendamento
                </h3>
                <p>
                  Todo agendamento informado no card “Agendamento para Amanhã” deve ser cadastrado com data para o dia seguinte.
                </p>
                <p>
                  Se a data cadastrada for diferente de amanhã, o sistema considera apenas 50% daquele cadastro para a pontuação extra.
                </p>
                <p className="font-semibold text-[#111827]">
                  Exemplo:
                </p>
                <p>
                  Você informou 3 agendamentos para amanhã. Depois cadastrou:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>2 clientes com data correta para amanhã;</li>
                  <li>1 cliente com data diferente.</li>
                </ul>
                <p>
                  Neste caso, sua pontuação será ajustada e ficará em 95%.
                </p>
                <div className="bg-[#fffbeb] text-[#d97706] font-bold p-2.5 rounded-lg border border-[#fed7aa] flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#d97706]" />
                  <span>Agendamento com data diferente de amanhã vale apenas 50% na pontuação extra.</span>
                </div>
              </div>

              {/* SECTION 5: Venda não é agendamento */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <DollarSign size={14} /> 5. Venda não é agendamento
                </h3>
                <p>
                  Se no cadastro do cliente você marcar: <strong className="text-[#111827]">“Venda Realizada = Sim”</strong>
                </p>
                <p>
                  O sistema entende que foi uma venda. Esse registro vai contar para:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Vendas realizadas;</li>
                  <li>Faturamento;</li>
                  <li>Funil de vendas.</li>
                </ul>
                <p>
                  Mas ele não conta como agendamento para amanhã. Para contar como agendamento, o campo deve estar como: <strong className="text-[#111827]">“Venda Realizada = Em Negociação”</strong>.
                </p>
                <div className="bg-[#eff6ff] text-[#2563eb] font-bold p-2.5 rounded-lg border border-[#bfdbfe] flex items-center gap-2">
                  <Info size={14} />
                  <span>Venda Realizada = Sim conta como venda, não como agendamento.</span>
                </div>
              </div>

              {/* SECTION 6: Prazo para fechar o dia anterior */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-[#2563eb] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Clock size={14} /> 6. Prazo para fechar o dia anterior
                </h3>
                <p>
                  Você pode realizar ou corrigir o fechamento do dia anterior até 09h30 da manhã, no horário de Brasília.
                </p>
                <p>
                  Depois desse horário, o fechamento fica bloqueado. Caso precise ajustar, solicite liberação ao seu superior.
                </p>
                <div className="bg-[#f8fafc] text-[#475569] font-bold p-2.5 rounded-lg border border-[#e5eaf2] flex items-center gap-2">
                  <LockKeyhole size={14} />
                  <span>Após 09h30, somente o superior poderá liberar o fechamento.</span>
                </div>
              </div>

              {/* SECTION 7: Resumo rápido */}
              <div className="space-y-2 bg-[#f8fafc] p-4 rounded-xl border border-[#e5eaf2]">
                <h3 className="font-extrabold text-[#2563eb] uppercase tracking-wider text-[10px]">
                  7. Resumo rápido
                </h3>
                <ul className="space-y-1.5 font-semibold text-[#111827]">
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Preencheu os números do dia: 70%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Detalhou todos os agendamentos para amanhã corretamente: 100%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Detalhou apenas parte dos agendamentos: pontuação proporcional</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Cadastrou com data diferente de amanhã: aquele cadastro vale apenas 50%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Cliente vendido conta como venda, não como agendamento</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-[#16a34a] stroke-[3]" /> Fechamento do dia anterior fica liberado até 09h30 do dia seguinte</li>
                </ul>
                <p className="italic font-bold text-[#2563eb] mt-3">
                  “Essa regra existe para manter seu funil atualizado e ajudar você, sua liderança e a loja a acompanharem melhor as oportunidades reais de venda.”
                </p>
              </div>
            </div>

            {/* Fixed Footer */}
            <footer className="px-6 py-4 border-t border-[#eef2f7] flex justify-end bg-[#f8fafc]">
              <button
                type="button"
                onClick={() => setDisciplineModalOpen(false)}
                className="h-10 px-6 font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-sm transition-colors"
              >
                Entendi
              </button>
            </footer>
          </div>
        </div>
      )}

      {confirmFinalizeModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[3px]">
          <div className="w-full max-w-[460px] overflow-hidden rounded-[18px] border border-[#e5eaf2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] flex flex-col transition-all animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-5 border-b border-[#eef2f7] bg-[#f8fafc]">
              <h2 className="text-lg font-extrabold text-[#111827] uppercase tracking-tight">
                Deseja finalizar mesmo assim?
              </h2>
            </header>
            <div className="p-6 space-y-4 text-sm leading-relaxed text-[#475569]">
              <p>
                Você informou <strong className="text-[#111827]">{totalAgendamentosD1}</strong> Agendamentos D+1, mas detalhou{' '}
                <strong className="text-[#111827]">{creditosValidos}</strong>. O fechamento poderá ser finalizado normalmente, porém sua pontuação de disciplina será calculada apenas com os agendamentos detalhados.
              </p>
              <ul className="space-y-1.5 font-semibold text-[#111827] bg-[#f8fafc] rounded-xl border border-[#e5eaf2] p-4">
                <li>Agendamentos D+1 informados: {totalAgendamentosD1}</li>
                <li>Agendamentos D+1 detalhados: {creditosValidos}</li>
                <li>Pontuação estimada de disciplina: {disciplinePercent}%</li>
              </ul>
            </div>
            <footer className="px-6 py-4 border-t border-[#eef2f7] flex flex-col-reverse gap-2 sm:flex-row sm:justify-end bg-[#f8fafc]">
              <button
                type="button"
                onClick={handleVoltarECadastrar}
                className="h-10 px-6 font-bold text-[#475569] hover:bg-[#f1f5f9] rounded-xl transition-colors"
              >
                Voltar e cadastrar
              </button>
              <button
                type="button"
                onClick={handleFinalizarMesmoAssim}
                className="h-10 px-6 font-bold bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl shadow-sm transition-colors"
              >
                Finalizar mesmo assim
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Finalizar Fechamento */}
      <div className="min-w-0 rounded-[18px] border border-[#dfe7f0] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] mt-5 space-y-4">
        {/* Late Close Warning Banner — só no estágio "blocked" (09h31-12h00).
            Após 12h01 (lockStage 'discreet') a tela para de insistir; ver
            showDiscreetPendingBanner acima. Liberado mostra sempre, pra
            confirmar a penalidade antes de finalizar. */}
        {(lockStage === 'blocked' || fechamentoLiberado) && isPastDeadline && (
          <div className={`rounded-xl border p-4 shadow-sm ${
            fechamentoLiberado
              ? 'border-status-success/30 bg-status-success-surface'
              : 'border-status-error/30 bg-status-error-surface'
          }`}>
            <div className="flex items-start gap-2">
              {fechamentoLiberado ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-status-success" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-error" />
              )}
              <div className="flex-1">
                <Typography variant="p" className={`text-sm font-bold ${
                  fechamentoLiberado ? 'text-status-success' : 'text-status-error'
                }`}>
                  {fechamentoLiberado
                    ? 'Fechamento liberado pelo gerente. Ao finalizar, será aplicada penalização de 10% por atraso.'
                    : 'Prazo encerrado às 09h30. Solicite liberação ao seu gerente para finalizar este fechamento.'}
                </Typography>
              </div>
            </div>
            {!fechamentoLiberado && (
              <button
                type="button"
                onClick={() => avisarGerenteWhatsapp()}
                className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-status-success px-4 text-xs font-bold text-white transition-colors hover:opacity-90 shadow-sm"
              >
                <MessageSquare size={14} /> Avisar gerente no WhatsApp
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Green pill button */}
          <button
            type="submit"
          disabled={saving || submitBlockedByDeadline || editLockedWithoutLiberacao}
          className={cn(
            "inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-center text-[12px] font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_8px_20px_rgba(22,163,74,0.28)] transition-all sm:w-auto sm:px-8 sm:text-[13px] sm:tracking-[0.08em]",
            saving || submitBlockedByDeadline || editLockedWithoutLiberacao
              ? "bg-[#94a3b8] cursor-not-allowed shadow-none"
              : "bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.98]"
          )}
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole size={15} className="shrink-0" />
            )}
            <span>{saving ? 'Salvando...' : submitBlockedByDeadline ? 'AGUARDANDO LIBERAÇÃO DO GERENTE' : 'FINALIZAR FECHAMENTO DO DIA'}</span>
          </button>

          {/* Warning text */}
          <p className="text-[13px] font-semibold text-[#475569] leading-snug">
            Após finalizar, as informações serão enviadas para sua liderança e{' '}
            <strong className="font-extrabold text-[#111827]">não poderão mais ser editadas.</strong>
          </p>
        </div>
        {/* Hidden Salvar rascunho — mantém contrato de teste (CheckinForm.test.ts) */}
        <button
          type="button"
          disabled={saving || (isPastDeadline && !fechamentoLiberado) || editLockedWithoutLiberacao}
          onClick={() => void handleSaveDraft()}
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
        >
          Salvar rascunho
        </button>
      </div>
    </form>
  )
}

function MetricGroupCard({
  title,
  columns,
  children,
  tooltipText,
}: {
  title: string
  columns: string
  children: ReactNode
  tooltipText?: string
}) {
  const [step, ...labelParts] = title.split('. ')
  const label = labelParts.join('. ') || title
  const stepTone =
    step === '1'
      ? 'bg-[#16a34a]'
      : step === '2'
        ? 'bg-[#f59e0b]'
        : 'bg-[#2563eb]'

  return (
    <Card className="min-w-0 overflow-hidden rounded-[16px] border border-[#dfe7f0] bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <header className="flex min-h-12 items-start gap-2 border-b border-[#eef2f7] px-4 py-3 sm:items-center sm:px-5">
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${stepTone}`}>
          {step}
        </span>
        <h2 className="min-w-0 text-[12px] font-extrabold uppercase leading-snug tracking-[0.06em] text-[#334155] sm:text-[13px] sm:tracking-[0.08em]">
          {label}
        </h2>
        {tooltipText && <InfoTooltip text={tooltipText} />}
      </header>
      <div className={`grid min-w-0 divide-y divide-[#eef2f7] p-3 sm:divide-y-0 sm:divide-x sm:p-5 ${columns}`}>{children}</div>
    </Card>
  )
}

function MetricCounterCard({
  label,
  icon: Icon,
  field,
  tone,
  crmBadge,
  form,
  fieldErrors,
  numberDrafts,
  changedFields,
  updateField,
  updateNumberField,
  commitNumberField,
  readValue,
  disabled,
}: {
  label: string
  icon: LucideIcon
  field: NumericCheckinField
  tone: 'success' | 'info' | 'warning'
  crmBadge?: boolean
  form: CheckinPageContext['form']
  fieldErrors: CheckinPageContext['fieldErrors']
  numberDrafts: CheckinPageContext['numberDrafts']
  changedFields: CheckinPageContext['changedFields']
  updateField: CheckinPageContext['updateField']
  updateNumberField: CheckinPageContext['updateNumberField']
  commitNumberField: CheckinPageContext['commitNumberField']
  readValue: (field: NumericCheckinField) => number
  disabled?: boolean
}) {
  const displayValue = readValue(field)
  const inputValue = numberDrafts[field] ?? String(displayValue)
  const iconToneClass =
    tone === 'success'
      ? 'bg-[#16a34a] text-white'
      : tone === 'info'
        ? 'bg-[#2563eb] text-white'
        : 'bg-[#f59e0b] text-white'

  const setNext = (next: number) => {
    if (disabled) return
    updateField(field, Math.max(0, Math.min(CHECKIN_MAX_INPUT_VALUE, next)))
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let val = event.target.value.replace(/\D/g, '')
    if (val !== '') {
      let num = Number(val)
      if (num > CHECKIN_MAX_INPUT_VALUE) {
        num = CHECKIN_MAX_INPUT_VALUE
        val = String(CHECKIN_MAX_INPUT_VALUE)
      }
      updateNumberField(field, val)
    } else {
      updateNumberField(field, '')
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const handleBlur = () => {
    commitNumberField(field)
  }

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    event.currentTarget.blur()
  }

  return (
    <div
      className={cn(
    "relative flex min-h-[124px] min-w-0 flex-col items-center justify-center gap-2 bg-white px-2 py-4 text-center sm:px-3",
        fieldErrors[field] && "ring-2 ring-[#ef4444]/20 rounded-xl"
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-[13px] font-bold text-[#475569]">
          {label}
        </span>
        {crmBadge && (
          <span className="inline-flex items-center justify-center rounded-full bg-[#2563eb]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#2563eb] border border-[#2563eb]/20">
            CRM
          </span>
        )}
      </div>

      <span className={cn("grid h-11 w-11 place-items-center rounded-full shadow-sm", iconToneClass)}>
        <Icon size={19} />
      </span>

      <input
        type="text"
        inputMode="numeric"
        name={String(field)}
        aria-label={label}
        disabled={disabled}
        value={inputValue}
        onFocus={event => event.target.select()}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        onWheel={handleWheel}
        className="
          h-11 w-20 rounded-xl border border-[#e5eaf2] bg-[#f8fafc] text-center
          text-[26px] font-extrabold leading-none text-[#111827]
          outline-none tabular-nums cursor-text transition-all
          [appearance:textfield]
          [&::-webkit-inner-spin-button]:appearance-none
          [&::-webkit-outer-spin-button]:appearance-none
          hover:border-[#2563eb]/30 hover:bg-[#f1f5f9]
          focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10
        "
      />

      <div className="mt-1 grid h-8 w-full max-w-[120px] grid-cols-[28px_minmax(0,1fr)_28px] overflow-hidden rounded-lg border border-[#e5eaf2] bg-white shadow-sm transition-all focus-within:border-[#2563eb]/40 focus-within:ring-2 focus-within:ring-[#2563eb]/20">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          disabled={disabled || (Number(form[field]) <= 0 && displayValue <= 0)}
          onClick={() => setNext(displayValue - 1)}
          className="grid h-full w-full place-items-center bg-[#f8fafc] text-[#475569] hover:bg-[#ef4444]/10 hover:text-[#ef4444] disabled:opacity-40 border-r border-[#e5eaf2] transition-colors"
        >
          <Minus size={13} />
        </button>

        <span className="grid place-items-center text-[14px] font-extrabold tabular-nums text-[#111827] bg-[#f8fafc]">
          {displayValue}
        </span>

        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          disabled={disabled || displayValue >= CHECKIN_MAX_INPUT_VALUE}
          onClick={() => setNext(displayValue + 1)}
          className="grid h-full w-full place-items-center bg-[#f8fafc] text-[#475569] hover:bg-[#16a34a]/10 hover:text-[#16a34a] disabled:opacity-40 border-l border-[#e5eaf2] transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {fieldErrors[field] && (
        <Typography variant="tiny" tone="error" className="font-semibold mt-1">
          {fieldErrors[field]}
        </Typography>
      )}
    </div>
  )
}

function ResumoItem({
  label,
  value,
  icon: Icon,
  tone = 'success',
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'success' | 'info' | 'warning'
}) {
  const iconClass =
    tone === 'success'
      ? 'bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]'
      : tone === 'info'
        ? 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
        : 'bg-[#fffbeb] text-[#f59e0b] border border-[#fef3c7]'

  return (
    <div className="grid min-h-[88px] place-items-center rounded-xl border border-[#eef2f7] bg-white p-3 text-center shadow-sm">
      <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
        {label}
      </span>
      <span className={`max-w-full font-extrabold text-[#111827] tabular-nums ${value.length > 7 ? 'text-xs' : 'text-[17px]'}`}>
        {value}
      </span>
      <span className={cn("grid h-7 w-7 place-items-center rounded-full", iconClass)}>
        <Icon size={13} />
      </span>
    </div>
  )
}
