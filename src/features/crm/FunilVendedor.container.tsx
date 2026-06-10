import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock3,
  DollarSign,
  Funnel,
  Lightbulb,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/molecules/FormField'
import { Modal } from '@/components/organisms/Modal'
import { useOportunidades, type OportunidadeComCliente, type OportunidadeInput } from '@/features/crm/hooks/useOportunidades'
import { useClientes } from '@/features/crm/hooks/useClientes'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import {
  CRM_ETAPAS_FUNIL,
  CRM_ETAPAS_ATIVAS,
  CRM_ETAPA_LABEL,
  CRM_CANAIS,
  CRM_CANAL_LABEL,
  CRM_FINANCIAMENTO,
  toDateOnlyBR,
  type CrmCanal,
  type CrmEtapaFunil,
} from '@/lib/schemas/crm.schema'
import { cn } from '@/lib/utils'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const PCT = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

const FINANCIAMENTO_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  nao_aplica: 'Nao se aplica',
  pendente: 'Pendente',
}

const STAGE_META: Record<CrmEtapaFunil, { index: string; subtitle: string; className: string; width: string }> = {
  prospeccao: { index: '1.', subtitle: 'Leads novos gerados', className: 'bg-blue-600', width: '100%' },
  qualificacao: { index: '2.', subtitle: 'Leads qualificados', className: 'bg-sky-500', width: '88%' },
  apresentacao: { index: '3.', subtitle: 'Apresentacao realizada', className: 'bg-amber-400', width: '74%' },
  negociacao: { index: '4.', subtitle: 'Negociacao em andamento', className: 'bg-orange-500', width: '58%' },
  fechamento: { index: '5.', subtitle: 'Aguardando fechamento', className: 'bg-emerald-500', width: '44%' },
  ganho: { index: '', subtitle: 'Ganhas', className: 'bg-emerald-700', width: '36%' },
  perdido: { index: '', subtitle: 'Perdidas', className: 'bg-rose-500', width: '36%' },
}

const EMPTY: OportunidadeInput = {
  cliente_id: '',
  veiculo_interesse: '',
  valor_negociado: 0,
  etapa: 'prospeccao',
  canal: null,
  sinal: 0,
  financiamento: 'nao_aplica',
  carro_avaliado: false,
}

const today = new Date()
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
const dateInput = (date: Date) => toDateOnlyBR(date)

type StageRow = {
  etapa: CrmEtapaFunil
  quantidade: number
  valor: number
  conversao: number
}

type FunnelStats = {
  stageRows: StageRow[]
  totalOportunidades: number
  ganhosQuantidade: number
  ganhosValor: number
  valorTotalFunil: number
  taxaConversaoGeral: number
  ticketMedio: number
  cicloMedio: number
}

