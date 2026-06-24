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
  'Fechamento esquecido',
  'Outro',
]

const FIELD_META: Record<AdjustmentField, { icon: LucideIcon; tone: 'success' | 'info' | 'warning' }> = {
  'Leads Recebidos': { icon: Users, tone: 'success' },
  Atendimentos: { icon: Globe, tone: 'info' },
  'Agendamento D+1': { icon: CalendarClock, tone: 'success' },
  'Vendas Realizadas': { icon: DollarSign, tone: 'warning' },
}

const isDev = import.meta.env.DEV

const SAMPLE_ROWS: AdjustmentRow[] = isDev ? [
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
] : []

const SAMPLE_HISTORY: AdjustmentRow[] = isDev ? [
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
] : []

const SAMPLE_HISTORY_DATES = isDev ? ['16/06/2026 08:47', '16/06/2026 08:32', '16/06/2026 08:12'] : []

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
  const usingSampleRows = !hasProduction(form) && isDev

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
  
  const beforeSalesCount = sumRows(rows, 'Vendas Realizadas', 'currentValue')
  const afterSalesCount = sumRows(rows, 'Vendas Realizadas', 'newValue')
  
  const beforeRevenue = usingSampleRows ? 146900 : (ctx.realFaturamento || 0)
  const ticketMedio = beforeSalesCount > 0 ? (beforeRevenue / beforeSalesCount) : 0
  const afterRevenue = usingSampleRows ? 160900 : (afterSalesCount * ticketMedio)

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
    <div className="mt-6 grid w-full gap-6 pb-16">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-[18px] border border-[#dfe7f0] border-l-4 border-l-[#2563eb] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#061a33] text-[#2563eb]">
              <Clock3 size={26} />
            </div>
            <div>
              <Typography variant="h2" className="text-xl font-black text-[#111827]">
                CORREÇÕES DISPONÍVEIS ATÉ 09:45
              </Typography>
              <Typography variant="p" className="mt-1 text-sm font-semibold text-[#64748b]">
                Ajuste apenas informações já registradas no fechamento diário.
              </Typography>
            </div>
          </div>
        </Card>

        <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#ecfdf5] text-[#16a34a]">
              <Clock3 size={20} />
            </div>
            <div>
              <Typography variant="caption" className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider">
                Prazo restante
              </Typography>
              <div className="text-xl font-bold text-[#16a34a] tabular-nums">00:14:32</div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <Typography variant="h2" className="text-sm font-extrabold uppercase tracking-wider text-[#334155] border-b border-[#eef2f7] pb-3">
              1. Itens para ajuste
            </Typography>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

          <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#eef2f7] pb-3">
              <Typography variant="h2" className="text-sm font-extrabold uppercase tracking-wider text-[#334155]">
                2. Detalhamento dos ajustes
              </Typography>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#e5eaf2]">
              <table className="w-full table-fixed text-left text-[13px]">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wider text-[#475569] border-b border-[#e5eaf2]">
                  <tr>
                    {['Campo', 'Canal', 'Valor Atual', 'Novo Valor', 'Motivo do Ajuste', 'Observação', 'Status', ''].map(column => (
                      <th scope="col" key={column} className="px-4 py-3.5 font-extrabold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm font-semibold text-[#64748b] bg-white">
                        Nenhum item disponível para ajuste técnico.
                      </td>
                    </tr>
                  ) : (
                    rows.map(row => (
                      <tr key={row.id} className="border-t border-[#eef2f7] hover:bg-[#f8fafc] transition-colors align-top">
                        <td className="px-4 py-3.5 font-bold text-[#111827] leading-tight">
                          {row.field}
                        </td>
                        <td className="px-4 py-3.5">
                          <ChannelBadge channel={row.channel} />
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#111827] tabular-nums">{row.currentValue}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            disabled={!canEditExisting}
                            value={row.newValue}
                            onChange={event => updateRow(row.id, { newValue: Math.max(0, Number(event.target.value)) })}
                            className={cn(
                              'h-10 w-20 rounded-xl border px-2 text-center text-[13px] font-bold tabular-nums outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10',
                              row.newValue !== row.currentValue
                                ? 'border-[#16a34a] bg-[#ecfdf5] text-[#16a34a]'
                                : 'border-[#e5eaf2] bg-white text-[#111827]',
                            )}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            disabled={!canEditExisting}
                            value={row.reason}
                            onChange={event => updateRow(row.id, { reason: event.target.value })}
                            className="h-10 w-full min-w-0 rounded-xl border border-[#e5eaf2] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none transition focus:border-[#2563eb]"
                          >
                            <option value="">Selecione</option>
                            {ADJUSTMENT_REASONS.map(reason => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            disabled={!canEditExisting}
                            value={row.note}
                            onChange={event => updateRow(row.id, { note: event.target.value })}
                            placeholder="Digite uma observação"
                            className="h-10 w-full min-w-0 rounded-xl border border-[#e5eaf2] bg-white px-3 text-[13px] font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] placeholder:text-[#94a3b8]"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={!canEditExisting}
                            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 hover:bg-[#fef2f2] hover:text-[#ef4444] transition-colors disabled:opacity-40"
                            title="Remover ajuste"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addRow}
              disabled={!canEditExisting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e5eaf2] bg-white px-4 text-xs font-bold text-[#475569] hover:bg-[#f8fafc] transition-all mt-4"
            >
              <Plus size={14} /> Adicionar ajuste
            </button>
            {validationError && (
              <Typography variant="p" className="mt-3 text-sm font-bold text-[#ef4444]">
                {validationError}
              </Typography>
            )}
          </Card>

          <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <Typography variant="h2" className="mb-4 text-sm font-extrabold uppercase tracking-wider text-[#334155] border-b border-[#eef2f7] pb-3">
              3. Histórico de ajustes
            </Typography>
            <div className="overflow-x-auto rounded-xl border border-[#e5eaf2]">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wider text-[#475569] border-b border-[#e5eaf2]">
                  <tr>
                    {['Data/Hora', 'Usuário', 'Campo Ajustado', 'Canal', 'De', 'Para', 'Motivo', 'Status'].map(column => (
                      <th scope="col" key={column} className="px-4 py-3.5 font-extrabold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.length === 0 && SAMPLE_HISTORY.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-sm font-semibold text-[#64748b] bg-white">
                        Nenhum histórico de ajuste técnico encontrado.
                      </td>
                    </tr>
                  ) : (
                    [...historyRows, ...SAMPLE_HISTORY].map((row, index) => (
                      <tr key={`${row.id}-${index}`} className="h-[52px] border-t border-[#eef2f7] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3.5 text-[#475569]">
                          {index < historyRows.length ? '16/06/2026 08:51' : SAMPLE_HISTORY_DATES[index - historyRows.length]}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#111827]">Vendedor MX Consultoria 1</td>
                        <td className="px-4 py-3.5 font-semibold text-[#111827]">{row.field}</td>
                        <td className="px-4 py-3.5">
                          <ChannelBadge channel={row.channel} />
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#475569] tabular-nums">{row.currentValue}</td>
                        <td className="px-4 py-3.5 font-bold text-[#111827] tabular-nums">{row.newValue}</td>
                        <td className="px-4 py-3.5 text-[#475569]">{row.reason || 'Ajuste de contagem'}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="mx-auto mt-5 flex h-9 items-center justify-center rounded-lg border border-[#e5eaf2] bg-white px-4 text-xs font-bold text-[#475569] hover:bg-[#f8fafc] transition-all"
            >
              Ver histórico completo
            </button>
          </Card>
        </div>

        <aside className="space-y-6">
          <RulesCard />
          <ImpactCard impactRows={impactRows} beforeRevenue={beforeRevenue} afterRevenue={afterRevenue} />
        </aside>
      </section>

      <div className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
          <button
            type="button"
            onClick={resetRows}
            disabled={saving}
            className="h-12 rounded-xl border border-[#e5eaf2] bg-white text-sm font-bold text-[#475569] hover:bg-[#f8fafc] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Cancelar
          </button>
          <button
            type="button"
            onClick={saveAdjustments}
            disabled={saving || !canEditExisting}
            className="h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold uppercase tracking-wider shadow-[0_10px_20px_rgba(37,99,235,0.22)] transition-all flex items-center justify-center gap-2 disabled:bg-[#94a3b8]"
          >
            <Save size={18} /> {saving ? 'Salvando...' : 'Salvar ajustes técnicos'}
          </button>
        </div>
        <Typography variant="p" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#64748b]">
          <ShieldCheck size={14} className="text-[#16a34a]" /> Todos os ajustes são registrados e visíveis para a liderança.
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
      ? 'bg-[#ecfdf5] text-[#16a34a]'
      : tone === 'info'
        ? 'bg-[#eff6ff] text-[#2563eb]'
        : 'bg-[#fffbeb] text-[#f59e0b]'
  const changed = before !== after

  return (
    <div
      className={cn(
        'flex min-h-[188px] flex-col items-center justify-between rounded-xl border p-4 text-center shadow-sm transition-all',
        changed ? 'border-[#16a34a] bg-[#ecfdf5]/30 ring-2 ring-[#16a34a]/10' : 'border-[#e5eaf2] bg-white',
      )}
    >
      <div className="flex min-h-8 items-start justify-center">
        {changed ? (
          <Badge variant="success" className="px-2 py-0.5 text-[11px] bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
            Alterado
          </Badge>
        ) : (
          <Typography variant="h3" className="text-xs font-extrabold uppercase text-[#475569] tracking-wider">
            {field}
          </Typography>
        )}
      </div>
      {changed && (
        <Typography variant="h3" className="text-xs font-extrabold uppercase text-[#475569] tracking-wider">
          {field}
        </Typography>
      )}
      <span className={`grid h-10 w-10 place-items-center rounded-full ${iconClass}`}>
        <Icon size={18} />
      </span>
      <div>
        <Typography variant="caption" className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider normal-case">
          Valor registrado
        </Typography>
        <div className="text-xl font-bold text-[#111827] tabular-nums">{before}</div>
      </div>
      <div className="flex flex-col gap-1 w-full">
        <Typography variant="caption" className="text-[10px] font-extrabold uppercase text-[#94a3b8] tracking-wider normal-case">
          Novo valor
        </Typography>
        <div className="grid h-9 w-full grid-cols-[34px_1fr_34px] overflow-hidden rounded-lg border border-[#e5eaf2] bg-white">
          <button
            type="button"
            disabled={disabled}
            onClick={onMinus}
            className="grid place-items-center bg-white text-sm font-bold text-[#475569] hover:bg-[#fef2f2] hover:text-[#ef4444] disabled:opacity-40 border-r border-[#e5eaf2] transition-colors"
          >
            -
          </button>
          <span className="grid place-items-center text-sm font-bold text-[#111827] tabular-nums">{after}</span>
          <button
            type="button"
            disabled={disabled}
            onClick={onPlus}
            className="grid place-items-center bg-white text-sm font-bold text-[#475569] hover:bg-[#ecfdf5] hover:text-[#16a34a] disabled:opacity-40 border-l border-[#e5eaf2] transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

function RulesCard() {
  return (
    <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <header className="mb-4 flex items-center gap-3 border-b border-[#eef2f7] pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <ShieldCheck size={20} />
        </div>
        <Typography variant="h3" className="text-sm font-extrabold text-[#111827]">
          Regras do Ajuste
        </Typography>
      </header>
      <div className="space-y-4">
        <RuleItem icon={Clock3} title="Correções permitidas até 09:45" text="Após esse horário, a edição será bloqueada automaticamente." />
        <RuleItem icon={ListChecks} title="Toda alteração exige motivo" text="Selecione o motivo e registre uma observação clara." />
        <RuleItem icon={TrendingUp} title="As alterações atualizam score e painéis" text="Os ajustes refletem imediatamente nos indicadores e rankings." />
        <RuleItem icon={Eye} title="A liderança pode visualizar o histórico" text="Todos os ajustes ficam registrados com usuário, data e motivo." />
      </div>
    </Card>
  )
}

function RuleItem({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-[#64748b]" />
      <div>
        <Typography variant="p" className="text-xs font-bold text-[#334155]">
          {title}
        </Typography>
        <Typography variant="p" className="mt-0.5 text-xs leading-relaxed text-[#64748b]">
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
    <Card className="rounded-[18px] border border-[#dfe7f0] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <header className="mb-4 flex items-center gap-3 border-b border-[#eef2f7] pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eff6ff] text-[#2563eb]">
          <TrendingUp size={20} />
        </div>
        <Typography variant="h3" className="text-sm font-extrabold text-[#111827]">
          Resumo do Impacto
        </Typography>
      </header>
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-[#94a3b8] border-b border-[#e5eaf2]">
          <tr>
            <th scope="col" className="pb-2 font-extrabold">Indicador</th>
            <th scope="col" className="pb-2 text-right font-extrabold">Antes</th>
            <th scope="col" className="pb-2 text-right font-extrabold">Depois</th>
            <th scope="col" className="pb-2 text-right font-extrabold">Δ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {impactRows.map(row => (
            <tr key={row.field} className="h-10">
              <td className="py-2 text-[#475569] font-medium">{row.field}</td>
              <td className="py-2 text-right text-[#475569] tabular-nums">{row.before}</td>
              <td className="py-2 text-right font-bold text-[#111827] tabular-nums">{row.after}</td>
              <td className={`py-2 text-right font-bold tabular-nums ${deltaClass(row.delta)}`}>
                {row.delta > 0 ? '+' : ''}
                {row.delta}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-5 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] p-4">
        <Typography variant="caption" className="text-[10px] font-extrabold uppercase text-[#16a34a] tracking-wider">
          Faturamento (Previsto)
        </Typography>
        <div className="mt-1 grid grid-cols-3 gap-2 text-xs font-bold text-[#111827]">
          <span className="whitespace-nowrap text-[#475569]">{BRL(beforeRevenue)}</span>
          <span className="whitespace-nowrap text-[#111827]">{BRL(afterRevenue)}</span>
          <span className="whitespace-nowrap text-[#16a34a]">+{BRL(Math.max(0, afterRevenue - beforeRevenue))}</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-[#e5eaf2] bg-[#f8fafc] p-3">
        <Typography variant="p" className="text-[11px] leading-relaxed text-[#64748b]">
          Impactos são calculados com base nas metas e valores médios cadastrados no sistema.
        </Typography>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: AdjustmentStatus }) {
  const variant = status === 'Pendente' ? 'warning' : status === 'Aprovado' ? 'success' : 'info'
  return (
    <Badge variant={variant} className="px-2.5 py-0.5 text-[11px] font-bold">
      {status}
    </Badge>
  )
}

function ChannelBadge({ channel }: { channel: AdjustmentChannel }) {
  const label = channel.replace('Canal ', '')
  const variant = channel === 'Canal Internet' ? 'info' : channel === 'Porta' ? 'warning' : 'success'
  return (
    <Badge variant={variant} className="px-2.5 py-0.5 text-[11px] font-bold">
      {label}
    </Badge>
  )
}
