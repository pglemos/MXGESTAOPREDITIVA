import { Typography } from '@/components/atoms/Typography'
import { SmallPanel } from './DashboardPrimitives'

export type Achievement = {
  label: string
  detail: string
  points: number
}

export function AchievementsPanel({ conquistas }: { conquistas: { itens: Achievement[]; total: number } }) {
  return (
    <SmallPanel title="Minhas conquistas" action="Ver todas" to="/classificacao">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Conquistas liberadas conforme sua rotina evolui.
      </Typography>
      <div className="mt-mx-md space-y-mx-sm">
        {conquistas.itens.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-mx-sm">
            <div className="min-w-0">
              <Typography variant="p" className="text-sm font-semibold text-text-primary">
                {item.label}
              </Typography>
              <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                {item.detail}
              </Typography>
            </div>
            <span className="shrink-0 rounded-mx-sm bg-status-success/10 px-2 py-1 text-xs font-semibold text-status-success">
              +{item.points} pts
            </span>
          </div>
        ))}
      </div>
      <div className="mt-mx-md flex items-center justify-between rounded-mx-md bg-brand-primary/5 p-mx-sm text-brand-primary">
        <span className="font-semibold">Total de pontos</span>
        <strong className="text-xl">{conquistas.total} pts</strong>
      </div>
    </SmallPanel>
  )
}