function dateLabel(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getStageIndex(etapa: CrmEtapaFunil) {
  const index = CRM_ETAPAS_ATIVAS.indexOf(etapa)
  if (etapa === 'ganho') return CRM_ETAPAS_ATIVAS.length
  if (etapa === 'perdido') return -1
  return index
}

function computeStats(items: OportunidadeComCliente[]): FunnelStats {
  const activeStages = CRM_ETAPAS_ATIVAS
  const totalOportunidades = items.length
  const ganhos = items.filter(item => item.etapa === 'ganho')
  const ganhosValor = ganhos.reduce((acc, item) => acc + (item.valor_negociado || 0), 0)
  const valorTotalFunil = items
    .filter(item => activeStages.includes(item.etapa))
    .reduce((acc, item) => acc + (item.valor_negociado || 0), 0)

  const stageRows = activeStages.map((etapa, index) => {
    const stageItems = index === 0
      ? items.filter(item => item.etapa !== 'perdido')
      : items.filter(item => {
        const stageIndex = getStageIndex(item.etapa)
        return stageIndex >= index
      })
    const valor = stageItems.reduce((acc, item) => acc + (item.valor_negociado || 0), 0)
    const conversao = totalOportunidades > 0 ? (stageItems.length / totalOportunidades) * 100 : 0
    return { etapa, quantidade: stageItems.length, valor, conversao }
  })

  const taxaConversaoGeral = totalOportunidades > 0 ? (ganhos.length / totalOportunidades) * 100 : 0
  const ticketMedio = ganhos.length > 0 ? ganhosValor / ganhos.length : 0
  const cicloMedio = ganhos.length > 0
    ? Math.max(1, Math.round(ganhos.reduce((acc, item) => {
      const start = normalizeDate(item.created_at)?.getTime() || today.getTime()
      const end = normalizeDate(item.closed_at || item.updated_at)?.getTime() || today.getTime()
      return acc + Math.max(1, (end - start) / 86400000)
    }, 0) / ganhos.length))
    : 0

  return {
    stageRows,
    totalOportunidades,
    ganhosQuantidade: ganhos.length,
    ganhosValor,
    valorTotalFunil,
    taxaConversaoGeral,
    ticketMedio,
    cicloMedio,
  }
}

function SectionTitle({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-start gap-mx-xs">
      {icon && <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">{icon}</span>}
      <div className="min-w-0">
        <Typography variant="h3" className="text-sm uppercase leading-tight tracking-normal text-text-primary">{title}</Typography>
        {subtitle && <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{subtitle}</Typography>}
      </div>
    </div>
  )
}

function FilterCard({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[54px] items-center gap-mx-sm rounded-mx-lg border border-border-subtle bg-white px-mx-md py-mx-xs shadow-mx-sm">
      <span className="shrink-0 text-text-secondary" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <Typography variant="tiny" className="text-[10px] font-black uppercase leading-tight tracking-normal text-text-secondary">{label}</Typography>
        {children || <Typography variant="caption" className="mt-1 block truncate font-black normal-case tracking-normal text-text-primary">{value}</Typography>}
      </div>
    </div>
  )
}

function KpiStripCard({ icon, label, value, trend, trendTone = 'muted', tone = 'brand' }: { icon: React.ReactNode; label: string; value: string; trend: string; trendTone?: 'success' | 'error' | 'muted'; tone?: 'brand' | 'success' | 'warning' | 'info' }) {
  const toneClass = {
    brand: 'text-brand-primary bg-brand-primary/10',
    success: 'text-status-success bg-status-success-surface',
    warning: 'text-status-warning bg-status-warning-surface',
    info: 'text-status-info bg-status-info-surface',
  }[tone]

  return (
    <Card className="min-h-[92px] rounded-mx-lg border border-border-subtle bg-white p-mx-sm shadow-mx-sm">
      <div className="flex items-start gap-mx-xs">
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-mx-md', toneClass)}>{icon}</span>
        <div className="min-w-0">
          <Typography variant="tiny" className="text-[10px] font-black uppercase leading-tight tracking-normal text-text-secondary">{label}</Typography>
          <Typography variant="h3" className="mt-0.5 text-base leading-tight text-text-primary">{value}</Typography>
          <Typography variant="tiny" tone={trendTone} className="text-[10px] normal-case leading-tight tracking-normal">{trend}</Typography>
        </div>
      </div>
    </Card>
  )
}

/** Variação entre período atual e anterior, formatada honestamente ('—' sem base de comparação). */
function buildTrends(current: FunnelStats, previous: FunnelStats, hasPrevious: boolean) {
  const fmtDelta = (delta: number, unit: string) => `${delta > 0 ? '+' : delta < 0 ? '-' : ''} ${Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unit} vs período anterior`
  const pctDelta = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : null
  const none = { label: 'Sem período anterior para comparar', tone: 'muted' as const }
  if (!hasPrevious) {
    return { conversao: none, ticket: none, ciclo: none, valorFunil: none }
  }
  const conversaoDelta = current.taxaConversaoGeral - previous.taxaConversaoGeral
  const ticketDelta = pctDelta(current.ticketMedio, previous.ticketMedio)
  const cicloDelta = previous.cicloMedio > 0 && current.cicloMedio > 0 ? current.cicloMedio - previous.cicloMedio : null
  const valorDelta = pctDelta(current.valorTotalFunil, previous.valorTotalFunil)
  return {
    conversao: { label: fmtDelta(conversaoDelta, ' p.p.'), tone: conversaoDelta >= 0 ? 'success' as const : 'error' as const },
    ticket: ticketDelta === null ? none : { label: fmtDelta(ticketDelta, '%'), tone: ticketDelta >= 0 ? 'success' as const : 'error' as const },
    ciclo: cicloDelta === null ? none : { label: fmtDelta(cicloDelta, cicloDelta === 1 || cicloDelta === -1 ? ' dia' : ' dias'), tone: cicloDelta <= 0 ? 'success' as const : 'error' as const },
    valorFunil: valorDelta === null ? none : { label: fmtDelta(valorDelta, '%'), tone: valorDelta >= 0 ? 'success' as const : 'error' as const },
  }
}

function FunnelBoard({ stats }: { stats: FunnelStats }) {
  const gainConversion = stats.totalOportunidades > 0 ? (stats.ganhosQuantidade / stats.totalOportunidades) * 100 : 0

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white shadow-mx-sm">
      <div className="flex flex-col gap-mx-sm border-b border-border-subtle p-mx-md md:flex-row md:items-center md:justify-between">
        <SectionTitle icon={<Funnel size={18} />} title="Seu funil de vendas" />
        <div className="flex items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-sm py-1">
          <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">Exibindo:</Typography>
          <Select aria-label="Indicador exibido no funil" value="quantidade" onChange={() => undefined} className="h-mx-8 border-none px-1 py-0 text-xs shadow-none focus:ring-0">
            <option value="quantidade">Quantidade de oportunidades</option>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.45fr_120px_120px_150px] border-b border-border-subtle px-mx-md py-mx-sm text-xs font-black uppercase text-text-secondary">
            <span />
            <span className="text-center">Oportunidades</span>
            <span className="text-center">Conversao</span>
            <span className="text-right">Valor estimado</span>
          </div>
          {stats.stageRows.map((stage) => {
            const meta = STAGE_META[stage.etapa]
            return (
              <div key={stage.etapa} className="grid grid-cols-[1.45fr_120px_120px_150px] items-center border-b border-border-subtle px-mx-md py-1">
                <div className="flex justify-center">
                  <div
                    className={cn('flex h-[45px] flex-col items-center justify-center px-mx-md text-center text-white shadow-mx-sm [clip-path:polygon(4%_0,96%_0,90%_100%,10%_100%)]', meta.className)}
                    style={{ width: meta.width }}
                  >
                    <Typography variant="p" className="text-xs font-black uppercase leading-tight text-white">{meta.index} {CRM_ETAPA_LABEL[stage.etapa]}</Typography>
                    <Typography variant="caption" className="text-[10px] font-bold normal-case leading-tight tracking-normal text-white/90">{meta.subtitle}</Typography>
                  </div>
                </div>
                <div className="text-center">
                  <Typography variant="h3" className="text-lg leading-none text-text-primary">{stage.quantidade}</Typography>
                  <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{PCT(stage.conversao)}</Typography>
                </div>
                <div className="text-center">
                  <Typography variant="p" className="font-bold text-text-secondary">{PCT(stage.conversao)}</Typography>
                  <Typography variant="tiny" tone={stage.conversao >= 50 ? 'success' : 'muted'} className="normal-case tracking-normal">{stage.conversao >= 50 ? 'alta' : 'monitorar'}</Typography>
                </div>
                <Typography variant="p" className="text-right font-bold text-text-primary">{BRL(stage.valor)}</Typography>
              </div>
            )
          })}
          <div className="grid grid-cols-[1.45fr_120px_120px_150px] items-center px-mx-md py-1">
            <div className="flex justify-center">
              <div
                className="flex h-[42px] flex-col items-center justify-center bg-emerald-700 px-mx-md text-center text-white shadow-mx-sm [clip-path:polygon(7%_0,93%_0,87%_100%,13%_100%)]"
                style={{ width: STAGE_META.ganho.width }}
              >
                <Typography variant="p" className="text-xs font-black uppercase leading-tight text-white">Vendas realizadas</Typography>
                <Typography variant="caption" className="text-[10px] font-bold normal-case leading-tight tracking-normal text-white/90">Ganhas</Typography>
              </div>
            </div>
            <div className="text-center">
              <Typography variant="h3" className="text-lg leading-none text-text-primary">{stats.ganhosQuantidade}</Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{PCT(gainConversion)}</Typography>
            </div>
            <Typography variant="p" className="text-center font-bold text-text-secondary">{stats.ganhosQuantidade > 0 ? '100%' : '-'}</Typography>
            <Typography variant="p" className="text-right font-bold text-text-primary">{BRL(stats.ganhosValor)}</Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}

function InsightCard({ icon, title, description, tone }: { icon: React.ReactNode; title: string; description: string; tone: 'warning' | 'success' | 'info' | 'brand' }) {
  const toneClass = {
    warning: 'text-status-warning bg-status-warning-surface',
    success: 'text-status-success bg-status-success-surface',
    info: 'text-status-info bg-status-info-surface',
    brand: 'text-brand-primary bg-brand-primary/10',
  }[tone]

  return (
    <div className="flex gap-mx-sm border-b border-border-subtle px-mx-md py-mx-xs last:border-b-0">
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-mx-full', toneClass)}>{icon}</span>
      <div className="min-w-0">
        <Typography variant="p" className="text-[11px] font-black leading-tight text-text-primary">{title}</Typography>
        <p className="mt-1 text-[11px] font-bold leading-snug text-text-tertiary">{description}</p>
      </div>
    </div>
  )
}

function FunnelTrendChart({ items }: { items: OportunidadeComCliente[] }) {
  // Série real dos últimos 6 meses: leads = criadas no mês; negociações =
  // criadas no mês que avançaram até negociação ou além; vendas = ganhas
  // (closed_at) no mês.
  const { months, leads, negociacoes, vendas } = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2) }
    })
    const inBucket = (date: Date | null, b: { year: number; month: number }) =>
      date !== null && date.getFullYear() === b.year && date.getMonth() === b.month
    const negociacaoIndex = CRM_ETAPAS_ATIVAS.indexOf('negociacao')
    return {
      months: buckets.map(b => b.label),
      leads: buckets.map(b => items.filter(item => inBucket(normalizeDate(item.created_at), b)).length),
      negociacoes: buckets.map(b => items.filter(item => inBucket(normalizeDate(item.created_at), b) && getStageIndex(item.etapa) >= negociacaoIndex).length),
      vendas: buckets.map(b => items.filter(item => item.etapa === 'ganho' && inBucket(normalizeDate(item.closed_at || item.updated_at), b)).length),
    }
  }, [items])

  const maxValue = Math.max(1, ...leads, ...negociacoes, ...vendas)
  const points = (values: number[]) => values.map((value, index) => `${index * 58 + 10},${92 - (value / maxValue) * 80}`).join(' ')

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-center justify-between">
        <SectionTitle title="Evolucao do funil" />
        <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">Ultimos 6 meses</Typography>
      </div>
      <div className="mt-mx-sm flex gap-mx-md text-[10px] font-bold text-text-secondary">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" /> Leads</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Negociacoes</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Vendas</span>
      </div>
      <svg viewBox="0 0 310 110" className="mt-mx-sm h-[134px] w-full" role="img" aria-label="Grafico de evolucao do funil">
        {[20, 45, 70, 95].map(y => <line key={y} x1="0" x2="310" y1={y} y2={y} className="stroke-border-subtle" strokeWidth="1" />)}
        <polyline points={points(leads)} fill="none" className="stroke-blue-600" strokeWidth="3" />
        <polyline points={points(negociacoes)} fill="none" className="stroke-orange-500" strokeWidth="3" />
        <polyline points={points(vendas)} fill="none" className="stroke-emerald-500" strokeWidth="3" />
        {months.map((label, index) => (
          <text key={label} x={index * 58} y="108" className="fill-text-muted text-[9px]">{label}</text>
        ))}
      </svg>
    </Card>
  )
}

