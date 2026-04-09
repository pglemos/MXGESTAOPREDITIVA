import { Trophy, Car, ShieldCheck, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

interface MXScoreCardProps {
  label: string
  value: string | number
  sub: string
  icon: any
  tone: 'brand' | 'success' | 'warning' | 'error'
}

export function MXScoreCard({ label, value, sub, icon: Icon, tone }: MXScoreCardProps) {
  return (
    <Card className="p-8 border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <Typography variant="caption" tone="muted" className="block uppercase tracking-widest text-[8px]">{label}</Typography>
          <div className="flex items-baseline gap-2">
              <Typography variant="h1" className="text-4xl tabular-nums leading-none">{value}</Typography>
              <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase opacity-40">{sub}</Typography>
          </div>
        </div>
        <div className={cn(
          'h-12 w-12 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110',
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
