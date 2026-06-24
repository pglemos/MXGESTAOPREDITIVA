import { Calendar, MessageSquare, Target, Users, Zap, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'info' | 'warning'

type Props = {
  storeTotalVendas: number
  storeAttainment: number
  storeTotalLeads: number
  storeTotalAgd: number
  storeTotalVis: number
}

/**
 * Cards de stats do StoreRanking (Vendas Loja, Atingimento, Leads, Agendamentos,
 * Visitas). Visual preservado.
 */
export function StoreStatsCards({
  storeTotalVendas, storeAttainment, storeTotalLeads, storeTotalAgd, storeTotalVis,
}: Props) {
  const stats: Array<{ label: string; value: number | string; icon: LucideIcon; tone: Tone }> = [
    { label: 'Vendas Loja', value: storeTotalVendas, icon: Zap, tone: 'brand' },
    { label: 'Atingimento', value: `${storeAttainment}%`, icon: Target, tone: 'warning' },
    { label: 'Leads', value: storeTotalLeads, icon: MessageSquare, tone: 'info' },
    { label: 'Agendamentos', value: storeTotalAgd, icon: Calendar, tone: 'info' },
    { label: 'Visitas', value: storeTotalVis, icon: Users, tone: 'info' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-mx-sm shrink-0">
      {stats.map((stat, i) => (
        <Card key={i} className="p-mx-md flex flex-col justify-between bg-white border-none shadow-mx-sm relative overflow-hidden group hover:shadow-mx-md transition-all">
          <div className="flex justify-between items-start gap-mx-xs mb-2">
            <Typography variant="caption" tone="muted" className="uppercase tracking-wide font-black text-mx-nano leading-tight break-words min-w-0">{stat.label}</Typography>
            <stat.icon size={16} className={cn(
              "shrink-0",
              stat.tone === 'brand' ? 'text-brand-primary' :
                stat.tone === 'warning' ? 'text-status-warning' :
                  'text-status-info'
            )} />
          </div>
          <Typography variant="h2" className="text-2xl font-mono-numbers">{stat.value}</Typography>
        </Card>
      ))}
    </div>
  )
}

export default StoreStatsCards
