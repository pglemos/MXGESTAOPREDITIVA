import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import type { DashboardData } from './types'
import { formatPlanningValue, scoreStatus } from './format'
import { MXScoreCompact, SectionTitle, SideList } from './primitives'

export function BenchmarkingView({
  data,
  mxScore,
  marginPercent,
}: {
  data: DashboardData
  mxScore: number | null
  marginPercent: number | null
}) {
  const rows = [
    { label: 'Vendas Totais (Unid.)', store: data.metrics.totalSales, group: data.metrics.goalValue || null, best: null, status: data.metrics.goalValue && data.metrics.totalSales >= data.metrics.goalValue ? 'Bom' : 'Atenção' },
    { label: 'Margem Média de Venda (%)', store: marginPercent, group: null, best: null, status: marginPercent === null ? 'Pendente' : marginPercent >= 18 ? 'Bom' : 'Atenção' },
    { label: 'Conversão Leads > Agendamento (%)', store: data.funilData.tx_lead_agd, group: data.funnelBenchmarks.leadAgd, best: null, status: data.funilData.tx_lead_agd >= data.funnelBenchmarks.leadAgd ? 'Bom' : 'Atenção' },
    { label: 'Custo por Venda', store: data.latestDRE?.cac ?? null, group: null, best: null, status: data.latestDRE ? 'Acompanhar' : 'Pendente' },
    { label: 'MX Score', store: mxScore, group: null, best: null, status: scoreStatus(mxScore) },
  ]

  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Benchmarking" subtitle="Compare sua loja com metas, benchmarks configurados e melhores práticas." />
      <Card className="rounded-mx-2xl p-mx-lg">
        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-4">
          {['Região', 'Porte da Loja', 'Marca / Grupo', 'Segmento'].map((label, index) => (
            <div key={label} className="rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-sm">
              <Typography variant="tiny" tone="muted" className="block font-black uppercase">{label}</Typography>
              <Typography variant="p" className="mt-mx-xs font-black">{index === 0 ? 'Sul' : index === 1 ? 'Médio' : index === 2 ? 'Todas' : 'Multimarcas'}</Typography>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Indicadores Comparados</Typography>
          <div className="mt-mx-md overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <tr>
                  <th className="px-mx-sm py-mx-sm">Indicador</th>
                  <th className="px-mx-sm py-mx-sm">Sua Loja</th>
                  <th className="px-mx-sm py-mx-sm">Benchmark</th>
                  <th className="px-mx-sm py-mx-sm">Melhor Grupo</th>
                  <th className="px-mx-sm py-mx-sm">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map(row => (
                  <tr key={row.label}>
                    <td className="px-mx-sm py-mx-sm font-black">{row.label}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.store)}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.group)}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.best)}</td>
                    <td className="px-mx-sm py-mx-sm"><span className="rounded-mx-md border border-status-warning/20 bg-status-warning-surface px-mx-sm py-mx-xs text-mx-tiny font-black text-status-warning">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-mx-md">
          <MXScoreCompact score={mxScore} />
          <SideList title="Principais Oportunidades" items={['Reduzir estoque acima de 90 dias', 'Melhorar conversão de visitas em vendas', 'Aumentar giro de estoque']} />
        </div>
      </div>
    </div>
  )
}
