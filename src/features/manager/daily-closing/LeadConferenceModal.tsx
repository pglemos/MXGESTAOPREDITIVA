import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, History, RotateCcw, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Modal } from '@/components/organisms/Modal'
import type { CheckinWithTotals } from '@/types/database'
import {
  LEAD_CONFERENCE_PERIOD_LABELS,
  buildLeadConferenceRows,
  getLeadConferencePeriod,
  getLeadConferenceRowDifference,
  summarizeLeadConference,
  toLeadConferencePayload,
  type LeadConferencePeriod,
  type LeadConferencePeriodType,
  type LeadConferenceRow,
  type LeadConferenceSeller,
} from './lead-conference'

interface LeadConferenceHistoryRow {
  id: string
  period_start: string
  period_end: string
  total_mx: number
  total_official: number
  total_difference: number
  divergent_sellers: number
  created_at: string
  manager?: { name?: string | null } | null
}

interface LeadConferenceModalProps {
  open: boolean
  onClose: () => void
  storeId: string | null
  referenceDate: string
  sellers: LeadConferenceSeller[]
  storeName: string
}

export function LeadConferenceModal({ open, onClose, storeId, referenceDate, sellers, storeName }: LeadConferenceModalProps) {
  const [periodType, setPeriodType] = useState<LeadConferencePeriodType>('current_month')
  const [customPeriod, setCustomPeriod] = useState<LeadConferencePeriod>(() => getLeadConferencePeriod('current_month', referenceDate))
  const [rows, setRows] = useState<LeadConferenceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [history, setHistory] = useState<LeadConferenceHistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const fetchSequence = useRef(0)

  const period = useMemo(
    () => getLeadConferencePeriod(periodType, referenceDate, customPeriod),
    [periodType, referenceDate, customPeriod],
  )
  const summary = useMemo(() => summarizeLeadConference(rows), [rows])

  const fetchRows = useCallback(async () => {
    if (!open || !storeId) return
    const sequence = ++fetchSequence.current
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase.rpc('get_lancamentos_por_loja_periodo', {
      p_store_id: storeId,
      p_start_date: period.start,
      p_end_date: period.end,
      p_scope: 'daily',
    })
    if (sequence !== fetchSequence.current) return
    if (fetchError) {
      setRows([])
      setError(fetchError.message)
    } else {
      setRows(buildLeadConferenceRows(sellers, (data || []) as CheckinWithTotals[]))
    }
    setLoading(false)
  }, [open, storeId, period.start, period.end, sellers])

  useEffect(() => {
    if (!open) return
    setPeriodType('current_month')
    setCustomPeriod(getLeadConferencePeriod('current_month', referenceDate))
    setHistoryOpen(false)
  }, [open, referenceDate])

  useEffect(() => { void fetchRows() }, [fetchRows])

  const updateOfficial = (sellerId: string, field: 'internetOfficial' | 'carteiraOfficial', value: string) => {
    const parsed = value === '' ? null : Math.max(0, Math.trunc(Number(value)))
    setRows(current => current.map(row => row.sellerId === sellerId ? { ...row, [field]: Number.isFinite(parsed) ? parsed : null } : row))
  }

  const clearRow = (sellerId: string) => {
    setRows(current => current.map(row => row.sellerId === sellerId ? { ...row, internetOfficial: null, carteiraOfficial: null } : row))
  }

  const save = async () => {
    if (!storeId || !summary.complete) return
    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase.rpc('save_manager_lead_conference', {
      p_store_id: storeId,
      p_period_type: periodType,
      p_period_start: period.start,
      p_period_end: period.end,
      p_items: toLeadConferencePayload(rows),
    })
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    toast.success('Conferência de leads salva com auditoria.')
    onClose()
  }

  const openHistory = async () => {
    setHistoryOpen(true)
    if (!storeId) return
    setHistoryLoading(true)
    const { data, error: historyError } = await supabase
      .from('manager_lead_conferences')
      .select('id, period_start, period_end, total_mx, total_official, total_difference, divergent_sellers, created_at, manager:usuarios!manager_user_id(name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (historyError) {
      toast.error(`Não foi possível carregar o histórico: ${historyError.message}`)
      setHistory([])
    } else {
      setHistory((data || []) as unknown as LeadConferenceHistoryRow[])
    }
    setHistoryLoading(false)
  }

  const footer = (
    <div className="flex w-full flex-col-reverse gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
      <Button variant="outline" onClick={() => void openHistory()}><History size={16} />Ver Histórico</Button>
      <Button className="bg-purple-400 hover:bg-purple-500" disabled={!summary.complete || saving || loading} onClick={() => void save()}>
        <Save size={16} />{saving ? 'Salvando…' : 'Salvar Conferência'}
      </Button>
    </div>
  )

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="3xl"
        title="Conferência de Leads"
        description="Informe os volumes oficiais do CRM externo e compare com os leads registrados pela equipe."
        footer={footer}
      >
        <div className="space-y-mx-md">
          <section className="rounded-mx-xl bg-surface-alt p-mx-md">
            <div className="flex items-center gap-mx-xs text-sm font-bold text-text-secondary"><CalendarDays size={17} />Período da Conferência</div>
            <div className="mt-mx-sm flex flex-col gap-mx-md lg:flex-row lg:items-end lg:justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                <span className="mb-1 block">Tipo de período</span>
                <select value={periodType} onChange={event => setPeriodType(event.target.value as LeadConferencePeriodType)} className="h-mx-11 min-w-[220px] rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold">
                  {Object.entries(LEAD_CONFERENCE_PERIOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {periodType === 'custom' && (
                <div className="grid grid-cols-2 gap-mx-sm">
                  <PeriodInput label="Início" value={customPeriod.start} onChange={start => setCustomPeriod(current => ({ ...current, start }))} />
                  <PeriodInput label="Fim" value={customPeriod.end} onChange={end => setCustomPeriod(current => ({ ...current, end }))} />
                </div>
              )}
              <div className="rounded-xl border border-border-subtle bg-white px-mx-md py-mx-sm text-sm text-text-tertiary">
                Período: <strong className="text-text-primary">{format(parseISO(period.start), 'dd/MM/yyyy')} a {format(parseISO(period.end), 'dd/MM/yyyy')}</strong>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2 xl:grid-cols-4">
            <ConferenceMetric label="Leads registrados no MX" value={summary.totalMx} />
            <ConferenceMetric label="Leads oficiais informados" value={summary.totalOfficial} tone="blue" />
            <ConferenceMetric label="Diferença total" value={formatDifference(summary.totalDifference)} tone="orange" />
            <ConferenceMetric label="Vendedores com divergência" value={summary.divergentSellers} tone="orange" />
          </section>

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-mx-md py-mx-sm text-center text-sm font-semibold text-blue-600">
            Informe os volumes oficiais consultados no CRM externo.
          </div>

          {error && <div className="rounded-xl border border-status-error/30 bg-status-error-surface p-mx-md text-sm text-status-error" role="alert">{error}</div>}
          {loading ? (
            <div className="space-y-mx-sm" aria-busy="true"><Skeleton className="h-mx-12" /><Skeleton className="h-mx-12" /><Skeleton className="h-mx-12" /></div>
          ) : rows.length === 0 ? (
            <div className="py-mx-xl text-center text-sm text-text-secondary">Nenhum vendedor ativo encontrado nesta unidade.</div>
          ) : (
            <div className="overflow-x-auto rounded-mx-xl border border-border-subtle">
              <table className="w-full min-w-[1120px]">
                <thead className="bg-surface-alt">
                  <tr>{['Vendedor', 'Unidade', 'Internet MX', 'Internet Of.', 'Dif. Int.', 'Carteira MX', 'Carteira Of.', 'Dif. Cart.', 'Dif. Total', 'Status', 'Ações'].map(label => <th key={label} className="px-mx-sm py-mx-sm text-left text-[11px] font-black uppercase tracking-wider text-text-secondary">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border-subtle bg-white">
                  {rows.map(row => <ConferenceRow key={row.sellerId} row={row} storeName={storeName} onChange={updateOfficial} onClear={clearRow} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} size="xl" title="Histórico de Conferências" description="Conferências de leads realizadas">
        {historyLoading ? <Skeleton className="h-52" /> : history.length === 0 ? (
          <div className="grid min-h-52 place-items-center text-center">
            <div><History size={42} className="mx-auto text-border-default" /><Typography variant="p" tone="muted" className="mt-mx-sm">Nenhuma conferência de leads foi realizada.</Typography></div>
          </div>
        ) : (
          <div className="space-y-mx-sm">
            {history.map(item => (
              <article key={item.id} className="rounded-xl border border-border-subtle p-mx-md">
                <div className="flex flex-wrap items-start justify-between gap-mx-sm"><div><strong>{format(parseISO(item.period_start), 'dd/MM/yyyy')} a {format(parseISO(item.period_end), 'dd/MM/yyyy')}</strong><p className="mt-1 text-xs text-text-tertiary">{item.manager?.name || 'Gestor'} · {format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm')}</p></div><Badge variant={item.divergent_sellers ? 'warning' : 'success'}>{item.divergent_sellers} divergência(s)</Badge></div>
                <div className="mt-mx-sm grid grid-cols-3 gap-mx-sm text-sm"><span>MX <strong className="block">{item.total_mx}</strong></span><span>Oficial <strong className="block">{item.total_official}</strong></span><span>Diferença <strong className="block">{formatDifference(item.total_difference)}</strong></span></div>
              </article>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}

function PeriodInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold text-text-secondary"><span className="mb-1 block">{label}</span><input type="date" value={value} onChange={event => onChange(event.target.value)} className="h-mx-11 rounded-xl border border-border-subtle bg-white px-3 text-sm" /></label>
}

function ConferenceMetric({ label, value, tone = 'neutral' }: { label: string; value: number | string | null; tone?: 'neutral' | 'blue' | 'orange' }) {
  const colors = tone === 'blue' ? 'border-blue-200 bg-blue-50' : tone === 'orange' ? 'border-orange-200 bg-orange-50' : 'border-border-subtle bg-white'
  return <div className={`rounded-mx-xl border p-mx-md ${colors}`}><p className="text-xs font-semibold text-text-secondary">{label}</p><strong className="mt-mx-xs block text-2xl text-text-primary">{value === null ? '—' : value}</strong></div>
}

function ConferenceRow({ row, storeName, onChange, onClear }: { row: LeadConferenceRow; storeName: string; onChange: (sellerId: string, field: 'internetOfficial' | 'carteiraOfficial', value: string) => void; onClear: (sellerId: string) => void }) {
  const internetDiff = row.internetOfficial === null ? null : row.internetOfficial - row.internetMx
  const carteiraDiff = row.carteiraOfficial === null ? null : row.carteiraOfficial - row.carteiraMx
  const totalDiff = getLeadConferenceRowDifference(row)
  const complete = totalDiff !== null
  return (
    <tr>
      <td className="px-mx-sm py-mx-sm"><div className="flex items-center gap-mx-xs"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">{getInitials(row.sellerName)}</span><strong className="text-sm">{row.sellerName}</strong></div></td>
      <td className="px-mx-sm py-mx-sm text-sm text-text-secondary">{storeName}</td>
      <NumberValue value={row.internetMx} />
      <OfficialInput value={row.internetOfficial} label={`Internet oficial de ${row.sellerName}`} onChange={value => onChange(row.sellerId, 'internetOfficial', value)} />
      <DifferenceValue value={internetDiff} />
      <NumberValue value={row.carteiraMx} />
      <OfficialInput value={row.carteiraOfficial} label={`Carteira oficial de ${row.sellerName}`} onChange={value => onChange(row.sellerId, 'carteiraOfficial', value)} />
      <DifferenceValue value={carteiraDiff} />
      <DifferenceValue value={totalDiff} />
      <td className="px-mx-sm py-mx-sm">{!complete ? <span className="inline-flex rounded-lg bg-surface-alt px-2 py-1 text-xs font-semibold text-text-secondary">Não conferido</span> : <Badge variant={totalDiff === 0 ? 'success' : 'warning'}>{totalDiff === 0 ? 'Conferido' : 'Divergente'}</Badge>}</td>
      <td className="px-mx-sm py-mx-sm"><button type="button" onClick={() => onClear(row.sellerId)} className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary"><RotateCcw size={13} />Limpar</button></td>
    </tr>
  )
}

function NumberValue({ value }: { value: number }) { return <td className="px-mx-sm py-mx-sm text-sm font-semibold">{value}</td> }
function OfficialInput({ value, label, onChange }: { value: number | null; label: string; onChange: (value: string) => void }) { return <td className="px-mx-sm py-mx-sm"><input type="number" min={0} step={1} aria-label={label} placeholder="—" value={value ?? ''} onChange={event => onChange(event.target.value)} className="h-9 w-20 rounded-lg border border-border-subtle px-2 text-sm" /></td> }
function DifferenceValue({ value }: { value: number | null }) { return <td className={`px-mx-sm py-mx-sm text-sm font-bold ${value === null ? 'text-text-tertiary' : value === 0 ? 'text-status-success' : 'text-status-warning'}`}>{formatDifference(value)}</td> }
function formatDifference(value: number | null) { return value === null ? '—' : value > 0 ? `+${value}` : String(value) }
function getInitials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('pt-BR') }