function GoalComparison({ stats, metaMensal }: { stats: FunnelStats; metaMensal: number }) {
  const faltam = Math.max(metaMensal - stats.ganhosQuantidade, 0)
  const progress = metaMensal > 0 ? Math.min(100, Math.round((stats.ganhosQuantidade / metaMensal) * 100)) : 0

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-center justify-between">
        <SectionTitle title="Comparativo com sua meta" />
        <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">Mes atual</Typography>
      </div>
      {metaMensal > 0 ? (
        <div className="mt-mx-sm space-y-mx-sm">
          <div>
            <div className="flex items-center justify-between gap-mx-sm">
              <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">Vendas realizadas</Typography>
              <Typography variant="caption" className="font-black normal-case tracking-normal text-text-primary">{stats.ganhosQuantidade.toLocaleString('pt-BR')} / {metaMensal.toLocaleString('pt-BR')}</Typography>
            </div>
            <div className="mt-1 flex items-center gap-mx-xs">
              <div className="h-2 flex-1 rounded-mx-full bg-surface-alt">
                <div className="h-2 rounded-mx-full bg-brand-primary" style={{ width: `${progress}%` }} />
              </div>
              <Typography variant="tiny" className="w-9 text-right font-black tracking-normal text-text-secondary">{progress}%</Typography>
            </div>
          </div>
          <div className="rounded-mx-md bg-brand-primary/5 px-mx-sm py-mx-xs">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">
              {faltam > 0
                ? <>Faltam <span className="font-black text-brand-primary">{faltam} venda{faltam === 1 ? '' : 's'}</span> para bater sua meta do mes.</>
                : <span className="font-black text-status-success">Meta do mes batida! 🎉</span>}
            </Typography>
          </div>
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">Valor em vendas no periodo</Typography>
            <Typography variant="caption" className="font-black normal-case tracking-normal text-text-primary">{BRL(stats.ganhosValor)}</Typography>
          </div>
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">Taxa de conversao do funil</Typography>
            <Typography variant="caption" className="font-black normal-case tracking-normal text-text-primary">{PCT(stats.taxaConversaoGeral)}</Typography>
          </div>
        </div>
      ) : (
        <div className="mt-mx-sm rounded-mx-md bg-status-warning-surface px-mx-sm py-mx-sm">
          <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">
            Sua meta mensal ainda nao foi cadastrada. Fale com seu gerente para definir a meta da loja.
          </Typography>
        </div>
      )}
    </Card>
  )
}

