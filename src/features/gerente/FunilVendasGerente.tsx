import { useMemo } from 'react'
import { ChevronRight, Filter, Users, Phone, MapPin, Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'success' | 'warning' | 'purple'

type FunnelStage = {
  label: string
  value: number
  rate?: number
}

type FunnelRow = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tone: Tone
  stages: FunnelStage[]
}

const tonePalette: Record<Tone, { iconBg: string; iconText: string; barBg: string; pill: string }> = {
  info: { iconBg: 'bg-status-info-surface', iconText: 'text-status-info', barBg: 'bg-status-info', pill: 'bg-status-info-surface text-status-info' },
  success: { iconBg: 'bg-status-success-surface', iconText: 'text-status-success', barBg: 'bg-status-success', pill: 'bg-status-success-surface text-status-success' },
  warning: { iconBg: 'bg-status-warning-surface', iconText: 'text-status-warning', barBg: 'bg-status-warning', pill: 'bg-status-warning-surface text-status-warning' },
  purple: { iconBg: 'bg-[var(--color-accent-purple-soft)]', iconText: 'text-[var(--color-accent-purple)]', barBg: 'bg-[var(--color-accent-purple)]', pill: 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple)]' },
}

const funnelData: FunnelRow[] = [
  {
    id: 'leads',
    title: 'LEADS',
    description: 'Origem digital, parcerias e marketing',
    icon: <Users size={18} />,
    tone: 'info',
    stages: [
      { label: 'Leads Recebidos', value: 320 },
      { label: 'Agendamentos', value: 96, rate: 30 },
      { label: 'Visitas', value: 58, rate: 18 },
      { label: 'Vendas', value: 19, rate: 6 },
    ],
  },
  {
    id: 'carteira',
    title: 'CARTEIRA',
    description: 'Clientes ativos e reativação',
    icon: <Phone size={18} />,
    tone: 'success',
    stages: [
      { label: 'Contatos', value: 280 },
      { label: 'Agendamentos', value: 84, rate: 30 },
      { label: 'Visitas', value: 42, rate: 15 },
      { label: 'Vendas', value: 12, rate: 4 },
    ],
  },
  {
    id: 'porta',
    title: 'PORTA',
    description: 'Tráfego espontâneo no showroom',
    icon: <MapPin size={18} />,
    tone: 'purple',
    stages: [
      { label: 'Atendimentos', value: 210 },
      { label: 'Vendas', value: 7, rate: 3 },
    ],
  },
]

const teamRanking = [
  { id: '1', name: 'João Silva', leads: 5, carteira: 2, porta: 1, total: 8 },
  { id: '2', name: 'Marcos Lima', leads: 3, carteira: 1, porta: 1, total: 5 },
  { id: '3', name: 'Ana Costa', leads: 3, carteira: 0, porta: 0, total: 3 },
  { id: '4', name: 'Carlos Souza', leads: 2, carteira: 0, porta: 0, total: 2 },
  { id: '5', name: 'Pedro Santos', leads: 0, carteira: 0, porta: 0, total: 0 },
]

