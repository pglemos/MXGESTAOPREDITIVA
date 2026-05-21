import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

interface DisciplineData {
  status: 'consistent' | string
  label: string
  submitted_days: number
  expected_days: number
  percentage: number
  pending_days: number
}

interface DisciplineCardProps {
  discipline: DisciplineData | null
}

/**
 * Card "Disciplina de lançamento" — % de puxadas nos últimos 7 dias.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function DisciplineCard({ discipline }: DisciplineCardProps) {
  if (!discipline) return null
  const isConsistent = discipline.status === 'consistent'
  return (
    <Card className="p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg">
        <div className="flex items-center gap-mx-md min-w-0">
          <div
            className={cn(
              'w-mx-16 h-mx-16 rounded-mx-2xl flex items-center justify-center shadow-mx-inner border shrink-0',
              isConsistent
                ? 'bg-status-success-surface text-status-success border-status-success/20'
                : 'bg-status-warning-surface text-status-warning border-status-warning/20',
            )}
          >
            <Flame size={28} />
          </div>
          <div className="min-w-0">
            <Typography
              variant="tiny"
              tone="muted"
              className="font-black uppercase tracking-mx-widest"
            >
              Disciplina de lançamento
            </Typography>
            <Typography variant="h2" className="text-2xl sm:text-3xl uppercase tracking-tight">
              {discipline.label}
            </Typography>
            <Typography variant="p" tone="muted" className="text-sm">
              {discipline.submitted_days}/{discipline.expected_days} puxadas realizadas nos
              últimos 7 dias.
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-mx-md">
          <Typography
            variant="h1"
            tone={isConsistent ? 'success' : 'warning'}
            className="text-5xl tabular-nums leading-none"
          >
            {discipline.percentage}%
          </Typography>
          <Badge
            variant={isConsistent ? 'success' : 'warning'}
            className="rounded-mx-full px-4 py-1"
          >
            {discipline.pending_days} pend.
          </Badge>
        </div>
      </div>
    </Card>
  )
}

export default DisciplineCard
