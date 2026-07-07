import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import type { DashboardData } from './types'
import { SectionTitle, MXScoreCompact } from './primitives'
import { OwnerAlertList, OwnerPanoramaChart } from './OwnerHomeWidgets'

export function ResultsView({
  data,
  alerts,
  panoramaData,
  mxScore,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  panoramaData: Array<{ label: string; planejado: number; realizado: number }>
  mxScore: number | null
}) {
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Resultados" subtitle="Metas, realizado, ano anterior e leitura executiva." />
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_340px]">
        <OwnerPanoramaChart data={panoramaData} goalValue={data.metrics.goalValue} attainment={data.metrics.attainment} />
        <div className="space-y-mx-md">
          <MXScoreCompact score={mxScore} />
          <OwnerAlertList alerts={alerts} />
        </div>
      </div>
    </div>
  )
}
