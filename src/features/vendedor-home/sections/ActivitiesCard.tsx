import type { ReactNode } from 'react'
import { Award, CalendarDays, ListChecks, MessageCircle, MessageSquare, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { DashboardCard, CardTitle } from './DashboardPrimitives'

export type ActivitySummary = {
  negociacoes: number
  visitas: number
  retornos: number
  prospeccoes: number
  indicacoes: number
  feedbacksObrigatorios: number
  total: number
}

export function ActivitiesCard({ atividades }: { atividades: ActivitySummary }) {
  const rows: Array<[string, number, ReactNode]> = [
    ['Negociações', atividades.negociacoes, <MessageSquare size={15} />],
    ['Visitas', atividades.visitas, <CalendarDays size={15} />],
    ['Retornos', atividades.retornos, <MessageCircle size={15} />],
    ['Prospecções', atividades.prospeccoes, <UserRound size={15} />],
    ['Indicações', atividades.indicacoes, <Award size={15} />],
    ['Feedback obrigatório', atividades.feedbacksObrigatorios, <ListChecks size={15} />],
  ]

  return (
    <DashboardCard>
      <CardTitle icon={<ListChecks size={20} />} title="Atividades hoje" />
      {atividades.total === 0 ? (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-sm">
          <Typography variant="p" className="font-semibold text-text-primary">
            Nenhuma atividade executada ainda.
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
            Comece pela Central de Execução para registrar a primeira ação do dia.
          </Typography>
          <Link to="/central-execucao" className="mt-mx-sm inline-flex h-9 items-center justify-center rounded-mx-md bg-brand-primary px-mx-sm text-xs font-semibold text-white">
            Abrir Central de Execução
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-mx-md space-y-mx-xs">
            {rows.map(([label, value, icon]) => (
              <div key={label} className="flex items-center justify-between gap-mx-sm text-sm">
                <span className="flex items-center gap-mx-xs text-text-secondary">
                  <span className="text-brand-primary">{icon}</span>
                  {label}
                </span>
                <strong className="font-semibold text-text-primary">{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-mx-md flex items-center justify-between border-t border-border-subtle pt-mx-sm text-sm font-semibold">
            <span>Total de atividades</span>
            <span>{atividades.total}</span>
          </div>
        </>
      )}
    </DashboardCard>
  )
}
