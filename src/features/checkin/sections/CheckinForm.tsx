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
} from 'lucide-react'
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

interface CheckinFormProps {
  ctx: CheckinPageContext
  totalsAgd: number
  totalsVnd: number
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

export function CheckinForm({ ctx, totalsAgd, totalsVnd }: CheckinFormProps) {
  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false)
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
    avisarGerenteWhatsapp,
    todaySP,
    yesterdaySP,
    supabaseUser,
    disciplinePercent,
    completedItems,
    pendingItems,
    temAgendamentoDataDiferente,
    realSalesCount,
    realFaturamento,
    totalAgendamentosD1,
    creditosValidos,
    customReferenceDate,
  } = ctx

  const selectedDate = customReferenceDate || ctx.referenceDate

  const useReferenceValues = allZero && changedFields.size === 0 && !historicalCheckin
  const readValue = (field: NumericCheckinField) =>
    useReferenceValues ? REFERENCE_VALUES[field] : Number(form[field] ?? 0)

  const display = {
    leads: readValue('leads_cart') + readValue('leads_net'),
    visitas: readValue('visitas_porta') + readValue('visitas_cart') + readValue('visitas_net'),
    agd: readValue('agd_cart') + readValue('agd_net'),
    vendas: readValue('vnd_porta') + readValue('vnd_cart') + readValue('vnd_net'),
  }
  const productionZeroActive = display.leads === 0 && display.visitas === 0 && display.agd === 0 && display.vendas === 0

  const showCrmBadge = !historicalCheckin && crmDerived.hasCrmData

  // Check if yesterday is pending closure
  const yesterdayPending = useMemo(() => {
    if (!supabaseUser?.id || selectedDate !== todaySP) return false
    const isFinalized = localStorage.getItem(`mx-checkin-finalizado:${supabaseUser.id}:${yesterdaySP}`) === 'true'
    return !isFinalized
  }, [supabaseUser, selectedDate, todaySP, yesterdaySP])

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

  // Visual messages for discipline card
  const disciplineMessage = useMemo(() => {
    if (finalizadoAposPrazo) {
      return 'Fechamento realizado fora do prazo. Penalização de 10% aplicada.'
    }
    if (disciplinePercent === 70) {
      return 'Você informou apenas as quantidades. Cadastre os agendamentos D+1 para ganhar até +30%.'
    }
    if (disciplinePercent > 70 && disciplinePercent < 100) {
      if (temAgendamentoDataDiferente) {
        return 'Existe agendamento com data diferente de D+1. A pontuação foi ajustada.'
      }
      return 'Você cadastrou parte dos agendamentos D+1. Complete os cadastros para alcançar 100%.'
    }
    if (disciplinePercent === 100) {
      return 'Fechamento completo. Todos os agendamentos D+1 foram detalhados corretamente.'
    }
    return ''
  }, [disciplinePercent, finalizadoAposPrazo, temAgendamentoDataDiferente])

  return (
    <form onSubmit={handleSubmit} className="mt-mx-xs grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-mx-sm pb-16">
      {/* Yesterday Pending Banner */}
      {yesterdayPending && (
        <div className="rounded-lg border border-status-warning/20 bg-status-warning-surface px-4 py-2.5 text-xs font-bold text-status-warning flex items-center gap-2 shadow-sm animate-pulse">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Existe um fechamento anterior pendente. Acesse o Histórico de Fechamentos para regularizar.</span>
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

      <section className="grid w-full max-w-full min-w-0 gap-mx-sm lg:grid-cols-[1.05fr_1.35fr_1.05fr]">
        <MetricGroupCard
          title="1. LEADS RECEBIDOS HOJE"
          columns="grid-cols-1 sm:grid-cols-2"
          tooltipText="Informe quantos novos interessados chegaram hoje pelos canais Carteira e Internet. Não inclua clientes de showroom."
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
          title="2. ATENDIMENTOS HOJE"
          columns="grid-cols-1 sm:grid-cols-3"
          tooltipText="Informe quantos clientes você atendeu hoje, separados por Showroom, Carteira e Internet."
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
          title="3. AGENDAMENTO D+1"
          columns="grid-cols-1 sm:grid-cols-2"
          tooltipText="Informe quantos clientes ficaram com visitas/negociações agendados para o dia seguinte, separados por Carteira e Internet."
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

      {/* Late Close Warning Banner */}
      {isPastDeadline && (
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

      <section className="grid w-full min-w-0 gap-mx-md">
        <div className="space-y-mx-md">
          <AnimatePresence>
            {productionZeroActive && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
                <Card className="space-y-mx-sm rounded-mx-xl border border-status-warning bg-status-warning-surface p-mx-md shadow-mx-sm">
                  <header className="flex items-center gap-mx-sm">
                    <div className="grid h-mx-xl w-mx-xl place-items-center rounded-mx-md bg-mx-black text-status-warning">
                      <AlertTriangle size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <Typography variant="h2" className="text-lg font-semibold">
                        Produção Zero
                      </Typography>
                      <Typography variant="caption" tone="muted" className="mt-1 font-semibold">
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
                    className="h-mx-12 w-full rounded-mx-lg border border-status-warning/30 bg-white px-mx-md text-sm font-semibold uppercase tracking-wide text-text-primary outline-none focus:border-status-warning"
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
            <Card className="space-y-mx-xs rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
              <label htmlFor="checkin-note" className="block text-sm font-semibold text-text-primary">
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
                className="h-16 w-full resize-none rounded-mx-lg border border-border-default bg-white p-mx-sm text-sm text-text-primary outline-none transition-all placeholder:text-text-tertiary/60 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5"
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

      {/* Symmetric dashboard blocks */}
      <section className="grid w-full max-w-full min-w-0 gap-mx-md xl:grid-cols-2">
        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
          <Typography variant="h2" className="text-base font-extrabold text-text-primary uppercase tracking-normal">
            RESUMO DO DIA ANTERIOR
          </Typography>
          <div className="mt-mx-sm grid grid-cols-2 gap-mx-xs sm:grid-cols-3 2xl:grid-cols-5">
            <ResumoItem label="Leads Recebidos" value={String(display.leads)} icon={Users} />
            <ResumoItem label="Atendimentos" value={String(display.visitas)} icon={Globe} tone="info" />
            <ResumoItem label="Agendamentos D+1" value={String(display.agd)} icon={Users} />
            <ResumoItem label="Vendas Realizadas" value={String(realSalesCount)} icon={DollarSign} tone="warning" />
            <ResumoItem label="FATURAMENTO" value={BRL(realFaturamento)} icon={CheckCircle2} />
          </div>
        </Card>

        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm flex flex-col justify-center">
          <div className="flex flex-col items-start gap-mx-md sm:flex-row sm:items-center">
            {/* Elegant donut chart */}
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full sm:h-24 sm:w-24 shadow-sm"
              style={{
                background: `conic-gradient(var(--color-brand-primary) ${disciplinePercent * 3.6}deg, var(--color-border-subtle) 0deg)`,
              }}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-white sm:h-16 sm:w-16">
                <span className="text-lg font-black tabular-nums text-brand-primary sm:text-xl">{disciplinePercent}%</span>
              </div>
            </div>
            <div className="grid w-full min-w-0 flex-1 gap-mx-md md:grid-cols-2">
              <div>
                <Typography variant="h3" className="text-sm font-extrabold text-text-primary uppercase tracking-normal">
                  Disciplina – Fechamento Diário
                </Typography>
                {disciplineMessage && (
                  <p className="text-[11px] font-semibold text-text-secondary mt-1 leading-normal">
                    {disciplineMessage}
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {completedItems.map(item => (
                    <li key={item} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                      <CheckCircle2 size={13} className="text-status-success" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                {pendingItems.length > 0 && (
                  <>
                    <Typography variant="tiny" tone="muted" className="normal-case tracking-normal font-bold">
                      Pendências ({pendingItems.length})
                    </Typography>
                    <ul className="mt-1 space-y-1">
                      {pendingItems.map(item => (
                        <li key={item} className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary">
                          <span className="h-2 w-2 rounded-full bg-status-warning" /> {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-brand-primary hover:underline text-xs p-0 font-extrabold flex items-center gap-1 focus:outline-none"
                  onClick={() => setDisciplineModalOpen(true)}
                >
                  Saiba mais
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Premium Discipline Rules Modal (7 Sections) */}
      {disciplineModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-mx-black/40 backdrop-blur-xs p-mx-md" role="dialog" aria-modal="true" aria-label="Detalhes da disciplina">
          <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-white shadow-mx-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Fixed Header */}
            <header className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-black text-brand-primary uppercase tracking-normal">
                  Entenda sua pontuação de Disciplina
                </h2>
                <p className="text-xs font-semibold text-text-tertiary mt-0.5">
                  A pontuação do Fechamento Diário mede o quanto você manteve sua rotina comercial organizada no dia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisciplineModalOpen(false)}
                className="p-1 rounded-full text-text-tertiary hover:bg-slate-200 transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-text-secondary">
              
              {/* SECTION 1: Fechamento básico — 70% */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Check size={14} className="stroke-[3]" /> 1. Fechamento básico — 70%
                </h3>
                <p>
                  Você garante 70% da pontuação quando informa as quantidades do dia:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Leads recebidos;</li>
                  <li>Atendimentos realizados;</li>
                  <li>Agendamentos D+1;</li>
                  <li>E finaliza o fechamento do dia.</li>
                </ul>
                <p>
                  Ou seja: se você preencher apenas os números e finalizar o fechamento, sua disciplina será de 70%.
                </p>
                <div className="bg-blue-50 text-blue-700 font-bold p-2.5 rounded-lg border border-blue-100 flex items-center gap-2">
                  <InfoTooltip text="Cálculo básico da sua rotina operacional diária." />
                  <span>Preencheu os números do dia = 70%</span>
                </div>
              </div>

              {/* SECTION 2: Cadastro dos agendamentos — até +30% */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Award size={14} className="stroke-[2.5]" /> 2. Cadastro dos agendamentos — até +30%
                </h3>
                <p>
                  Os outros 30% são conquistados quando você detalha, no campo “Cadastrar Novo Cliente”, os agendamentos que informou no card “Agendamento D+1”.
                </p>
                <p className="font-semibold text-text-primary">
                  Exemplo:
                </p>
                <p>
                  Se você informou no card “Agendamento D+1”:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Carteira: 1 agendamento</li>
                  <li>Internet: 1 agendamento</li>
                </ul>
                <p>
                  Total: 2 agendamentos D+1. Então você precisa cadastrar 2 clientes no card “Cadastrar Novo Cliente”, sendo:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>1 cliente do canal Carteira;</li>
                  <li>1 cliente do canal Internet.</li>
                </ul>
                <p>
                  Se cadastrar corretamente os 2 clientes, sua pontuação será 100%. Se cadastrar apenas 1 dos 2 clientes, sua pontuação será 85%.
                </p>
                <div className="bg-emerald-50 text-emerald-700 font-bold p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Detalhou todos os agendamentos D+1 corretamente = 100%</span>
                </div>
              </div>

              {/* SECTION 3: Quando um cadastro conta como agendamento? */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <HelpCircle size={14} /> 3. Quando um cadastro conta como agendamento?
                </h3>
                <p>
                  Para o cadastro contar na pontuação extra, ele precisa cumprir estas regras:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>O canal deve ser Carteira ou Internet;</li>
                  <li>O campo “Venda Realizada” deve estar como “Em Negociação”;</li>
                  <li>A data do agendamento deve ser para o dia seguinte ao fechamento, ou seja, D+1.</li>
                </ul>
                <p className="font-semibold text-text-primary">
                  Exemplo:
                </p>
                <p>
                  Se o fechamento é do dia 22/05, o agendamento deve estar marcado para 23/05.
                </p>
                <div className="bg-amber-50 text-amber-700 font-bold p-2.5 rounded-lg border border-amber-100 flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>Para contar como agendamento, a venda deve estar como Em Negociação.</span>
                </div>
              </div>

              {/* SECTION 4: Atenção à data do agendamento */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Clock size={14} /> 4. Atenção à data do agendamento
                </h3>
                <p>
                  Todo agendamento informado no card “Agendamento D+1” deve ser cadastrado com data para o dia seguinte.
                </p>
                <p>
                  Se a data cadastrada for diferente de D+1, o sistema considera apenas 50% daquele cadastro para a pontuação extra.
                </p>
                <p className="font-semibold text-text-primary">
                  Exemplo:
                </p>
                <p>
                  Você informou 3 agendamentos D+1. Depois cadastrou:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>2 clientes com data correta para D+1;</li>
                  <li>1 cliente com data diferente.</li>
                </ul>
                <p>
                  Neste caso, sua pontuação será ajustada e ficará em 95%.
                </p>
                <div className="bg-amber-50 text-amber-700 font-bold p-2.5 rounded-lg border border-amber-100 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span>Agendamento com data diferente de D+1 vale apenas 50% na pontuação extra.</span>
                </div>
              </div>

              {/* SECTION 5: Venda não é agendamento */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <DollarSign size={14} /> 5. Venda não é agendamento
                </h3>
                <p>
                  Se no cadastro do cliente você marcar: <strong className="text-text-primary">“Venda Realizada = Sim”</strong>
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
                  Mas ele não conta como agendamento D+1. Para contar como agendamento, o campo deve estar como: <strong className="text-text-primary">“Venda Realizada = Em Negociação”</strong>.
                </p>
                <div className="bg-blue-50 text-blue-700 font-bold p-2.5 rounded-lg border border-blue-100 flex items-center gap-2">
                  <InfoTooltip text="Vendas e agendamentos são fluxos separados no funil." />
                  <span>Venda Realizada = Sim conta como venda, não como agendamento.</span>
                </div>
              </div>

              {/* SECTION 6: Prazo para fechar o dia anterior */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Clock size={14} /> 6. Prazo para fechar o dia anterior
                </h3>
                <p>
                  Você pode realizar ou corrigir o fechamento do dia anterior até 09h30 da manhã, no horário de Brasília.
                </p>
                <p>
                  Depois desse horário, o fechamento fica bloqueado. Caso precise ajustar, solicite liberação ao seu superior.
                </p>
                <div className="bg-slate-100 text-slate-700 font-bold p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                  <LockKeyhole size={14} />
                  <span>Após 09h30, somente o superior poderá liberar o fechamento.</span>
                </div>
              </div>

              {/* SECTION 7: Resumo rápido */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-border-default">
                <h3 className="font-extrabold text-brand-primary uppercase tracking-wider text-[10px]">
                  7. Resumo rápido
                </h3>
                <ul className="space-y-1.5 font-semibold text-text-primary">
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Preencheu os números do dia: 70%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Detalhou todos os agendamentos D+1 corretamente: 100%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Detalhou apenas parte dos agendamentos: pontuação proporcional</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Cadastrou com data diferente de D+1: aquele cadastro vale apenas 50%</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Cliente vendido conta como venda, não como agendamento</li>
                  <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600 stroke-[3]" /> Fechamento do dia anterior fica liberado até 09h30 do dia seguinte</li>
                </ul>
                <p className="italic font-bold text-brand-primary mt-3">
                  “Essa regra existe para manter seu funil atualizado e ajudar você, sua liderança e a loja a acompanharem melhor as oportunidades reais de venda.”
                </p>
              </div>
            </div>

            {/* Fixed Footer */}
            <footer className="px-6 py-3 border-t border-border-default flex justify-end bg-slate-50">
              <Button
                type="button"
                onClick={() => setDisciplineModalOpen(false)}
                className="h-9 px-6 font-bold bg-brand-primary text-white hover:bg-brand-primary/90 rounded-lg shadow-xs"
              >
                Entendi
              </Button>
            </footer>
          </div>
        </div>
      )}

      {/* Save / Finalize buttons */}
      <div className="min-w-0 rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-mx-md md:grid-cols-[0.45fr_1fr]">
          <Button
            type="button"
            variant="outline"
            disabled={saving || (isPastDeadline && !fechamentoLiberado) || (!canEditExisting && metricScope === 'daily')}
            onClick={() => void handleSaveDraft()}
            className="h-mx-14 w-full max-w-full font-bold border-border-default hover:bg-slate-50"
          >
            <Save size={18} /> Salvar rascunho
          </Button>
          <Button
            type="submit"
            disabled={saving || (isPastDeadline && !fechamentoLiberado) || (!canEditExisting && metricScope === 'daily')}
            className={`h-mx-14 w-full max-w-full whitespace-normal text-center font-black uppercase tracking-wide rounded-xl shadow-md transition-all text-white ${
              isPastDeadline && !fechamentoLiberado
                ? 'bg-status-error hover:bg-status-error/90'
                : 'bg-status-success hover:bg-status-success/90'
            }`}
          >
            {saving ? (
              <RefreshCw className="h-mx-lg w-mx-lg animate-spin" />
            ) : (
              <>
                <LockKeyhole size={18} className="inline-block mr-1" /> Finalizar fechamento do dia
              </>
            )}
          </Button>
        </div>
        <Typography variant="p" tone="muted" className="mt-mx-sm flex items-center justify-center gap-mx-xs text-xs font-semibold">
          <LockKeyhole size={14} /> Após finalizar, as informações serão enviadas para sua liderança e não poderão mais ser editadas.
        </Typography>
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
      ? 'bg-status-success text-white'
      : step === '2'
        ? 'bg-status-warning text-white'
        : 'bg-status-info text-white'

  return (
    <Card className="min-w-0 overflow-visible rounded-mx-lg border border-border-default bg-white p-0 shadow-mx-xs">
      <header className="flex items-center gap-mx-xs border-b border-border-subtle px-mx-sm py-mx-xs rounded-t-mx-lg">
        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold ${stepTone}`}>
          {step}
        </span>
        <Typography variant="h2" className="!text-xs !leading-tight font-extrabold uppercase tracking-mx-wider text-text-secondary">
          {label}
        </Typography>
        {tooltipText && <InfoTooltip text={tooltipText} />}
      </header>
      <div className={`grid min-w-0 divide-y divide-border-subtle p-mx-sm sm:divide-y-0 sm:divide-x ${columns}`}>{children}</div>
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
  const toneClass =
    tone === 'success'
      ? 'bg-status-success text-white'
      : tone === 'info'
        ? 'bg-status-info text-white'
        : 'bg-status-warning text-white'

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
      className={`flex min-h-[105px] w-full max-w-full min-w-0 flex-col items-center justify-center gap-1.5 bg-white px-mx-xs py-1.5 text-center ${
        fieldErrors[field]
          ? 'ring-2 ring-status-error/20'
          : changedFields.has(field)
            ? 'ring-2 ring-brand-primary/10'
            : ''
      }`}
    >
      <div className="min-h-4 flex items-center justify-center">
        <Typography variant="caption" tone="muted" className="text-[10px] font-bold normal-case tracking-normal">
          {label}
        </Typography>
        {crmBadge && (
          <Badge variant="outline" className="ml-mx-xs rounded-mx-full px-2 py-0 text-[9px] bg-brand-primary/5 text-brand-primary border-brand-primary/10">
            CRM
          </Badge>
        )}
      </div>
      <span className={`grid h-8 w-8 place-items-center rounded-full ${toneClass} shadow-inner`}>
        <Icon size={14} />
      </span>

      {/* Grouped control [-] [ 12 ] [+] */}
      <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-border-default p-0.5 bg-slate-50 shadow-inner focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary/40 transition-all mt-1">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          disabled={disabled || (Number(form[field]) <= 0 && displayValue <= 0)}
          onClick={() => setNext(displayValue - 1)}
          className="grid h-6 w-9 place-items-center rounded bg-white text-text-primary border border-border-subtle shadow-xs hover:bg-status-error-surface disabled:opacity-40 transition-colors"
        >
          <Minus size={13} />
        </button>

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
          className="h-6 w-12 bg-white text-center text-sm font-bold text-text-primary border border-border-subtle rounded shadow-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none transition-all"
        />

        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          disabled={disabled || displayValue >= CHECKIN_MAX_INPUT_VALUE}
          onClick={() => setNext(displayValue + 1)}
          className="grid h-6 w-9 place-items-center rounded bg-white text-text-primary border border-border-subtle shadow-xs hover:bg-status-success-surface disabled:opacity-40 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {fieldErrors[field] && (
        <Typography variant="tiny" tone="error" className="font-semibold">
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
      ? 'bg-status-success-surface text-status-success'
      : tone === 'info'
        ? 'bg-status-info-surface text-status-info'
        : 'bg-status-warning-surface text-status-warning'

  return (
    <div className="grid min-h-[98px] place-items-center rounded-mx-lg border border-border-subtle bg-white p-mx-xs text-center shadow-xs">
      <Typography variant="caption" tone="muted" className="text-[10px] normal-case tracking-normal font-bold">
        {label}
      </Typography>
      <span className={`max-w-full font-black text-status-success tabular-nums ${value.length > 7 ? 'text-sm' : 'text-base'}`}>{value}</span>
      <span className={`grid h-8 w-8 place-items-center rounded-full ${iconClass}`}>
        <Icon size={14} />
      </span>
    </div>
  )
}
