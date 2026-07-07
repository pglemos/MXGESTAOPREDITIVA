import { Typography } from '@/components/atoms/Typography'
import { SmallPanel } from './DashboardPrimitives'

export function EvolutionPanel({ series }: { series: Array<{ label: string; value: number }> }) {
  const hasData = series.length > 1
  const max = Math.max(1, ...series.map((point) => point.value))
  const points = series
    .map((point, index) => `${(index / Math.max(series.length - 1, 1)) * 216},${82 - (point.value / max) * 60}`)
    .join(' ')

  return (
    <SmallPanel title="Minha evolução" action="Ver histórico" to="/vendedor/terminal-mx">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Vendas dos últimos 7 dias
      </Typography>
      <div className="mt-mx-md h-36 rounded-mx-md bg-surface-alt p-mx-md">
        {hasData ? (
          <svg viewBox="0 0 220 90" className="h-full w-full" role="img" aria-label="Vendas dos últimos lançamentos">
            <polyline points={points} fill="none" stroke="var(--color-brand-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="var(--color-brand-primary)">
              {series.map((point, index) => (
                <circle key={`${point.label}-${index}`} cx={(index / Math.max(series.length - 1, 1)) * 216} cy={82 - (point.value / max) * 60} r="4" />
              ))}
            </g>
          </svg>
        ) : (
          <div className="space-y-mx-xs pt-mx-sm text-center">
            <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">
              Faça seus fechamentos diários para acompanhar:
            </Typography>
            {['vendas', 'agendamentos', 'retornos concluídos', 'disciplina da rotina'].map((item) => (
              <Typography key={item} variant="tiny" tone="muted" className="block normal-case tracking-normal">
                {item}
              </Typography>
            ))}
          </div>
        )}
      </div>
    </SmallPanel>
  )
}
