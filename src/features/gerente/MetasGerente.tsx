import { useMemo } from 'react'
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

type SellerMeta = {
  id: string
  name: string
  meta: number
  realizado: number
  projecao: number
  status: 'excelente' | 'bom' | 'atencao' | 'critico'
}

const teamMetas: SellerMeta[] = [
  { id: '1', name: 'João Silva', meta: 8, realizado: 8, projecao: 9, status: 'excelente' },
  { id: '2', name: 'Marcos Lima', meta: 8, realizado: 5, projecao: 7, status: 'bom' },
  { id: '3', name: 'Ana Costa', meta: 8, realizado: 4, projecao: 5, status: 'atencao' },
  { id: '4', name: 'Carlos Souza', meta: 8, realizado: 2, projecao: 3, status: 'atencao' },
  { id: '5', name: 'Pedro Santos', meta: 8, realizado: 0, projecao: 1, status: 'critico' },
]

const statusConfig: Record<SellerMeta['status'], { label: string; pill: string; bar: string }> = {
  excelente: { label: 'Excelente', pill: 'bg-status-success-surface text-status-success', bar: 'bg-status-success' },
  bom: { label: 'Bom', pill: 'bg-status-info-surface text-status-info', bar: 'bg-status-info' },
  atencao: { label: 'Atenção', pill: 'bg-status-warning-surface text-status-warning', bar: 'bg-status-warning' },
  critico: { label: 'Crítico', pill: 'bg-status-error-surface text-status-error', bar: 'bg-status-error' },
}

export default function MetasGerente() {
  const totals = useMemo(() => {
    const meta = teamMetas.reduce((acc, m) => acc + m.meta, 0)
    const realizado = teamMetas.reduce((acc, m) => acc + m.realizado, 0)
    const projecao = teamMetas.reduce((acc, m) => acc + m.projecao, 0)
    const atingimento = meta > 0 ? Math.round((realizado / meta) * 100) : 0
    const projetado = meta > 0 ? Math.round((projecao / meta) * 100) : 0
    return { meta, realizado, projecao, atingimento, projetado, gap: Math.max(meta - realizado, 0) }
  }, [])

  const tierCounts = useMemo(() => ({
    excelente: teamMetas.filter(m => m.status === 'excelente').length,
    bom: teamMetas.filter(m => m.status === 'bom').length,
    atencao: teamMetas.filter(m => m.status === 'atencao').length,
    critico: teamMetas.filter(m => m.status === 'critico').length,
  }), [])

  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Metas da Equipe</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Acompanhe o atingimento e a projeção de cada vendedor.</Typography>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-info text-white shadow-mx-sm" aria-hidden="true">
              <Target size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Meta do Mês</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totals.meta}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">veículos · soma da equipe</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-success text-white shadow-mx-sm" aria-hidden="true">
              <CheckCircle2 size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Realizado</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totals.realizado}</Typography>
          <div className="mt-mx-xs flex items-baseline gap-mx-xs">
            <Typography variant="tiny" tone="success" className="font-black tabular-nums">{totals.atingimento}%</Typography>
            <Typography variant="tiny" tone="muted" className="font-bold normal-case">da meta</Typography>
          </div>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-warning text-white shadow-mx-sm" aria-hidden="true">
              <TrendingUp size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Projeção</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totals.projecao}</Typography>
          <div className="mt-mx-xs flex items-baseline gap-mx-xs">
            <Typography variant="tiny" className="font-black tabular-nums text-status-warning">{totals.projetado}%</Typography>
            <Typography variant="tiny" tone="muted" className="font-bold normal-case">se mantiver ritmo</Typography>
          </div>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-error text-white shadow-mx-sm" aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Gap</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totals.gap}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">faltam para bater meta</Typography>
        </Card>
      </section>

      {/* Resumo por tier */}
      <section className="grid grid-cols-2 gap-mx-md md:grid-cols-4">
        {(Object.keys(statusConfig) as Array<SellerMeta['status']>).map((tier) => (
          <Card key={tier} className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
            <div className="flex items-center justify-between">
              <span className={cn('inline-flex rounded-mx-md px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', statusConfig[tier].pill)}>
                {statusConfig[tier].label}
              </span>
              <Clock3 size={14} className="text-text-tertiary" />
            </div>
            <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{tierCounts[tier]}</Typography>
            <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">vendedores</Typography>
          </Card>
        ))}
      </section>

      {/* Tabela individual */}
      <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
        <Typography variant="h3" className="text-xl font-black">Meta por Vendedor</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">Atingimento individual e ritmo projetado.</Typography>

        <div className="mt-mx-lg overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-surface-alt/60">
              <tr>
                {['Vendedor', 'Meta', 'Realizado', 'Projeção', 'Atingimento', 'Status'].map(h => (
                  <th key={h} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {teamMetas.map((m) => {
                const att = m.meta > 0 ? Math.round((m.realizado / m.meta) * 100) : 0
                const status = statusConfig[m.status]
                return (
                  <tr key={m.id}>
                    <td className="px-mx-md py-mx-sm">
                      <Typography variant="p" className="truncate font-black">{m.name}</Typography>
                    </td>
                    <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono">{m.meta}</Typography></td>
                    <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono" tone="success">{m.realizado}</Typography></td>
                    <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono" tone="warning">{m.projecao}</Typography></td>
                    <td className="px-mx-md py-mx-sm">
                      <div className="flex items-center gap-mx-xs">
                        <div className="flex-1 h-mx-xs overflow-hidden rounded-mx-full bg-surface-alt">
                          <div className={cn('h-full rounded-mx-full transition-all', status.bar)} style={{ width: `${Math.min(att, 100)}%` }} />
                        </div>
                        <span className="text-mx-tiny font-black text-text-tertiary tabular-nums w-mx-9 text-right">{att}%</span>
                      </div>
                    </td>
                    <td className="px-mx-md py-mx-sm">
                      <span className={cn('inline-flex rounded-mx-full px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', status.pill)}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
