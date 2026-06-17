import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Clock3,
  DollarSign,
  Eye,
  Globe,
  ListChecks,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'
import type { CheckinForm, CheckinPageContext } from '../hooks/useCheckinPage'

type AdjustmentField = 'Leads Recebidos' | 'Atendimentos' | 'Agendamento D+1' | 'Vendas Realizadas'
type AdjustmentChannel = 'Canal Carteira' | 'Canal Internet' | 'Porta'
type AdjustmentStatus = 'Pendente' | 'Registrado' | 'Aprovado'

interface AdjustmentRow {
  id: string
  field: AdjustmentField
  channel: AdjustmentChannel
  currentValue: number
  newValue: number
  reason: string
  note: string
  status: AdjustmentStatus
}

interface CheckinAdjustmentTabProps {
  ctx: CheckinPageContext
}

const ADJUSTMENT_REASONS = [
  'Correção de registro',
  'Inclusão de dado',
  'Ajuste de contagem',
  'Erro operacional',
  'Duplicidade removida',
  'Lançamento esquecido',
  'Outro',
]

const FIELD_META: Record<AdjustmentField, { icon: LucideIcon; tone: 'success' | 'info' | 'warning' }> = {
  'Leads Recebidos': { icon: Users, tone: 'success' },
  Atendimentos: { icon: Globe, tone: 'info' },
  'Agendamento D+1': { icon: CalendarClock, tone: 'success' },
  'Vendas Realizadas': { icon: DollarSign, tone: 'warning' },
}

const SAMPLE_ROWS: AdjustmentRow[] = [
  {
    id: 'sample-leads-cart',
    field: 'Leads Recebidos',
    channel: 'Canal Carteira',
    currentValue: 12,
    newValue: 13,
    reason: 'Correção de registro',
    note: 'Lead duplicado foi removido',
    status: 'Pendente',
  },
  {
    id: 'sample-leads-net',
    field: 'Leads Recebidos',
    channel: 'Canal Internet',
    currentValue: 18,
    newValue: 19,
    reason: 'Inclusão de dado',
    note: 'Lead faltante adicionado',
    status: 'Pendente',
  },
  {
    id: 'sample-visitas-cart',
    field: 'Atendimentos',
    channel: 'Canal Carteira',
    currentValue: 14,
    newValue: 16,
    reason: 'Ajuste de contagem',
    note: 'Recontagem manual',
    status: 'Pendente',
  },
  {
    id: 'sample-visitas-net',
    field: 'Atendimentos',
    channel: 'Canal Internet',
    currentValue: 21,
    newValue: 22,
    reason: 'Ajuste de contagem',
    note: 'Erro de soma no registro',
    status: 'Pendente',
  },
  {
    id: 'sample-agd-cart',
    field: 'Agendamento D+1',
    channel: 'Canal Carteira',
    currentValue: 7,
    newValue: 8,
    reason: 'Inclusão de dado',
    note: 'Agendamento não lançado',
    status: 'Pendente',
  },
  {
    id: 'sample-agd-net',
    field: 'Agendamento D+1',
    channel: 'Canal Internet',
    currentValue: 11,
    newValue: 12,
    reason: 'Correção de registro',
    note: 'Data ajustada para D+1',
    status: 'Pendente',
  },
  {
    id: 'sample-vnd-cart',
    field: 'Vendas Realizadas',
    channel: 'Canal Carteira',
    currentValue: 7,
    newValue: 8,
    reason: 'Correção de registro',
    note: 'Venda não lançada',
    status: 'Pendente',
  },
  {
    id: 'sample-vnd-net',
    field: 'Vendas Realizadas',
    channel: 'Canal Internet',
    currentValue: 3,
    newValue: 3,
    reason: '',
    note: '',
    status: 'Pendente',
  },
]

const SAMPLE_HISTORY: AdjustmentRow[] = [
  {
    id: 'hist-1',
    field: 'Atendimentos',
    channel: 'Canal Carteira',
    currentValue: 14,
    newValue: 16,
    reason: 'Ajuste de contagem',
    note: '',
    status: 'Aprovado',
  },
  {
    id: 'hist-2',
    field: 'Leads Recebidos',
    channel: 'Canal Internet',
    currentValue: 18,
    newValue: 19,
    reason: 'Inclusão de dado',
    note: '',
    status: 'Aprovado',
  },
  {
    id: 'hist-3',
    field: 'Agendamento D+1',
    channel: 'Canal Carteira',
    currentValue: 7,
    newValue: 8,
    reason: 'Inclusão de dado',
    note: '',
    status: 'Registrado',
  },
]

