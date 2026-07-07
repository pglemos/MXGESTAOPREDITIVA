import { Award, ChevronRight, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import type { MeuScore } from '@/features/crm/hooks/useMeuScore'
import { DashboardCard, CardTitle, MiniBar } from './DashboardPrimitives'

export function ScoreCard({
  score,
  loading,
  bandLabel,
  nextBand,
}: {
  score: MeuScore
  loading: boolean
  bandLabel: Record<string, string>
  nextBand: Record<string, string>
}) {
  if (loading) {
    return (
      <DashboardCard>
        <CardTitle icon={<Award size={20} />} title="Meu Score MX" />
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-sm">
          <Typography variant="p" className="font-semibold text-text-primary">
            Calculando score...
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
            Buscando a classificação mais recente.
          </Typography>
        </div>
      </DashboardCard>
    )
  }

  if (!score) {
    return (
      <DashboardCard>
        <CardTitle icon={<Award size={20} />} title="Meu Score MX" />
        <div className="mt-mx-md flex items-center gap-mx-md">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-mx-lg bg-surface-alt text-text-tertiary ring-1 ring-border-subtle">
            <Shield size={34} />
          </span>
          <div className="min-w-0">
            <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
              Banda atual
            </Typography>
            <Typography variant="h3" className="truncate">
              Indisponível
            </Typography>
            <Typography variant="p" className="font-semibold text-text-secondary">
              Sem cálculo recente
            </Typography>
          </div>
        </div>
        <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
          Registre sua rotina para atualizar o Score MX.
        </Typography>
        <Link to="/vendedor/terminal-mx" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-semibold text-brand-primary">
          Abrir Fechamento Diário
          <ChevronRight size={14} />
        </Link>
      </DashboardCard>
    )
  }

  const value = score.value
  const points = Math.round(value * 10)
  const currentBand = bandLabel[score.band] || score.band
  const nextBandLabel = nextBand[score.band] || '—'
  const scoreParts: Array<[string, number | null]> = [
    ['Disciplina', score.dimDisciplina],
    ['Vendas', score.dimResultado],
    ['Execução', score.dimProcesso],
  ].filter((item): item is [string, number] => item[1] != null)

  return (
    <DashboardCard>
      <CardTitle icon={<Award size={20} />} title="Meu Score MX" />
      <div className="mt-mx-md flex items-center gap-mx-md">
        <span className="grid h-20 w-20 place-items-center rounded-mx-lg bg-surface-alt text-text-tertiary ring-1 ring-border-subtle">
          <Shield size={40} />
        </span>
        <div className="min-w-0">
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
            Banda atual
          </Typography>
          <Typography variant="h3" className="truncate">
            {currentBand}
          </Typography>
          <Typography variant="p" className="font-semibold text-brand-primary">
            {points} / 1000 pts
          </Typography>
        </div>
      </div>
      <MiniBar value={value} className="mt-mx-md" label="Score MX atual" />
      <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">
        Próxima banda: {nextBandLabel}
      </Typography>
      <div className="mt-mx-md grid grid-cols-2 gap-mx-xs">
        {scoreParts.map(([label, itemValue]) => (
          <div key={label} className="rounded-mx-sm bg-brand-primary/5 px-mx-xs py-mx-xs">
            <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">
              {label}
            </Typography>
            <strong className="text-sm text-text-primary">{Math.round(Number(itemValue) || 0)} / 100</strong>
          </div>
        ))}
      </div>
      <Link to="/classificacao" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-semibold text-brand-primary">
        Ver ranking MX
        <ChevronRight size={14} />
      </Link>
    </DashboardCard>
  )
}