function OriginRank({ items }: { items: OportunidadeComCliente[] }) {
  const rows = CRM_CANAIS.map(canal => {
    const byCanal = items.filter(item => item.canal === canal)
    const ganhos = byCanal.filter(item => item.etapa === 'ganho').length
    const conversao = byCanal.length > 0 ? (ganhos / byCanal.length) * 100 : 0
    return { canal, total: byCanal.length, conversao }
  }).sort((a, b) => b.conversao - a.conversao || b.total - a.total).slice(0, 3)

  const max = Math.max(1, ...rows.map(row => row.conversao))

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <div className="flex items-center justify-between">
        <SectionTitle title="Melhores origens de leads" />
        <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">Conversao</Typography>
      </div>
      <div className="mt-mx-md space-y-mx-sm">
        {rows.map((row, index) => (
          <div key={row.canal} className="grid grid-cols-[1fr_120px_48px] items-center gap-mx-sm">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-primary">{index + 1}. {CRM_CANAL_LABEL[row.canal]}</Typography>
            <div className="h-2 rounded-mx-full bg-surface-alt">
              <div className="h-2 rounded-mx-full bg-status-success" style={{ width: `${Math.max(8, (row.conversao / max) * 100)}%` }} />
            </div>
            <Typography variant="caption" className="text-right font-black normal-case tracking-normal text-text-primary">{PCT(row.conversao)}</Typography>
          </div>
        ))}
      </div>
      <Button asChild variant="ghost" size="xs" className="mt-mx-sm text-brand-primary">
        <Link to="/relatorios-vendedor">Ver todas as origens <ChevronRight size={14} /></Link>
      </Button>
    </Card>
  )
}

