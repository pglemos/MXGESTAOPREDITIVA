import { OwnerHome as OwnerHomeView } from '@/features/dashboard-loja/sections/owner-cockpit/OwnerHome'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function OwnerHome() {
  const {
    data,
    ownerAlerts,
    actions,
    departments,
    panoramaData,
    mxScore,
    marginPercent,
  } = useOwnerContext()

  return (
    <OwnerHomeView
      data={data}
      alerts={ownerAlerts}
      actions={actions}
      departments={departments}
      panoramaData={panoramaData}
      mxScore={mxScore}
      marginPercent={marginPercent}
    />
  )
}
