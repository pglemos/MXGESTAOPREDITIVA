import { Trophy, Car, ShieldCheck, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'

interface MXScoreCardProps {
  label: string
  value: string | number
  sub: string
  icon: any
  tone: 'brand' | 'success' | 'warning' | 'error'
}

export function MXScoreCard({ label, value, sub, icon: Icon, tone }: MXScoreCardProps) {
  return (
    <Card className="p-mx-lg border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white overflow-hidden relative">
      <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-mx-tiny">
          <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-mx-micro">{label}</Typography>
          <div className="flex items-baseline gap-mx-xs">
              <Typography variant="h1" className="text-4xl tabular-nums leading-none">{value}</Typography>
              <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase opacity-40">{sub}</Typography>
          </div>
        </div>
        <div className={cn(
          'h-mx-xl w-mx-xl rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
          tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
          tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
          tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
          'bg-status-error-surface border-mx-rose-100 text-status-error'
        )}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  )
}

MXScoreCard.Skeleton = function MXScoreCardSkeleton() {
  return (
    <Card className="p-mx-lg border-none shadow-mx-sm bg-white overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div className="space-y-mx-sm flex-1">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-baseline gap-mx-xs">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-mx-xl w-mx-xl rounded-mx-xl" />
      </div>
    </Card>
  )
}
