import { AnimatePresence, motion } from 'motion/react'
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

export function CheckinForm({ ctx, totalsAgd, totalsVnd }: CheckinFormProps) {
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
  } = ctx

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
  const completedItems = [
    display.leads > 0 ? 'Registro de leads' : null,
    display.visitas > 0 ? 'Atendimentos lançados' : null,
    display.agd > 0 ? 'Agendamentos D+1' : null,
    display.vendas > 0 ? 'Vendas registradas' : null,
  ].filter(Boolean) as string[]
  const pendingItems = [
    display.leads === 0 ? 'Enriquecer carteira' : null,
    mandatoryFeedbackActionsCount > 0 ? 'Feedback obrigatório' : null,
  ].filter(Boolean) as string[]
  const disciplinePercent = useReferenceValues ? 70 : Math.round((completedItems.length / 4) * 100)

  const counterProps = {
    form,
    fieldErrors,
    numberDrafts,
    changedFields,
    updateField,
    updateNumberField,
    commitNumberField,
    readValue,
  }

  return (
<form onSubmit={handleSubmit} className="mt-mx-lg grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-mx-md pb-16">
      {(funnelError || inputError) && (
        <CheckinValidationBanner
          metricScope={metricScope}
          minutesUntilEditLock={minutesUntilEditLock}
          funnelError={funnelError}
          inputError={inputError}
        />
      )}

      <section className="grid w-full max-w-full min-w-0 gap-mx-md lg:grid-cols-[1fr_1.45fr_1fr]">
        <MetricGroupCard title="1. LEADS RECEBIDOS HOJE" columns="grid-cols-1 sm:grid-cols-2">
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

        <MetricGroupCard title="2. ATENDIMENTOS HOJE" columns="grid-cols-1 sm:grid-cols-3">
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

      <MetricGroupCard title="3. AGENDAMENTO D+1" columns="grid-cols-1 sm:grid-cols-2">
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

          <CheckinCrmSection />

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

<section className="grid w-full max-w-full min-w-0 gap-mx-md xl:grid-cols-2">
        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
          <Typography variant="h2" className="text-base font-semibold">
            Resumo do Dia Anterior
          </Typography>
          <div className="mt-mx-sm grid grid-cols-5 gap-mx-xs">
            <ResumoItem label="Leads Recebidos" value={String(display.leads)} icon={Users} />
            <ResumoItem label="Atendimentos" value={String(display.visitas)} icon={Globe} tone="info" />
            <ResumoItem label="Agendamentos D+1" value={String(display.agd)} icon={Users} />
            <ResumoItem label="Vendas Realizadas" value={String(display.vendas)} icon={DollarSign} tone="warning" />
            <ResumoItem label="Faturamento" value={BRL(display.vendas * 14690)} icon={CheckCircle2} />
          </div>
        </Card>

        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
          <div className="flex flex-col items-start gap-mx-md sm:flex-row sm:items-center">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-brand-primary) ${disciplinePercent * 3.6}deg, var(--color-border-subtle) 0deg)`,
              }}
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white">
                <span className="text-2xl font-semibold tabular-nums">{disciplinePercent}%</span>
              </div>
            </div>
            <div className="grid w-full min-w-0 flex-1 gap-mx-md md:grid-cols-2">
              <div>
                <Typography variant="h3" className="text-base font-semibold">
                  Disciplina - Fechamento Diário
                </Typography>
                <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                  Itens concluídos ({completedItems.length})
                </Typography>
                <ul className="mt-mx-xs space-y-mx-xs">
                  {(completedItems.length ? completedItems : ['Nenhum item concluído ainda']).map(item => (
                    <li key={item} className="flex items-center gap-mx-xs text-xs text-text-secondary">
                      <CheckCircle2 size={14} className="text-status-success" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                  Pendentes ({pendingItems.length})
                </Typography>
                <ul className="mt-mx-xs space-y-mx-xs">
                  {(pendingItems.length ? pendingItems : ['Sem pendências críticas']).map(item => (
                    <li key={item} className="flex items-center gap-mx-xs text-xs text-text-secondary">
                      <span className="h-2 w-2 rounded-full bg-status-warning" /> {item}
                    </li>
                  ))}
                </ul>
                <Button type="button" variant="ghost" size="sm" className="mt-mx-sm">
                  Ver disciplina completa
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

{isLate && (
        <div className="rounded-mx-xl border border-status-error/30 bg-status-error-surface p-mx-md shadow-mx-sm">
          <div className="flex items-start gap-mx-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-error" />
            <Typography variant="p" className="text-sm font-semibold text-status-error">
              {deadlineMessage || 'Prazo encerrado. Solicite liberação ao seu gerente para finalizar este fechamento.'}
            </Typography>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('Preciso de liberação para finalizar meu Fechamento Diário (prazo encerrado).')}`}
            target="_blank"
            rel="noreferrer"
            className="mt-mx-sm inline-flex h-mx-11 items-center justify-center gap-mx-xs rounded-mx-lg bg-status-success px-mx-md text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            <MessageSquare size={16} /> Avisar gerente no WhatsApp
          </a>
        </div>
      )}

      <div className="min-w-0 rounded-mx-xl border border-border-default bg-white p-mx-sm shadow-mx-sm">