function PerformancePanel({ items }: { items: OportunidadeComCliente[] }) {
  // Janela real dos últimos 3 meses (calendário), sobre todas as oportunidades.
  const rows = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const ganhos = items.filter(item => {
      if (item.etapa !== 'ganho') return false
      const closed = normalizeDate(item.closed_at || item.updated_at)
      return closed !== null && closed >= start
    })
    const valorTotal = ganhos.reduce((acc, item) => acc + (item.valor_negociado || 0), 0)
    const mediaMes = valorTotal / 3
    const ticket = ganhos.length > 0 ? valorTotal / ganhos.length : 0
    const diasJanela = Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000))
    const cadencia = ganhos.length > 0 ? Math.max(1, Math.round(diasJanela / ganhos.length)) : 0
    return [
      { label: 'Media de vendas / mes', value: BRL(mediaMes) },
      { label: 'Media de vendas / oportunidade ganha', value: ganhos.length > 0 ? BRL(ticket) : '—' },
      { label: 'Vendas a cada', value: cadencia > 0 ? `${cadencia} dia${cadencia === 1 ? '' : 's'}` : '—' },
    ]
  }, [items])

  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
      <SectionTitle title="Sua performance" subtitle="Ultimos 3 meses" />
      <div className="mt-mx-sm space-y-mx-sm">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-mx-sm border-b border-border-subtle pb-mx-xs last:border-b-0 last:pb-0">
            <Typography variant="caption" className="font-bold normal-case tracking-normal text-text-secondary">{row.label}</Typography>
            <Typography variant="caption" className="font-black normal-case tracking-normal text-text-primary">{row.value}</Typography>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function FunilVendedor() {
  const { oportunidades, loading, error, createOportunidade, updateEtapa, deleteOportunidade } = useOportunidades()
  const { clientes } = useClientes()
  const { metrics: homeMetrics } = useVendedorHomePage()
  const metaMensal = homeMetrics?.meta || 0
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<OportunidadeInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState(dateInput(monthStart))
  const [endDate, setEndDate] = useState(dateInput(today))
  const [canalFiltro, setCanalFiltro] = useState<CrmCanal | 'todos'>('todos')
  const [dicaVisivel, setDicaVisivel] = useState(true)

  const { filteredOportunidades, previousOportunidades } = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T23:59:59`)
    const windowMs = Math.max(end.getTime() - start.getTime(), 86400000)
    const prevStart = new Date(start.getTime() - windowMs)
    const prevEnd = new Date(start.getTime() - 1)
    const matchCanal = (item: OportunidadeComCliente) => canalFiltro === 'todos' || item.canal === canalFiltro
    const inRange = (item: OportunidadeComCliente, from: Date, to: Date) => {
      const ref = normalizeDate(item.created_at || item.updated_at)
      return ref ? ref >= from && ref <= to : false
    }
    return {
      filteredOportunidades: oportunidades.filter(item => {
        const ref = normalizeDate(item.created_at || item.updated_at)
        const matchesDate = ref ? ref >= start && ref <= end : true
        return matchesDate && matchCanal(item)
      }),
      previousOportunidades: oportunidades.filter(item => inRange(item, prevStart, prevEnd) && matchCanal(item)),
    }
  }, [canalFiltro, endDate, oportunidades, startDate])

  const stats = useMemo(() => computeStats(filteredOportunidades), [filteredOportunidades])
  const prevStats = useMemo(() => computeStats(previousOportunidades), [previousOportunidades])
  const trends = useMemo(() => buildTrends(stats, prevStats, previousOportunidades.length > 0), [stats, prevStats, previousOportunidades.length])
  const negociacaoCount = stats.stageRows.find(row => row.etapa === 'negociacao')?.quantidade || 0
  const fechamentoCount = stats.stageRows.find(row => row.etapa === 'fechamento')?.quantidade || 0

  async function handleCreate() {
    if (!form.cliente_id) { toast.error('Selecione o cliente.'); return }
    setSaving(true)
    const { error: createError } = await createOportunidade(form)
    setSaving(false)
    if (createError) { toast.error(createError); return }
    toast.success('Oportunidade adicionada ao funil.')
    setForm(EMPTY)
    setModalOpen(false)
  }

  async function handleEtapa(id: string, etapa: CrmEtapaFunil) {
    let motivo: string | undefined
    if (etapa === 'perdido') { motivo = prompt('Motivo da perda (opcional):') || undefined }
    const { error: e } = await updateEtapa(id, etapa, motivo)
    if (e) { toast.error(e); return }
    toast.success(`Movido para "${CRM_ETAPA_LABEL[etapa]}".`)
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir a oportunidade de "${nome}"?`)) return
    const { error: e } = await deleteOportunidade(id)
    if (e) { toast.error(e); return }
    toast.success('Oportunidade excluida.')
  }

  function clearFilters() {
    setStartDate(dateInput(monthStart))
    setEndDate(dateInput(today))
    setCanalFiltro('todos')
  }

  return (
    <main className="min-h-full w-full bg-white p-mx-sm md:p-mx-lg">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-mx-md pb-mx-lg">
        <header className="flex flex-col gap-mx-sm border-b border-border-subtle pb-mx-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-md border border-border-subtle bg-white text-text-primary">
              <Funnel size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
          <Typography variant="h1" className="text-xl uppercase leading-tight tracking-normal text-text-primary md:text-2xl">Funil de Vendas</Typography>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Acompanhe suas oportunidades e avance mais negociacoes para o fechamento.</Typography>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-mx-sm">
            <div className="flex h-mx-10 items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-sm">
              <Calendar size={16} className="text-text-secondary" />
              <Typography variant="caption" className="font-black normal-case tracking-normal text-text-primary">{dateLabel(endDate)} ({today.toLocaleDateString('pt-BR', { weekday: 'long' })})</Typography>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}><Plus size={15} /> Oportunidade</Button>
          </div>
        </header>

        {error && <Typography className="text-status-error">{error}</Typography>}

        <section className="grid grid-cols-1 gap-mx-sm lg:grid-cols-[1fr_1fr_1fr_128px]">
          <FilterCard icon={<Calendar size={18} />} label="Periodo">
            <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <input aria-label="Data inicial" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} className="min-w-0 rounded-mx-sm border border-border-subtle bg-white px-2 py-1 text-xs font-black text-text-primary outline-none sm:border-none sm:p-0" />
              <span className="hidden text-text-tertiary sm:inline">-</span>
              <input aria-label="Data final" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} className="min-w-0 rounded-mx-sm border border-border-subtle bg-white px-2 py-1 text-xs font-black text-text-primary outline-none sm:border-none sm:p-0" />
            </div>
          </FilterCard>
          <FilterCard icon={<Funnel size={18} />} label="Funil" value="Meu Funil" />
          <FilterCard icon={<Users size={18} />} label="Origem">
            <Select aria-label="Origem do funil" value={canalFiltro} onChange={event => setCanalFiltro(event.target.value as CrmCanal | 'todos')} className="mt-1 h-mx-8 border-none px-0 py-0 text-xs shadow-none focus:ring-0">
              <option value="todos">Todas as origens</option>
              {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
            </Select>
          </FilterCard>
            <Button variant="outline" className="h-full min-h-[54px] text-brand-primary" onClick={clearFilters}>Limpar filtros</Button>
        </section>

        <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-mx-md">
            <FunnelBoard stats={stats} />

            <section className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2 xl:grid-cols-5">
              <KpiStripCard icon={<Target size={18} />} label="Taxa de conversao geral" value={PCT(stats.taxaConversaoGeral)} trend={trends.conversao.label} trendTone={trends.conversao.tone} />
              <KpiStripCard icon={<DollarSign size={18} />} label="Ticket medio" value={stats.ticketMedio > 0 ? BRL(stats.ticketMedio) : '—'} trend={trends.ticket.label} trendTone={trends.ticket.tone} tone="success" />
              <KpiStripCard icon={<Clock3 size={18} />} label="Ciclo medio de vendas" value={stats.cicloMedio > 0 ? `${stats.cicloMedio} dias` : '—'} trend={trends.ciclo.label} trendTone={trends.ciclo.tone} tone="info" />
              <KpiStripCard icon={<Zap size={18} />} label="Valor total do funil" value={BRL(stats.valorTotalFunil)} trend={trends.valorFunil.label} trendTone={trends.valorFunil.tone} tone="success" />
              <KpiStripCard icon={<BarChart3 size={18} />} label="Vendas no periodo" value={String(stats.ganhosQuantidade)} trend={BRL(stats.ganhosValor)} trendTone="muted" tone="brand" />
            </section>

            <section className="grid grid-cols-1 gap-mx-md lg:grid-cols-2">
              <FunnelTrendChart items={oportunidades} />
              <GoalComparison stats={stats} metaMensal={metaMensal} />
            </section>

            {loading ? (
              <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
                <Typography tone="muted">Carregando funil...</Typography>
              </Card>
            ) : filteredOportunidades.length === 0 ? (
              <EmptyState title="Nenhuma oportunidade no filtro" description="Ajuste o periodo ou cadastre uma oportunidade para acompanhar seu funil." />
            ) : (
              <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm">
                <div className="flex items-center justify-between gap-mx-sm">
                  <SectionTitle title="Oportunidades recentes" subtitle="Controle operacional do funil" />
                  <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{filteredOportunidades.length} registros</Typography>
                </div>
                <div className="mt-mx-sm overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle text-xs uppercase text-text-secondary">
                        <th className="py-mx-xs font-black">Cliente</th>
                        <th className="py-mx-xs font-black">Veiculo</th>
                        <th className="py-mx-xs text-right font-black">Valor</th>
                        <th className="py-mx-xs font-black">Financiamento</th>
                        <th className="py-mx-xs font-black">Etapa</th>
                        <th className="py-mx-xs text-right font-black">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOportunidades.map(oportunidade => (
                        <tr key={oportunidade.id} className="border-b border-border-subtle last:border-b-0">
                          <td className="py-mx-sm font-bold text-text-primary">{oportunidade.cliente?.nome || '-'}</td>
                          <td className="py-mx-sm text-text-secondary">{oportunidade.veiculo_interesse || '-'}</td>
                          <td className="py-mx-sm text-right font-bold text-text-primary">{oportunidade.valor_negociado ? BRL(oportunidade.valor_negociado) : '-'}</td>
                          <td className="py-mx-sm text-text-secondary">{FINANCIAMENTO_LABEL[oportunidade.financiamento]}</td>
                          <td className="py-mx-sm">
                            <Select aria-label="Etapa" value={oportunidade.etapa} onChange={event => handleEtapa(oportunidade.id, event.target.value as CrmEtapaFunil)} className="h-mx-9 min-w-[156px] px-mx-xs py-0 text-xs">
                              {CRM_ETAPAS_FUNIL.map(etapa => <option key={etapa} value={etapa}>{CRM_ETAPA_LABEL[etapa]}</option>)}
                            </Select>
                          </td>
                          <td className="py-mx-sm text-right">
                            <Button variant="ghost" size="icon" aria-label="Excluir oportunidade" onClick={() => handleDelete(oportunidade.id, oportunidade.cliente?.nome || 'cliente')} className="h-mx-9 w-mx-9 text-status-error hover:bg-status-error-surface"><Trash2 size={15} /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          <aside className="space-y-mx-md">
            <Card className="rounded-mx-lg border border-border-subtle bg-white shadow-mx-sm">
              <div className="border-b border-border-subtle p-mx-md">
                <SectionTitle icon={<Lightbulb size={18} />} title="Insights para voce" />
              </div>
              <InsightCard
                icon={stats.totalOportunidades === 0 ? <AlertTriangle size={16} /> : <TrendingUp size={16} />}
                tone={stats.totalOportunidades === 0 ? 'warning' : 'info'}
                title="Volume de oportunidades"
                description={stats.totalOportunidades === 0
                  ? 'Nenhuma oportunidade no periodo. Prospecte na carteira e reative clientes quentes para alimentar o funil.'
                  : `Voce tem ${stats.totalOportunidades} oportunidade${stats.totalOportunidades === 1 ? '' : 's'} no periodo. Mantenha o ritmo de prospeccao para sustentar o funil.`}
              />
              <InsightCard
                icon={<Target size={16} />}
                tone="success"
                title="Taxa de conversao"
                description={`Sua conversao atual esta em ${PCT(stats.taxaConversaoGeral)}. Priorize oportunidades em fechamento para proteger o resultado.`}
              />
              <InsightCard
                icon={<Clock3 size={16} />}
                tone="info"
                title="Ciclo de vendas"
                description={stats.cicloMedio > 0
                  ? `O ciclo medio esta em ${stats.cicloMedio} dias. Negociacoes paradas devem receber proxima acao ainda hoje.`
                  : 'Sem vendas no periodo para medir o ciclo. Avance negociacoes para o fechamento.'}
              />
              <InsightCard
                icon={<Users size={16} />}
                tone="brand"
                title="Distribuicao do funil"
                description={negociacaoCount > fechamentoCount ? 'Ha volume em negociacao, mas poucas oportunidades em fechamento. Foque em proposta e test drive.' : 'O funil esta enxuto; gere novas apresentacoes para sustentar vendas futuras.'}
              />
            </Card>

            <PerformancePanel items={oportunidades} />
            <OriginRank items={filteredOportunidades} />
          </aside>
        </div>

        {dicaVisivel && (
          <div className="flex items-center gap-mx-sm rounded-mx-lg border border-brand-primary/10 bg-brand-primary/5 px-mx-md py-mx-sm">
            <span className="flex h-mx-8 w-mx-8 shrink-0 items-center justify-center rounded-mx-full text-brand-primary"><Zap size={17} /></span>
            <Typography variant="p" className="text-sm font-black text-brand-primary">Dica do dia</Typography>
            <Typography variant="caption" className="min-w-0 flex-1 normal-case tracking-normal text-text-secondary">Foque em mover as oportunidades da etapa de Qualificacao para Apresentacao para destravar o funil.</Typography>
            <Button variant="ghost" size="icon" aria-label="Fechar dica do dia" onClick={() => setDicaVisivel(false)} className="h-mx-8 w-mx-8"><X size={14} /></Button>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova oportunidade"
        description="Vincule a oportunidade a um cliente da sua carteira."
        footer={
          <div className="flex justify-end gap-mx-sm">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Salvar oportunidade'}</Button>
          </div>
        }
      >
        {clientes.length === 0 ? (
          <div className="flex items-center gap-mx-sm rounded-mx-md bg-status-warning-surface p-mx-md">
            <ChevronRight size={16} />
            <Typography variant="p">Cadastre um cliente na Carteira antes de criar uma oportunidade.</Typography>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select label="Cliente *" value={form.cliente_id} onChange={event => setForm(current => ({ ...current, cliente_id: event.target.value }))}>
                <option value="">Selecione o cliente</option>
                {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nome}{cliente.empresa ? ` - ${cliente.empresa}` : ''}</option>)}
              </Select>
            </div>
            <FormField label="Veiculo de interesse" value={form.veiculo_interesse || ''} onChange={event => setForm(current => ({ ...current, veiculo_interesse: event.target.value }))} placeholder="Ex: Onix LT 1.0" />
            <FormField type="number" label="Valor negociado (R$)" value={String(form.valor_negociado ?? 0)} onChange={event => setForm(current => ({ ...current, valor_negociado: Number(event.target.value) || 0 }))} />
            <Select label="Etapa" value={form.etapa} onChange={event => setForm(current => ({ ...current, etapa: event.target.value as CrmEtapaFunil }))}>
              {CRM_ETAPAS_FUNIL.map(etapa => <option key={etapa} value={etapa}>{CRM_ETAPA_LABEL[etapa]}</option>)}
            </Select>
            <Select label="Canal" value={form.canal || ''} onChange={event => setForm(current => ({ ...current, canal: (event.target.value || null) as OportunidadeInput['canal'] }))}>
              <option value="">Selecione</option>
              {CRM_CANAIS.map(canal => <option key={canal} value={canal}>{CRM_CANAL_LABEL[canal]}</option>)}
            </Select>
            <FormField type="number" label="Sinal (R$)" value={String(form.sinal ?? 0)} onChange={event => setForm(current => ({ ...current, sinal: Number(event.target.value) || 0 }))} />
            <Select label="Financiamento" value={form.financiamento} onChange={event => setForm(current => ({ ...current, financiamento: event.target.value as OportunidadeInput['financiamento'] }))}>
              {CRM_FINANCIAMENTO.map(financiamento => <option key={financiamento} value={financiamento}>{FINANCIAMENTO_LABEL[financiamento]}</option>)}
            </Select>
          </div>
        )}
      </Modal>
    </main>
  )
}

export default FunilVendedor
