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
  info: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', barBg: 'bg-blue-600', pill: 'bg-blue-50 text-blue-600' },
  success: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', barBg: 'bg-emerald-600', pill: 'bg-emerald-50 text-emerald-600' },
  warning: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', barBg: 'bg-amber-500', pill: 'bg-amber-50 text-amber-600' },
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
    <div className="flex flex-col gap-8 p-8 pb-28">
      <header className="flex flex-col gap-6 border-b border-gray-100 pb-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Typography variant="h1" className="text-3xl md:text-4xl">Funil de Vendas</Typography>
          <Typography variant="p" tone="muted" className="mt-2">Desempenho completo da equipe por canal de origem.</Typography>
        </div>
        <div className="flex flex-wrap gap-4">
          <button type="button" className="flex h-11 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-6 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all">
            <Filter size={16} /> Filtros
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl bg-white p-6 shadow-sm border-none">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm" aria-hidden="true">
              <Users size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Total Leads</Typography>
          </div>
          <Typography variant="h2" className="mt-6 text-3xl font-black tabular-nums">{totalLeads}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">de todos os canais</Typography>
        </Card>

        <Card className="rounded-2xl bg-white p-6 shadow-sm border-none">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm" aria-hidden="true">
              <Trophy size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Vendas Realizadas</Typography>
          </div>
          <Typography variant="h2" className="mt-6 text-3xl font-black tabular-nums">{totalSales}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">fechadas no período</Typography>
        </Card>

        <Card className="rounded-2xl bg-white p-6 shadow-sm border-none">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm" aria-hidden="true">
              <TrendingUp size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Conversão Geral</Typography>
          </div>
          <Typography variant="h2" className="mt-6 text-3xl font-black tabular-nums">{conversaoGeral}<span className="text-2xl">%</span></Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">lead → venda</Typography>
        </Card>

        <Card className="rounded-2xl bg-white p-6 shadow-sm border-none">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }} aria-hidden="true">
              <TrendingDown size={18} />
            </span>
            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Gargalo Principal</Typography>
          </div>
          <Typography variant="h2" className="mt-6 text-3xl font-black tabular-nums">Visita → Venda</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">Conversão abaixo da meta</Typography>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl bg-white p-8 shadow-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Funil por Canal</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">Cada linha representa o ciclo lead → venda por origem.</Typography>

          <div className="mt-8 flex flex-col gap-6">
            {funnelData.map((row) => {
              const palette = tonePalette[row.tone]
              return (
                <div key={row.id} className="rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', palette.iconBg, palette.iconText)} aria-hidden="true">
                        {row.icon}
                      </span>
                      <div>
                        <Typography variant="tiny" className={cn('font-black uppercase tracking-widest', palette.iconText)}>{row.title}</Typography>
                        <Typography variant="tiny" tone="muted" className="block font-bold normal-case">{row.description}</Typography>
                      </div>
                    </div>
                  </div>

                  <div className={cn('mt-6 grid gap-4', row.stages.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2')}>
                    {row.stages.map((stage, i) => (
                      <div key={stage.label} className="relative">
                        {i > 0 && (
                          <span className="absolute -left-1 top-1/2 hidden -translate-y-1/2 text-gray-500 md:block" aria-hidden="true">
                            <ChevronRight size={14} />
                          </span>
                        )}
                        <div className="rounded-2xl bg-gray-50 px-4 py-4">
                          <Typography variant="tiny" tone="muted" className="block truncate font-black uppercase tracking-tight">{stage.label}</Typography>
                          <div className="mt-1 flex items-baseline gap-2">
                            <Typography variant="h3" className="font-mono tabular-nums text-gray-800">{stage.value}</Typography>
                            {typeof stage.rate === 'number' && (
                              <span className={cn('inline-flex rounded-xl px-1 py-1 text-[10px] font-black tabular-nums', palette.pill)}>
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

        <Card className="rounded-2xl bg-white p-8 shadow-sm border-none">
          <Typography variant="h3" className="text-xl font-black">Ranking por Origem</Typography>
          <Typography variant="tiny" tone="muted" className="mt-2 block font-bold normal-case">Vendas da equipe por canal (mês).</Typography>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60">
                <tr>
                  {['Vendedor', 'Leads', 'Carteira', 'Porta', 'Total'].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {teamRanking.map((member, idx) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full font-black tabular-nums text-[10px]', idx === 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500')}>{idx + 1}</span>
                        <Typography variant="p" className="truncate font-black">{member.name}</Typography>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center"><Typography variant="mono" tone="info">{member.leads}</Typography></td>
                    <td className="px-4 py-4 text-center"><Typography variant="mono" tone="success">{member.carteira}</Typography></td>
                    <td className="px-4 py-4 text-center"><Typography variant="mono" className="text-[var(--color-accent-purple)]">{member.porta}</Typography></td>
                    <td className="px-4 py-4 text-center"><Typography variant="mono" className="font-black">{member.total}</Typography></td>
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
