import { OwnerHome as OwnerHomeView } from '@/features/dashboard-loja/sections/owner-cockpit/OwnerHome'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function OwnerHome() {
  const {
    data,
    ownerAlerts,
    actions,
    departments,
    mxScore,
    marginPercent,
    openConsultantModal,
  } = useOwnerContext()

  return (
    <OwnerHomeView
      data={data}
      alerts={ownerAlerts}
      actions={actions}
      departments={departments}
      mxScore={mxScore}
      marginPercent={marginPercent}
      onOpenConsultant={openConsultantModal}
    />
  )
}
