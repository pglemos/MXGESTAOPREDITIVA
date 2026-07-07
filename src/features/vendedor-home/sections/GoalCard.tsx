import { Target } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { DashboardCard, CardTitle, MiniMetric, MiniBar, ProgressRing } from './DashboardPrimitives'

export function GoalCard({
  meta,
  vendidos,
  projecao,
  faltam,
  atingimento,
  hasMetrics,
  attackItems,
}: {
  meta: number
  vendidos: number
  projecao: number
  faltam: number
  atingimento: number
  hasMetrics: boolean
  attackItems: string[]
}) {
  const metaLabel = hasMetrics && meta > 0 ? String(meta) : '—'
  const vendidosLabel = hasMetrics ? String(vendidos) : '—'
  const projecaoLabel = hasMetrics ? String(projecao) : '—'
  const paceLabel = !hasMetrics
    ? 'Aguardando dados'
    : faltam <= 0
      ? 'Meta batida'
      : `${faltam} venda${faltam === 1 ? '' : 's'} restante${faltam === 1 ? '' : 's'}`

  return (
    <DashboardCard>
      <CardTitle icon={<Target size={20} />} title="Minha meta (mês)" />
      <div className="mt-mx-sm grid grid-cols-2 gap-mx-sm">
        <MiniMetric label="Meta" value={metaLabel} hint="vendas" />
        <MiniMetric label="Realizado" value={vendidosLabel} hint="vendas" />
      </div>
      <div className="mt-mx-sm flex items-center gap-mx-md">
        <ProgressRing value={hasMetrics ? atingimento : 0} label="da meta" />
        <div className="min-w-0 flex-1">
          <MiniBar value={hasMetrics ? atingimento : 0} label="Atingimento da meta mensal" />
          <Typography variant="caption" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
            {hasMetrics ? `${Math.round(atingimento)}% de atingimento` : 'Carregando meta mensal'}
          </Typography>
        </div>
      </div>
      <div className="mt-mx-sm grid grid-cols-2 gap-mx-sm">
        <MiniMetric label="Projeção" value={projecaoLabel} hint="vendas" />
        <div>
          <Typography variant="tiny" tone="muted" className="block font-semibold normal-case tracking-normal">
            Ritmo necessário
          </Typography>
          <Typography variant="p" className="text-sm font-semibold text-text-primary">
            {paceLabel}
          </Typography>
        </div>
      </div>
      <Typography variant="p" className="mt-mx-sm text-sm font-semibold text-text-primary">
        {!hasMetrics
          ? 'Carregando indicadores do mês.'
          : meta === 0
          ? 'Meta mensal não cadastrada.'
          : faltam === 0
            ? 'Meta do mês batida!'
            : `Faltam ${faltam} venda${faltam === 1 ? '' : 's'} para bater a meta!`}
      </Typography>
      <div className="mt-mx-sm rounded-mx-md bg-brand-primary/5 p-mx-sm">
        <Typography variant="tiny" className="font-semibold normal-case tracking-normal text-text-primary">
          Plano de ataque de hoje
        </Typography>
        <div className="mt-mx-xs grid gap-mx-xs text-xs font-medium text-text-secondary">
          {attackItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}
