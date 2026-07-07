import { Avatar } from '@/components/atoms/Avatar'
import { Typography } from '@/components/atoms/Typography'
import type { RankingEntry } from '@/types/database'
import { DashboardCard, PanelTitle } from './DashboardPrimitives'

export function RankingPanel({ ranking, selfId }: { ranking: RankingEntry[]; selfId?: string }) {
  const top =
    ranking.length > 0
      ? ranking.slice(0, 5)
      : ([
          {
            user_id: 'fallback-vendedor',
            user_name: 'Vendedor MX Consultoria 1',
            avatar_url: null,
            vnd_total: 0,
          },
        ] as RankingEntry[])
  const selfIndex = Math.max(0, top.findIndex((entry) => entry.user_id === selfId))
  const selfPosition = `${selfIndex + 1}º`
  const compactRanking = top.length <= 1

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Ranking da loja" action="Ver ranking completo" to="/classificacao" />
      <div className="mt-mx-md divide-y divide-border-subtle">
        {top.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center justify-between gap-mx-sm ${compactRanking ? 'py-mx-xs' : 'py-mx-sm'} ${entry.user_id === selfId ? 'rounded-mx-md bg-brand-primary/5 px-mx-xs' : ''}`}
          >
            <div className="flex min-w-0 items-center gap-mx-sm">
              <span className="w-7 text-center text-sm font-semibold text-status-warning">
                {index < 3 ? ['1º', '2º', '3º'][index] : index + 1}
              </span>
              <Avatar src={entry.avatar_url || undefined} fallback={entry.user_name} alt={entry.user_name} className="h-9 w-9 rounded-full" />
              <Typography variant="p" className="truncate font-semibold text-text-primary">
                {entry.user_name}
              </Typography>
            </div>
            <Typography variant="p" className="shrink-0 font-semibold text-text-secondary">
              {entry.vnd_total} venda{entry.vnd_total === 1 ? '' : 's'}
            </Typography>
          </div>
        ))}
      </div>
      <div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-sm">
        <Typography variant="caption" className="block font-semibold normal-case tracking-normal text-text-primary">
          Sua posição: {selfPosition}
        </Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
          Ranking atualizado após fechamento diário.
        </Typography>
      </div>
    </DashboardCard>
  )
}
