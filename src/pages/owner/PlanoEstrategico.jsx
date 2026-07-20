import { PlanejamentoEstrategico } from '@/features/central-mx/sections/PlanejamentoEstrategico'
import { StrategicPlanningView } from '@/features/dashboard-loja/sections/owner-cockpit/StrategicPlanningView'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function PlanoEstrategico() {
  const { data, centralMx, periodLabel } = useOwnerContext()

  return (
    <>
      <StrategicPlanningView data={data} planningIndicators={centralMx.planningIndicators} />
      <PlanejamentoEstrategico
        planningIndicators={centralMx.planningIndicators}
        periodLabel={periodLabel}
      />
    </>
  )
}