<div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-mx-md md:grid-cols-[0.45fr_1fr]">
          <Button type="button" variant="outline" disabled={saving || (!canEditExisting && metricScope === 'daily')} onClick={() => void handleSaveDraft()} className="h-mx-14 w-full max-w-full">
            <Save size={18} /> Salvar rascunho
          </Button>
          <Button
            type="submit"
            disabled={saving || (!canEditExisting && metricScope === 'daily')}
 className="h-mx-14 w-full max-w-full whitespace-normal bg-brand-secondary text-center font-semibold uppercase tracking-wide"
          >
            {saving ? (
              <RefreshCw className="h-mx-lg w-mx-lg animate-spin" />
            ) : (
              <>
                <LockKeyhole size={18} /> Finalizar fechamento do dia
              </>
            )}
          </Button>
        </div>
        <Typography variant="p" tone="muted" className="mt-mx-sm flex items-center justify-center gap-mx-xs text-xs">
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
}: {
  title: string
  columns: string
  children: ReactNode
}) {
  return (
      <Card className="min-w-0 rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
      <Typography variant="h2" className="text-sm font-semibold uppercase tracking-normal">
        {title}
      </Typography>
      <div className={`mt-mx-sm grid min-w-0 gap-mx-sm sm:gap-mx-md ${columns}`}>{children}</div>
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
}) {
  const displayValue = readValue(field)
  const inputValue = numberDrafts[field] ?? String(displayValue)
  const toneClass =
    tone === 'success'
      ? 'bg-status-success text-white'
      : tone === 'info'
        ? 'bg-status-info text-white'
        : 'bg-status-warning text-white'

  const setNext = (next: number) => updateField(field, Math.max(0, Math.min(CHECKIN_MAX_INPUT_VALUE, next)))

  return (
    <div
      className={`flex min-h-[126px] w-full max-w-full min-w-0 flex-col items-center justify-between rounded-mx-xl border bg-white p-mx-xs text-center shadow-mx-sm sm:p-mx-sm ${
        fieldErrors[field]
          ? 'border-status-error/50'
          : changedFields.has(field)
            ? 'border-brand-primary/40 ring-2 ring-brand-primary/10'
            : 'border-border-default'
      }`}
    >
      <div className="min-h-5">
        <Typography variant="caption" tone="muted" className="text-[11px] font-semibold normal-case tracking-normal">
          {label}
        </Typography>
        {crmBadge && (
          <Badge variant="outline" className="ml-mx-xs rounded-mx-full px-2 py-0 text-[9px]">
            CRM
          </Badge>
        )}
      </div>
      <span className={`grid h-mx-xl w-mx-xl place-items-center rounded-full ${toneClass}`}>
        <Icon size={20} />
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={CHECKIN_MAX_INPUT_VALUE}
        name={String(field)}
        aria-label={label}
        aria-invalid={Boolean(fieldErrors[field])}
        value={inputValue}
        onChange={event => updateNumberField(field, event.target.value)}
        onBlur={() => commitNumberField(field)}
        className="h-7 w-full bg-transparent text-center text-2xl font-semibold leading-none text-text-primary outline-none tabular-nums"
      />
      <div className="grid h-7 w-full grid-cols-[34px_1fr_34px] overflow-hidden rounded-mx-md border border-border-default">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          disabled={Number(form[field]) <= 0 && displayValue <= 0}
          onClick={() => setNext(displayValue - 1)}
          className="grid place-items-center bg-white text-text-primary transition-colors hover:bg-status-error-surface disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <span className="grid place-items-center border-x border-border-default text-sm font-semibold tabular-nums text-text-primary">
          {displayValue}
        </span>
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          disabled={displayValue >= CHECKIN_MAX_INPUT_VALUE}
          onClick={() => setNext(displayValue + 1)}
          className="grid place-items-center bg-white text-text-primary transition-colors hover:bg-status-success-surface disabled:opacity-40"
        >
          <Plus size={16} />
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
    <div className="grid min-h-[98px] place-items-center rounded-mx-lg border border-border-subtle bg-white p-mx-xs text-center">
      <Typography variant="caption" tone="muted" className="text-[10px] normal-case tracking-normal">
        {label}
      </Typography>
      <span className={`max-w-full font-semibold text-status-success tabular-nums ${value.length > 7 ? 'text-sm' : 'text-base'}`}>{value}</span>
      <span className={`grid h-8 w-8 place-items-center rounded-full ${iconClass}`}>
        <Icon size={15} />
      </span>
    </div>
  )
}