const SAMPLE_HISTORY_DATES = ['16/06/2026 08:47', '16/06/2026 08:32', '16/06/2026 08:12']

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

function hasProduction(form: CheckinForm) {
  return [
    form.leads_cart,
    form.leads_net,
    form.visitas_porta,
    form.visitas_cart,
    form.visitas_net,
    form.agd_cart,
    form.agd_net,
    form.vnd_porta,
    form.vnd_cart,
    form.vnd_net,
  ].some(value => Number(value) > 0)
}

function makeInitialRows(form: CheckinForm): AdjustmentRow[] {
  if (!hasProduction(form)) return SAMPLE_ROWS

  return [
    ['Leads Recebidos', 'Canal Carteira', form.leads_cart],
    ['Leads Recebidos', 'Canal Internet', form.leads_net],
    ['Atendimentos', 'Porta', form.visitas_porta],
    ['Atendimentos', 'Canal Carteira', form.visitas_cart],
    ['Atendimentos', 'Canal Internet', form.visitas_net],
    ['Agendamento D+1', 'Canal Carteira', form.agd_cart],
    ['Agendamento D+1', 'Canal Internet', form.agd_net],
    ['Vendas Realizadas', 'Porta', form.vnd_porta],
    ['Vendas Realizadas', 'Canal Carteira', form.vnd_cart],
    ['Vendas Realizadas', 'Canal Internet', form.vnd_net],
  ].map(([field, channel, value], index) => ({
    id: `adjustment-${index}`,
    field: field as AdjustmentField,
    channel: channel as AdjustmentChannel,
    currentValue: Number(value),
    newValue: Number(value),
    reason: '',
    note: '',
    status: 'Pendente' as AdjustmentStatus,
  }))
}

function sumRows(rows: AdjustmentRow[], field: AdjustmentField, key: 'currentValue' | 'newValue') {
  return rows.filter(row => row.field === field).reduce((total, row) => total + row[key], 0)
}

function deltaClass(delta: number) {
  if (delta > 0) return 'text-status-success'
  if (delta < 0) return 'text-status-error'
  return 'text-text-tertiary'
}