export default function FunilVendasGerente() {
  const totalSales = useMemo(() => funnelData.reduce((acc, r) => acc + (r.stages[r.stages.length - 1]?.value ?? 0), 0), [])
  const totalLeads = useMemo(() => funnelData.reduce((acc, r) => acc + (r.stages[0]?.value ?? 0), 0), [])
  const conversaoGeral = totalLeads > 0 ? Math.round((totalSales / totalLeads) * 100) : 0

  return (
    <div className="flex flex-col gap-mx-lg p-mx-lg pb-28">
      <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Funil de Vendas</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs">Desempenho completo da equipe por canal de origem.</Typography>
        </div>
        <div className="flex flex-wrap gap-mx-sm">
          <button type="button" className="flex h-mx-11 items-center gap-mx-xs rounded-mx-xl border border-border-default bg-white px-mx-md text-sm font-black text-text-secondary hover:bg-surface-alt transition-all">
            <Filter size={16} /> Filtros
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-info text-white shadow-mx-sm" aria-hidden="true">
              <Users size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Total Leads</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totalLeads}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">de todos os canais</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-success text-white shadow-mx-sm" aria-hidden="true">
              <Trophy size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Vendas Realizadas</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{totalSales}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">fechadas no período</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full bg-status-warning text-white shadow-mx-sm" aria-hidden="true">
              <TrendingUp size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Conversão Geral</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">{conversaoGeral}<span className="text-2xl">%</span></Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">lead → venda</Typography>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
          <div className="flex items-center gap-mx-sm">
            <span className="flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-full text-white shadow-mx-sm" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }} aria-hidden="true">
              <TrendingDown size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Gargalo Principal</Typography>
          </div>
          <Typography variant="h2" className="mt-mx-md text-3xl font-black tabular-nums">Visita → Venda</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">Conversão abaixo da meta</Typography>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Funil por Canal</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">Cada linha representa o ciclo lead → venda por origem.</Typography>

          <div className="mt-mx-lg flex flex-col gap-mx-md">
            {funnelData.map((row) => {
              const palette = tonePalette[row.tone]
              return (
                <div key={row.id} className="rounded-mx-xl border border-border-default p-mx-md">
                  <div className="flex items-center justify-between gap-mx-md">
                    <div className="flex items-center gap-mx-sm">
                      <span className={cn('flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-lg', palette.iconBg, palette.iconText)} aria-hidden="true">
                        {row.icon}
                      </span>
                      <div>
                        <Typography variant="tiny" className={cn('font-black uppercase tracking-widest', palette.iconText)}>{row.title}</Typography>
                        <Typography variant="tiny" tone="muted" className="block font-bold normal-case">{row.description}</Typography>
                      </div>
                    </div>
                  </div>

                  <div className={cn('mt-mx-md grid gap-mx-sm', row.stages.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}>
                    {row.stages.map((stage, i) => (
                      <div key={stage.label} className="relative">
                        {i > 0 && (
                          <span className="absolute -left-mx-tiny top-1/2 hidden -translate-y-1/2 text-text-tertiary md:block" aria-hidden="true">
                            <ChevronRight size={14} />
                          </span>
                        )}
                        <div className="rounded-mx-lg bg-surface-alt px-mx-sm py-mx-sm">
                          <Typography variant="tiny" tone="muted" className="block truncate font-black uppercase tracking-tight">{stage.label}</Typography>
                          <div className="mt-mx-tiny flex items-baseline gap-mx-xs">
                            <Typography variant="h3" className="font-mono-numbers text-text-primary">{stage.value}</Typography>
                            {typeof stage.rate === 'number' && (
                              <span className={cn('inline-flex rounded-mx-md px-mx-tiny py-mx-tiny text-mx-tiny font-black tabular-nums', palette.pill)}>
                                {stage.rate}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="rounded-mx-2xl bg-white p-mx-lg shadow-mx-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Ranking por Origem</Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case">Vendas da equipe por canal (mês).</Typography>

          <div className="mt-mx-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt/60">
                <tr>
                  {['Vendedor', 'Leads', 'Carteira', 'Porta', 'Total'].map(h => (
                    <th key={h} className="px-mx-sm py-mx-sm text-left text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {teamRanking.map((member, idx) => (
                  <tr key={member.id}>
                    <td className="px-mx-sm py-mx-sm">
                      <div className="flex items-center gap-mx-xs">
                        <span className={cn('flex h-mx-7 w-mx-7 items-center justify-center rounded-mx-full font-black tabular-nums text-mx-tiny', idx === 0 ? 'bg-status-warning-surface text-status-warning' : 'bg-surface-alt text-text-tertiary')}>{idx + 1}</span>
                        <Typography variant="p" className="truncate font-black">{member.name}</Typography>
                      </div>
                    </td>
                    <td className="px-mx-sm py-mx-sm text-center"><Typography variant="mono" tone="info">{member.leads}</Typography></td>
                    <td className="px-mx-sm py-mx-sm text-center"><Typography variant="mono" tone="success">{member.carteira}</Typography></td>
                    <td className="px-mx-sm py-mx-sm text-center"><Typography variant="mono" className="text-[var(--color-accent-purple)]">{member.porta}</Typography></td>
                    <td className="px-mx-sm py-mx-sm text-center"><Typography variant="mono" className="font-black">{member.total}</Typography></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  )
}
