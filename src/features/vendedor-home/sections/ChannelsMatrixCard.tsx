import { BarChart3, Car, Globe, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card'

interface ChannelsMatrixCardProps {
  porCanal: { porta: number; carteira: number; internet: number }
  vendasMes: number
}

/**
 * Card "Matrix de Canais" — distribuição de fechamentos por origem (porta/carteira/digital).
 * Story 3.4 reconciliada (ADR-0050).
 */
export function ChannelsMatrixCard({ porCanal, vendasMes }: ChannelsMatrixCardProps) {
  const denom = vendasMes || 1
  const channels = [
    {
      label: 'Porta',
      value: porCanal.porta,
      icon: Car,
      tone: 'success' as const,
      pct: Math.round((porCanal.porta / denom) * 100),
    },
    {
      label: 'Carteira',
      value: porCanal.carteira,
      icon: Users,
      tone: 'info' as const,
      pct: Math.round((porCanal.carteira / denom) * 100),
    },
    {
      label: 'Digital',
      value: porCanal.internet,
      icon: Globe,
      tone: 'brand' as const,
      pct: Math.round((porCanal.internet / denom) * 100),
    },
  ]
  return (
    <Card className="p-mx-lg md:p-mx-xl relative overflow-hidden group border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
      <div
        className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-mx-3xl -mr-48 -mt-48 pointer-events-none"
        aria-hidden="true"
      />
      <CardHeader className="flex flex-row items-center justify-between mb-12 relative z-10 p-mx-0 bg-transparent border-none">
        <div>
          <CardTitle className="text-2xl md:text-3xl mb-2 uppercase tracking-tighter leading-none font-black">
            Matrix de Canais
          </CardTitle>
          <CardDescription className="uppercase font-black text-mx-tiny tracking-mx-widest">
            DISTRIBUIÇÃO DE FECHAMENTOS POR ORIGEM
          </CardDescription>
        </div>
        <div className="w-mx-12 h-mx-12 md:w-mx-14 md:h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-text-tertiary shadow-mx-inner shrink-0">
          <BarChart3 size={24} />
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-md md:gap-mx-lg relative z-10">
        {channels.map(ch => (
          <Card
            key={ch.label}
            className="p-mx-md md:p-mx-lg border border-border-default hover:border-brand-primary/20 hover:shadow-mx-xl transition-all group/item bg-surface-alt/30 rounded-mx-3xl"
          >
            <div className="flex justify-between items-start mb-8 md:mb-10">
              <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-white flex items-center justify-center shadow-mx-sm border border-border-default group-hover/item:rotate-6 transition-transform shrink-0">
                <ch.icon
                  size={20}
                  className={cn(
                    ch.tone === 'success'
                      ? 'text-status-success'
                      : ch.tone === 'brand'
                        ? 'text-brand-primary'
                        : 'text-status-info',
                  )}
                />
              </div>
              <Badge
                variant="outline"
                className="text-mx-nano font-mono-numbers font-black border-border-strong px-2"
              >
                {ch.pct}%
              </Badge>
            </div>
            <Typography
              variant="h1"
              className="text-4xl sm:text-6xl font-mono-numbers mb-1 leading-none font-black"
            >
              {ch.value}
            </Typography>
            <Typography
              variant="caption"
              tone="muted"
              className="tracking-mx-widest uppercase font-black text-mx-nano"
            >
              {ch.label}
            </Typography>
          </Card>
        ))}
      </div>
    </Card>
  )
}

export default ChannelsMatrixCard
