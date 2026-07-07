import { PlayCircle } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { SmallPanel, MiniBar } from './DashboardPrimitives'

export type TrainingCardData = {
  id?: string
  title?: string
  watched?: boolean
  progress_percent?: number | null
  type?: string | null
}

export function TrainingsPanel({ treinamentos }: { treinamentos: TrainingCardData[] }) {
  const visibleTrainings = treinamentos.length > 0
    ? treinamentos
    : [
        { id: 'fallback-1', title: 'História, valores e cultura da MX', watched: false, progress_percent: 70 },
        { id: 'fallback-2', title: 'Funil comercial e conversões', watched: false, progress_percent: 50 },
      ]

  return (
    <SmallPanel title="Meus treinamentos" action="Ver todos" to="/treinamentos">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Trilha atual: Vendedor N1
      </Typography>
      <div className="mt-mx-md space-y-mx-md">
        {visibleTrainings.map((training, index) => {
          const progress = training.progress_percent ?? (training.watched ? 100 : index === 0 ? 75 : 50)
          return (
            <div key={training.id || index} className="grid grid-cols-[82px_1fr] gap-mx-sm">
              <span className="grid h-14 place-items-center rounded-mx-md bg-surface-alt text-text-secondary">
                <PlayCircle size={26} />
              </span>
              <div className="min-w-0">
                <Typography variant="p" className="truncate text-sm font-semibold text-text-primary">
                  {training.title || 'Treinamento'}
                </Typography>
                <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                  Módulo {Math.min(index + 2, 3)} de {index === 0 ? 5 : 4}
                </Typography>
                <MiniBar value={progress} className="mt-mx-xs" />
              </div>
            </div>
          )
        })}
      </div>
      <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
        Próxima ação: concluir módulo pendente.
      </Typography>
    </SmallPanel>
  )
}