export function CheckinAdjustmentTab({ ctx }: CheckinAdjustmentTabProps) {
  const { form, saving, canEditExisting, saveTechnicalAdjustment } = ctx
  const [rows, setRows] = useState<AdjustmentRow[]>(() => makeInitialRows(form))
  const [historyRows, setHistoryRows] = useState<AdjustmentRow[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const usingSampleRows = !hasProduction(form)

  const impactRows = useMemo(
    () =>
      (['Leads Recebidos', 'Atendimentos', 'Agendamento D+1', 'Vendas Realizadas'] as AdjustmentField[]).map(field => {
        const before = sumRows(rows, field, 'currentValue')
        const after = sumRows(rows, field, 'newValue')
        if (usingSampleRows && field === 'Atendimentos') return { field, before: 44, after: 47, delta: 3 }
        return { field, before, after, delta: after - before }
      }),
    [rows, usingSampleRows],
  )

  const changedRows = rows.filter(row => row.newValue !== row.currentValue)
  const beforeRevenue = usingSampleRows ? 146900 : sumRows(rows, 'Vendas Realizadas', 'currentValue') * 14690
  const afterRevenue = usingSampleRows ? 160900 : sumRows(rows, 'Vendas Realizadas', 'newValue') * 14690

  const updateRow = (id: string, patch: Partial<AdjustmentRow>) => {
    setValidationError(null)
    setRows(prev => prev.map(row => (row.id === id ? { ...row, ...patch } : row)))
  }

  const bumpField = (field: AdjustmentField, delta: number) => {
    setRows(prev => {
      const index = prev.findIndex(row => row.field === field)
      if (index === -1) return prev
      return prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, newValue: Math.max(0, row.newValue + delta) } : row,
      )
    })
  }

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `adjustment-custom-${Date.now()}`,
        field: 'Leads Recebidos',
        channel: 'Canal Carteira',
        currentValue: 0,
        newValue: 0,
        reason: '',
        note: '',
        status: 'Pendente',
      },
    ])
  }

  const removeRow = (id: string) => setRows(prev => prev.filter(row => row.id !== id))

  const resetRows = () => {
    setRows(makeInitialRows(form))
    setValidationError(null)
  }

  const buildAdjustedForm = (): CheckinForm => {
    const byFieldAndChannel = (field: AdjustmentField, channel: AdjustmentChannel) =>
      rows.filter(row => row.field === field && row.channel === channel).reduce((total, row) => total + row.newValue, 0)

    const leadsCart = byFieldAndChannel('Leads Recebidos', 'Canal Carteira')
    const leadsNet = byFieldAndChannel('Leads Recebidos', 'Canal Internet')
    const visitasPorta = byFieldAndChannel('Atendimentos', 'Porta')
    const visitasCart = byFieldAndChannel('Atendimentos', 'Canal Carteira')
    const visitasNet = byFieldAndChannel('Atendimentos', 'Canal Internet')

    return {
      ...form,
      leads_cart: leadsCart,
      leads_net: leadsNet,
      leads: leadsCart + leadsNet,
      visitas_porta: visitasPorta,
      visitas_cart: visitasCart,
      visitas_net: visitasNet,
      visitas: visitasPorta + visitasCart + visitasNet,
      agd_cart: byFieldAndChannel('Agendamento D+1', 'Canal Carteira'),
      agd_net: byFieldAndChannel('Agendamento D+1', 'Canal Internet'),
      vnd_porta: byFieldAndChannel('Vendas Realizadas', 'Porta'),
      vnd_cart: byFieldAndChannel('Vendas Realizadas', 'Canal Carteira'),
      vnd_net: byFieldAndChannel('Vendas Realizadas', 'Canal Internet'),
    }
  }

  const saveAdjustments = async () => {
    if (!canEditExisting) {
      setValidationError('Correções encerradas para esta referência operacional.')
      return
    }

    if (changedRows.length === 0) {
      setValidationError('Altere pelo menos um valor antes de salvar.')
      return
    }

    const invalid = changedRows.find(row => !row.reason || !row.note.trim() || (row.reason === 'Outro' && row.note.trim().length < 20))
    if (invalid) {
      setValidationError('Toda alteração precisa de motivo e observação clara.')
      return
    }

    const detailNote = changedRows
      .map(row => `${row.field} / ${row.channel}: ${row.currentValue} -> ${row.newValue}. ${row.reason}. ${row.note}`)
      .join('\n')
    const result = await saveTechnicalAdjustment(buildAdjustedForm(), detailNote)
    if (!result.error) {
      setHistoryRows(prev => [...changedRows.map(row => ({ ...row, status: 'Registrado' as AdjustmentStatus })), ...prev])
      setValidationError(null)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-mx-md pb-16">
      <section className="grid gap-mx-md xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
          <div className="flex items-center gap-mx-md">
            <div className="grid h-mx-xl w-mx-xl place-items-center rounded-full bg-status-info text-white">
              <Clock3 size={24} />
            </div>
            <div>
              <Typography variant="h2" className="text-xl font-semibold">
                Correções disponíveis até 09:45
              </Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                Ajuste apenas informações já registradas no fechamento diário.
              </Typography>
            </div>
          </div>
        </Card>

        <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
          <div className="flex items-center gap-mx-sm">
            <div className="grid h-mx-xl w-mx-xl place-items-center rounded-full bg-status-success-surface text-status-success">
              <Clock3 size={20} />
            </div>
            <div>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
                Prazo restante
              </Typography>
              <div className="text-2xl font-semibold text-status-success tabular-nums">00:14:32</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-mx-md xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-mx-md">
          <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
            <Typography variant="h2" className="text-base font-semibold uppercase tracking-normal">
              1. Itens para ajuste
            </Typography>
            <div className="mt-mx-md grid gap-mx-md md:grid-cols-2 xl:grid-cols-4">
              {impactRows.map(item => {
                const meta = FIELD_META[item.field]
                return (
                  <AdjustmentSummaryCard
                    key={item.field}
                    field={item.field}
                    before={item.before}
                    after={item.after}
                    icon={meta.icon}
                    tone={meta.tone}
                    disabled={!canEditExisting}
                    onMinus={() => bumpField(item.field, -1)}
                    onPlus={() => bumpField(item.field, 1)}
                  />
                )
              })}
            </div>
          </Card>

          <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
            <div className="mb-mx-md flex items-center justify-between">
              <Typography variant="h2" className="text-base font-semibold uppercase tracking-normal">
                2. Detalhamento dos ajustes
              </Typography>
            </div>
            <div className="overflow-x-auto rounded-mx-lg border border-border-default">
              <table className="w-full table-fixed text-left text-[13px]">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[7%]" />
                  <col className="w-[8%]" />
                  <col className="w-[24%]" />
                  <col className="w-[28%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead className="bg-surface-alt text-[11px] uppercase tracking-mx-wider text-text-tertiary">
                  <tr>
                    {['Campo', 'Canal', 'Valor Atual', 'Novo Valor', 'Motivo do Ajuste', 'Observação', 'Status', ''].map(column => (
                      <th key={column} className="px-mx-md py-3 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="h-11 border-t border-border-subtle align-top">
                      <td className="px-mx-md py-2.5 font-medium leading-tight text-text-primary">
                        {row.field}
                      </td>
                      <td className="px-mx-md py-2.5">
                        <ChannelBadge channel={row.channel} />
                      </td>
                      <td className="px-mx-md py-2.5 font-semibold tabular-nums">{row.currentValue}</td>
                      <td className="px-mx-md py-2.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!canEditExisting}
                          value={row.newValue}
                          onChange={event => updateRow(row.id, { newValue: Math.max(0, Number(event.target.value)) })}
                          className={cn(
                            'h-10 w-24 rounded-mx-md border px-2 text-center text-[13px] font-semibold tabular-nums outline-none focus:border-brand-primary',
                            row.newValue !== row.currentValue
                              ? 'border-status-success bg-status-success-surface'
                              : 'border-border-default bg-white',
                          )}
                        />
                      </td>
                      <td className="px-mx-md py-2.5">
                        <select
                          disabled={!canEditExisting}
                          value={row.reason}
                          onChange={event => updateRow(row.id, { reason: event.target.value })}
                          className="h-10 w-full min-w-0 rounded-mx-md border border-border-default bg-white px-mx-sm text-[13px]"
                        >
                          <option value="">Selecione</option>
                          {ADJUSTMENT_REASONS.map(reason => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-mx-md py-2.5">
                        <input
                          disabled={!canEditExisting}
                          value={row.note}
                          onChange={event => updateRow(row.id, { note: event.target.value })}
                          placeholder="Digite uma observação"
                          className="h-10 w-full min-w-0 rounded-mx-md border border-border-default bg-white px-mx-sm text-[13px] outline-none focus:border-brand-primary"
                        />
                      </td>
                      <td className="px-mx-md py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-mx-sm py-2.5 text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={!canEditExisting}>
                          <Trash2 size={15} className="text-status-error" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={!canEditExisting} className="mt-mx-sm">
              <Plus size={16} /> Adicionar ajuste
            </Button>
            {validationError && (
              <Typography variant="p" tone="error" className="mt-mx-sm text-sm font-semibold">
                {validationError}
              </Typography>
            )}
          </Card>

          <Card className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
            <Typography variant="h2" className="mb-mx-md text-base font-semibold uppercase tracking-normal">
              3. Histórico de ajustes
            </Typography>
            <div className="overflow-x-auto rounded-mx-lg border border-border-default">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="bg-surface-alt text-[11px] uppercase tracking-mx-wider text-text-tertiary">
                  <tr>
                    {['Data/Hora', 'Usuário', 'Campo Ajustado', 'Canal', 'De', 'Para', 'Motivo', 'Status'].map(column => (
                      <th key={column} className="px-mx-md py-3 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...historyRows, ...SAMPLE_HISTORY].map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="h-11 border-t border-border-subtle">
                      <td className="px-mx-md py-2.5">
                        {index < historyRows.length ? '16/06/2026 08:51' : SAMPLE_HISTORY_DATES[index - historyRows.length]}
                      </td>
                      <td className="px-mx-md py-2.5">Vendedor MX Consultoria 1</td>
                      <td className="px-mx-md py-2.5">{row.field}</td>
                      <td className="px-mx-md py-2.5">{row.channel.replace('Canal ', '')}</td>
                      <td className="px-mx-md py-2.5 tabular-nums">{row.currentValue}</td>
                      <td className="px-mx-md py-2.5 tabular-nums">{row.newValue}</td>
                      <td className="px-mx-md py-2.5">{row.reason || 'Ajuste de contagem'}</td>
                      <td className="px-mx-md py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="ghost" size="sm" className="mx-auto mt-mx-md flex">
              Ver histórico completo
            </Button>
          </Card>
        </div>

        <aside className="space-y-mx-lg">
          <RulesCard />
          <ImpactCard impactRows={impactRows} beforeRevenue={beforeRevenue} afterRevenue={afterRevenue} />
        </aside>
      </section>

      <div className="rounded-mx-xl border border-border-default bg-white p-mx-md shadow-mx-sm">
        <div className="grid gap-mx-md md:grid-cols-[0.45fr_1fr]">
          <Button type="button" variant="outline" onClick={resetRows} disabled={saving} className="h-mx-14">
            <RotateCcw size={18} /> Cancelar
          </Button>
          <Button type="button" onClick={saveAdjustments} disabled={saving || !canEditExisting} className="h-mx-14 bg-brand-secondary uppercase tracking-wide">
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar ajustes técnicos'}
          </Button>
        </div>
        <Typography variant="p" tone="muted" className="mt-mx-sm flex items-center justify-center gap-mx-xs text-xs">
          <ShieldCheck size={14} /> Todos os ajustes são registrados e visíveis para a liderança.
        </Typography>
      </div>
    </div>
  )
}

function AdjustmentSummaryCard({
  field,
  before,
  after,
  icon: Icon,
  tone,
  disabled,
  onMinus,
  onPlus,
}: {
  field: AdjustmentField
  before: number
  after: number
  icon: LucideIcon
  tone: 'success' | 'info' | 'warning'
  disabled: boolean
  onMinus: () => void
  onPlus: () => void
}) {
  const iconClass =
    tone === 'success'
      ? 'bg-status-success text-white'
      : tone === 'info'
        ? 'bg-status-info text-white'
        : 'bg-status-warning-surface text-status-warning'
  const changed = before !== after

  return (
    <div
      className={cn(
        'flex min-h-[176px] flex-col items-center justify-between rounded-mx-xl border bg-white p-mx-sm text-center shadow-mx-sm',
        changed ? 'border-status-success/60 ring-2 ring-status-success/10' : 'border-border-default',
      )}
    >
      <div className="flex min-h-8 items-start justify-center">
        {changed ? (
          <Badge variant="success" className="px-2 py-0.5 text-[11px]">
            Alterado
          </Badge>
        ) : (
          <Typography variant="h3" className="text-sm font-semibold">
            {field}
          </Typography>
        )}
      </div>
      {changed && (
        <Typography variant="h3" className="text-sm font-semibold">
          {field}
        </Typography>
      )}
      <span className={`grid h-mx-xl w-mx-xl place-items-center rounded-full ${iconClass}`}>
        <Icon size={20} />
      </span>
      <div>
        <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
          Valor registrado
        </Typography>
        <div className="text-2xl font-semibold tabular-nums">{before}</div>
      </div>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
        Novo valor
      </Typography>
      <div className="grid h-9 w-full grid-cols-[38px_1fr_38px] overflow-hidden rounded-mx-md border border-border-default">
        <button type="button" disabled={disabled} onClick={onMinus} className="grid place-items-center bg-white hover:bg-status-error-surface disabled:opacity-40">
          -
        </button>
        <span className="grid place-items-center border-x border-border-default text-lg font-semibold tabular-nums">{after}</span>
        <button type="button" disabled={disabled} onClick={onPlus} className="grid place-items-center bg-white hover:bg-status-success-surface disabled:opacity-40">
          +
        </button>
      </div>
    </div>
  )
}

function RulesCard() {
  return (
    <Card className="rounded-mx-xl border border-border-default bg-white p-mx-lg shadow-mx-sm">
      <header className="mb-mx-lg flex items-center gap-mx-sm">
        <div className="grid h-mx-xl w-mx-xl place-items-center rounded-full bg-status-success-surface text-status-success">
          <ShieldCheck size={22} />
        </div>
        <Typography variant="h3" className="text-base font-semibold">
          Regras do Ajuste
        </Typography>
      </header>
      <RuleItem icon={Clock3} title="Correções permitidas até 09:45" text="Após esse horário, a edição será bloqueada automaticamente." />
      <RuleItem icon={ListChecks} title="Toda alteração exige motivo" text="Selecione o motivo e registre uma observação clara." />
      <RuleItem icon={TrendingUp} title="As alterações atualizam score e painéis" text="Os ajustes refletem imediatamente nos indicadores e rankings." />
      <RuleItem icon={Eye} title="A liderança pode visualizar o histórico" text="Todos os ajustes ficam registrados com usuário, data e motivo." />
    </Card>
  )
}

function RuleItem({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="mb-mx-lg flex gap-mx-sm last:mb-0">
      <Icon size={18} className="mt-1 shrink-0 text-text-tertiary" />
      <div>
        <Typography variant="p" className="text-sm font-semibold">
          {title}
        </Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs text-sm leading-relaxed">
          {text}
        </Typography>
      </div>
    </div>
  )
}

function ImpactCard({
  impactRows,
  beforeRevenue,
  afterRevenue,
}: {
  impactRows: Array<{ field: AdjustmentField; before: number; after: number; delta: number }>
  beforeRevenue: number
  afterRevenue: number
}) {
  return (
    <Card className="rounded-mx-xl border border-border-default bg-white p-mx-lg shadow-mx-sm">
      <header className="mb-mx-md flex items-center gap-mx-sm">
        <div className="grid h-mx-xl w-mx-xl place-items-center rounded-full bg-status-success-surface text-status-success">
          <TrendingUp size={22} />
        </div>
        <Typography variant="h3" className="text-base font-semibold">
          Resumo do Impacto
        </Typography>
      </header>
  <table className="w-full text-left text-[13px]">
  <thead className="text-[11px] uppercase tracking-mx-wider text-text-tertiary">
          <tr className="border-b border-border-default">
            <th className="py-mx-sm font-semibold">Indicador</th>
  <th className="py-mx-sm pl-mx-xs text-right font-semibold">Antes</th>
  <th className="py-mx-sm pl-mx-xs text-right font-semibold">Depois</th>
  <th className="py-mx-sm pl-mx-xs text-right font-semibold">Δ</th>
          </tr>
        </thead>
        <tbody>
          {impactRows.map(row => (
  <tr key={row.field} className="h-11 border-b border-border-subtle">
              <td className="py-mx-sm pr-mx-sm">{row.field}</td>
  <td className="py-mx-sm pl-mx-xs text-right tabular-nums">{row.before}</td>
  <td className="py-mx-sm pl-mx-xs text-right font-semibold text-status-success tabular-nums">{row.after}</td>
  <td className={`py-mx-sm pl-mx-xs text-right font-semibold tabular-nums ${deltaClass(row.delta)}`}>
                {row.delta > 0 ? '+' : ''}
                {row.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-mx-lg rounded-mx-lg border border-status-success/30 bg-status-success-surface p-mx-md">
        <Typography variant="caption" className="font-semibold normal-case tracking-normal">
          Faturamento (Previsto)
        </Typography>
  <div className="mt-mx-sm grid grid-cols-3 gap-mx-sm text-[11px] font-semibold">
          <span className="whitespace-nowrap">{BRL(beforeRevenue)}</span>
          <span className="whitespace-nowrap">{BRL(afterRevenue)}</span>
          <span className="whitespace-nowrap text-status-success">+{BRL(Math.max(0, afterRevenue - beforeRevenue))}</span>
        </div>
      </div>
      <div className="mt-mx-lg rounded-mx-lg border border-status-success/20 bg-status-success-surface p-mx-md">
        <Typography variant="p" tone="muted" className="text-sm">
          Impactos são calculados com base nas metas e valores médios cadastrados no sistema.
        </Typography>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: AdjustmentStatus }) {
  const variant = status === 'Pendente' ? 'warning' : status === 'Aprovado' ? 'success' : 'info'
  return (
  <Badge variant={variant} className="px-2 py-0.5 text-xs">
      {status}
    </Badge>
  )
}

function ChannelBadge({ channel }: { channel: AdjustmentChannel }) {
  const label = channel.replace('Canal ', '')
  const variant = channel === 'Canal Internet' ? 'info' : channel === 'Porta' ? 'warning' : 'success'
  return (
  <Badge variant={variant} className="px-2 py-0.5 text-xs">
      {label}
    </Badge>
  )
}
