import { useState } from 'react'
import { ActionPlanView } from '@/features/dashboard-loja/sections/owner-cockpit/ActionPlanView'
import { CentralMxPlanoSegmentadoPanel } from '@/features/dashboard-loja/sections/CentralMxPlanoSegmentadoPanel'
import { CentralMxPersistedPlanosPanel } from '@/features/dashboard-loja/sections/CentralMxPersistedPanels'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function PlanoDeAcao() {
  const { data, actions } = useOwnerContext()
  const [createRequest, setCreateRequest] = useState(0)
  const storeId = data.operationalStore?.id || null

  return (
    <>
      <ActionPlanView
        actions={actions}
        onNewAction={() => setCreateRequest((current) => current + 1)}
        disableNewAction={!storeId}
      />
      <CentralMxPlanoSegmentadoPanel storeId={storeId} createRequest={createRequest} />
      <CentralMxPersistedPlanosPanel storeId={storeId} />
    </>
  )
}
