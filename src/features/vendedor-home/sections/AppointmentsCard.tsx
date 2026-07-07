import { CalendarDays } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { DashboardCard, CardTitle, MiniBar } from './DashboardPrimitives'

export function AppointmentsCard({
  total,
  confirmados,
  aguardando,
  metaDiaria,
}: {
  total: number
  confirmados: number
  aguardando: number
  metaDiaria: number
}) {
  const percent = metaDiaria > 0 ? Math.min(100, Math.round((total / metaDiaria) * 100)) : 0

  return (
    <DashboardCard>
      <CardTitle icon={<CalendarDays size={20} />} title="Agendamentos hoje" />
      <Typography variant="h1" className="mt-mx-md text-center text-4xl">
        {total}
      </Typography>
      <Typography variant="caption" tone="muted" className="block text-center normal-case tracking-normal">
        agendamentos
      </Typography>
      <Typography variant="caption" tone="muted" className="mt-mx-md block text-center normal-case tracking-normal">
        {confirmados} confirmados · {aguardando} aguardando
      </Typography>
      <div className="mt-mx-lg">
        <div className="mb-mx-xs flex items-center justify-between text-sm font-semibold">
          <span className="text-text-secondary">Meta diária: {metaDiaria}</span>
          <span className="text-brand-primary">{percent}%</span>
        </div>
        <MiniBar value={percent} />
      </div>
    </DashboardCard>
  )
}
