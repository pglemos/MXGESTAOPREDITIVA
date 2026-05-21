import { Link } from 'react-router-dom'
import { Crown, Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/molecules/Card'

interface Competitor {
  user_name: string
  vnd_total: number
}

interface RankingSectionProps {
  position?: number
  vendasMes: number
  atingimento: number
  competitorAbove?: Competitor | null
  competitorBelow?: Competitor | null
}

/**
 * Bloco "Ranking da Unidade" — posição atual, competitor acima e abaixo.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function RankingSection({
  position,
  vendasMes,
  atingimento,
  competitorAbove,
  competitorBelow,
}: RankingSectionProps) {
  return (
    <Card className="bg-white p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg relative overflow-hidden group rounded-mx-4xl">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between mb-12 relative z-10 gap-mx-md p-mx-0 border-none bg-transparent">
        <div className="flex items-center gap-mx-sm">
          <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-status-warning text-white flex items-center justify-center shadow-mx-md">
            <Trophy size={28} />
          </div>
          <div>
            <CardTitle className="text-2xl md:text-3xl leading-tight font-black">
              Ranking da Unidade
            </CardTitle>
            <CardDescription className="font-black text-mx-tiny tracking-mx-wide mt-1">
              Sua posição no período atual
            </CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          asChild
          className="rounded-mx-full px-8 h-mx-12 bg-surface-alt border border-border-default shadow-mx-sm uppercase font-black tracking-widest text-mx-tiny w-full sm:w-auto hover:border-brand-primary transition-all"
        >
          <Link to="/classificacao">Ver ranking completo</Link>
        </Button>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg relative z-10 items-stretch">
        <Card
          className={cn(
            'p-mx-lg border-2 border-dashed flex flex-col justify-center rounded-mx-3xl',
            competitorAbove
              ? 'bg-white border-mx-green-100 shadow-mx-md'
              : 'bg-surface-alt opacity-40 border-border-default',
          )}
        >
          {competitorAbove ? (
            <>
              <Typography
                variant="tiny"
                tone="brand"
                className="mb-6 block font-black uppercase tracking-mx-widest"
              >
                Próxima referência
              </Typography>
              <div className="flex items-center gap-mx-sm mb-8">
                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-warning-surface text-status-warning flex items-center justify-center font-black text-xl border border-status-warning/10 shadow-inner shrink-0 font-mono-numbers">
                  {position ? position - 1 : '--'}º
                </div>
                <div className="min-w-0">
                  <Typography
                    variant="h3"
                    className="text-lg uppercase tracking-tight truncate font-black"
                  >
                    {competitorAbove.user_name}
                  </Typography>
                  <Typography
                    variant="tiny"
                    tone="muted"
                    className="uppercase font-black text-mx-tiny"
                  >
                    {competitorAbove.vnd_total} VENDAS
                  </Typography>
                </div>
              </div>
              <div className="bg-status-success-surface rounded-mx-xl p-mx-sm text-center border border-status-success/10">
                <Typography
                  variant="tiny"
                  tone="brand"
                  className="font-black uppercase text-mx-tiny"
                >
                  GAP: {competitorAbove.vnd_total - vendasMes} VENDAS
                </Typography>
              </div>
            </>
          ) : (
            <div className="text-center py-6 md:py-10">
              <Crown size={48} className="text-status-warning mx-auto mb-4 animate-bounce" />
              <Typography
                variant="caption"
                tone="brand"
                className="tracking-mx-widest font-black uppercase text-mx-tiny"
              >
                Você está em 1º
              </Typography>
            </div>
          )}
        </Card>

        <Card className="p-mx-lg md:p-mx-xl bg-mx-black text-white shadow-mx-elite transform md:scale-105 border-none relative overflow-hidden flex flex-col justify-between py-12 md:py-16 order-first md:order-none mb-4 md:mb-0 rounded-mx-4xl">
          <div
            className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/20 rounded-mx-full blur-mx-4xl"
            aria-hidden="true"
          />
          <div className="text-center relative z-10">
            <Typography
              variant="tiny"
              tone="brand"
              className="mb-4 block tracking-mx-widest font-black uppercase"
            >
              STATUS ATUAL
            </Typography>
            <Typography
              variant="h1"
              tone="white"
              className="text-7xl sm:text-9xl tabular-nums leading-none mb-2 tracking-tighter font-black font-mono-numbers"
            >
              {position || '--'}º
            </Typography>
            <Typography
              variant="tiny"
              tone="white"
              className="uppercase tracking-mx-widest font-black text-mx-tiny opacity-40"
            >
              NA UNIDADE
            </Typography>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
            <div>
              <Typography
                variant="tiny"
                tone="white"
                className="opacity-30 mb-1 block uppercase font-black text-mx-nano"
              >
                VENDIDO
              </Typography>
              <Typography
                variant="h3"
                tone="white"
                className="text-xl sm:text-3xl font-mono-numbers font-black"
              >
                {vendasMes}
              </Typography>
            </div>
            <div className="text-right">
              <Typography
                variant="tiny"
                tone="white"
                className="opacity-30 mb-1 block uppercase font-black text-mx-nano"
              >
                EFICIÊNCIA
              </Typography>
              <Typography
                variant="h3"
                tone="brand"
                className="text-xl sm:text-3xl font-mono-numbers font-black"
              >
                {atingimento}%
              </Typography>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            'p-mx-lg border-2 border-dashed flex flex-col justify-center rounded-mx-3xl',
            competitorBelow
              ? 'bg-white border-mx-rose-100 shadow-mx-md'
              : 'bg-surface-alt opacity-40 border-border-default',
          )}
        >
          {competitorBelow ? (
            <>
              <Typography
                variant="tiny"
                tone="error"
                className="mb-6 block uppercase font-black tracking-mx-widest"
              >
                Próximo na lista
              </Typography>
              <div className="flex items-center gap-mx-sm mb-8">
                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-error-surface text-status-error flex items-center justify-center font-black text-xl border border-status-error/10 shadow-inner shrink-0 font-mono-numbers">
                  {position ? position + 1 : '--'}º
                </div>
                <div className="min-w-0">
                  <Typography
                    variant="h3"
                    className="text-lg uppercase tracking-tight truncate font-black"
                  >
                    {competitorBelow.user_name}
                  </Typography>
                  <Typography
                    variant="tiny"
                    tone="muted"
                    className="uppercase font-black text-mx-tiny"
                  >
                    {competitorBelow.vnd_total} VENDAS
                  </Typography>
                </div>
              </div>
              <div className="bg-status-error-surface rounded-mx-xl p-mx-sm text-center border border-status-error/10">
                <Typography
                  variant="tiny"
                  tone="error"
                  className="font-black uppercase text-mx-tiny"
                >
                  VANTAGEM: {vendasMes - competitorBelow.vnd_total} VENDAS
                </Typography>
              </div>
            </>
          ) : (
            <div className="text-center py-6 md:py-10">
              <Flame size={48} className="text-status-error mx-auto mb-4" />
              <Typography
                variant="caption"
                tone="error"
                className="tracking-mx-widest font-black uppercase text-mx-tiny"
              >
                Sem comparação inferior
              </Typography>
            </div>
          )}
        </Card>
      </div>
    </Card>
  )
}

export default RankingSection
