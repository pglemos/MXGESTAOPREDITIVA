import { PlanejamentoEstrategico } from '@/features/central-mx/sections/PlanejamentoEstrategico'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function PlanoEstrategico() {
  const { centralMx, periodLabel } = useOwnerContext()

  return (
    <PlanejamentoEstrategico
      planningIndicators={centralMx.planningIndicators}
      periodLabel={periodLabel}
    />
  )
}
