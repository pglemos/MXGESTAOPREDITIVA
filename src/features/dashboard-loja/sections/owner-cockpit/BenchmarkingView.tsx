import { useEffect, useState } from 'react'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import type { DashboardData } from './types'
import { formatPlanningValue, scoreStatus } from './format'
import { MXScoreCompact, SectionTitle, SideList } from './primitives'
import { useCentralMxBenchmark, type CentralMxBenchmarkPeerGroup, type CentralMxBenchmarkState } from '../../hooks/useCentralMxBenchmark'

export function BenchmarkingView({
  data,
  mxScore,
  marginPercent,
}: {
  data: DashboardData
  mxScore: number | null
  marginPercent: number | null
}) {
  const [peerGroup, setPeerGroup] = useState<CentralMxBenchmarkPeerGroup>('mercado')
  const salesBenchmark = useCentralMxBenchmark()
  const marginBenchmark = useCentralMxBenchmark()
  const funnelBenchmark = useCentralMxBenchmark()

  const peerOptions: Array<{ value: CentralMxBenchmarkPeerGroup; label: string }> = [
    { value: 'mercado', label: 'Mercado geral' },
    { value: 'regiao', label: 'Região da loja' },
    { value: 'porte', label: 'Porte da loja' },
    { value: 'segmento', label: 'Segmento da loja' },
  ]

  useEffect(() => {
    const storeId = data.operationalStore?.id
    if (!storeId) return
    const query = { storeId, peerGroup, period: data.periodEndDate }
    void Promise.all([
      salesBenchmark.fetchBenchmark({ ...query, metricCode: 'sales_volume' }),
      marginBenchmark.fetchBenchmark({ ...query, metricCode: 'gross_margin_pct' }),
      funnelBenchmark.fetchBenchmark({ ...query, metricCode: 'lead_to_schedule_rate' }),
    ])
  }, [data.operationalStore?.id, data.periodEndDate, funnelBenchmark.fetchBenchmark, marginBenchmark.fetchBenchmark, peerGroup, salesBenchmark.fetchBenchmark])

  const benchmarkValue = (state: CentralMxBenchmarkState) => state.data?.peer_avg ?? null
  const bestValue = (state: CentralMxBenchmarkState) => state.data?.peer_top ?? null

  const rows = [
    {
      label: 'Vendas Totais (Unid.)', 
      store: data.metrics.totalSales, 
      group: benchmarkValue(salesBenchmark),
      best: bestValue(salesBenchmark),
      status: benchmarkValue(salesBenchmark) == null ? 'Pendente' : data.metrics.totalSales >= benchmarkValue(salesBenchmark)! ? 'Bom' : 'Atenção'
    },
    { 
      label: 'Margem Média de Venda (%)', 
      store: marginPercent, 
      group: benchmarkValue(marginBenchmark),
      best: bestValue(marginBenchmark),
      status: marginPercent === null || benchmarkValue(marginBenchmark) == null ? 'Pendente' : marginPercent >= benchmarkValue(marginBenchmark)! ? 'Bom' : 'Atenção'
    },
    { 
      label: 'Conversão Leads > Agendamento (%)', 
      store: data.funilData.tx_lead_agd, 
      group: benchmarkValue(funnelBenchmark),
      best: bestValue(funnelBenchmark),
      status: benchmarkValue(funnelBenchmark) == null ? 'Pendente' : data.funilData.tx_lead_agd >= benchmarkValue(funnelBenchmark)! ? 'Bom' : 'Atenção'
    },
    { 
      label: 'Custo por Venda', 
      store: data.latestDRE?.cac ?? null, 
      group: null, 
      best: null, 
      status: data.latestDRE ? 'Acompanhar' : 'Pendente' 
    },
    { 
      label: 'MX Score', 
      store: mxScore, 
      group: null, 
      best: null, 
      status: scoreStatus(mxScore) 
    },
  ]

  const opportunities = rows.filter(row => row.status === 'Atenção').map(row => row.label)
  const benchmarkError = salesBenchmark.error || marginBenchmark.error || funnelBenchmark.error
  const benchmarkLoading = salesBenchmark.loading || marginBenchmark.loading || funnelBenchmark.loading

  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Benchmarking" subtitle={`Compare sua loja com dados reais do recorte ${peerGroup}.`} />
      <Card className="rounded-mx-2xl p-mx-lg">
        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-[minmax(0,320px)_1fr] md:items-end">
          <label className="rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-sm flex flex-col gap-1">
            <Typography variant="tiny" tone="muted" className="block font-black uppercase text-xs">Grupo de comparação</Typography>
            <select
              aria-label="Grupo de comparação do benchmarking"
              value={peerGroup}
              onChange={(event) => setPeerGroup(event.target.value as CentralMxBenchmarkPeerGroup)}
              className="mt-mx-xs w-full bg-transparent font-black text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-mx-md p-1 border border-border-subtle cursor-pointer"
            >
              {peerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <Typography variant="p" tone="muted" className="text-sm font-bold">
            O recorte usa o grupo persistido no snapshot da sua loja; detalhes individuais são ocultados quando houver menos de cinco lojas.
          </Typography>
        </div>
        {benchmarkLoading && <p role="status" className="mt-mx-sm text-sm font-bold text-text-tertiary">Atualizando comparação…</p>}
        {benchmarkError && <p role="alert" className="mt-mx-sm rounded-mx-lg border border-status-error/30 bg-status-error-surface p-mx-sm text-sm font-bold text-status-error">Não foi possível carregar o benchmark: {benchmarkError}</p>}
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
          <SideList title="Principais Oportunidades" items={opportunities.length ? opportunities : ['Nenhum desvio com benchmark disponível.']} />
        </div>
      </div>
    </div>
  )
}
