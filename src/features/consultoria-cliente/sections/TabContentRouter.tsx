import { ConsultingStrategicView } from '@/features/consultoria/components/ConsultingStrategicView'
import { ConsultingActionPlanView } from '@/features/consultoria/components/ConsultingActionPlanView'
import { DREView } from '@/features/consultoria/components/DREView'
import { ConsultingDailyTrackingView } from '@/features/consultoria/components/ConsultingDailyTrackingView'
import { ConsultingMonthlyCloseView } from '@/features/consultoria/components/ConsultingMonthlyCloseView'
import { ConsultingDriveFilesView } from '@/features/consultoria/components/ConsultingDriveFilesView'
import type { ConsultingClientDetail } from '@/features/consultoria/types'
import type { ConsultingMethodologyStep } from '@/lib/schemas/consulting-client.schema'
import { ConsultoriaErrorBoundary } from '../components/ConsultoriaErrorBoundary'
import type { Tab } from '../data/types'
import { OverviewSection } from './OverviewSection'
import { VisitsSection } from './VisitsSection'
import { ROISection } from './ROISection'
import { PDIsSection } from './PDIsSection'

type Props = {
  activeTab: Tab
  client: ConsultingClientDetail
  clientId: string
  clientSlug?: string
  resolvedStoreId: string
  canManage: boolean
  methodologySteps: ConsultingMethodologyStep[]
  onOpenLegacyCompletion: () => void
  onOpenVisitModal: (visitNumber?: number) => void
}

export function TabContentRouter({
  activeTab,
  client,
  clientId,
  clientSlug,
  resolvedStoreId,
  canManage,
  methodologySteps,
  onOpenLegacyCompletion,
  onOpenVisitModal,
}: Props) {
  switch (activeTab) {
    case 'overview':
      return (
        <ConsultoriaErrorBoundary sectionName="Visão Geral">
          <OverviewSection client={client} />
        </ConsultoriaErrorBoundary>
      )
    case 'visits':
      return (
        <ConsultoriaErrorBoundary sectionName="Agenda/Visitas">
          <VisitsSection
            client={client}
            clientSlug={clientSlug}
            canManage={canManage}
            methodologySteps={methodologySteps}
            onOpenLegacyCompletion={onOpenLegacyCompletion}
            onOpenVisitModal={onOpenVisitModal}
          />
        </ConsultoriaErrorBoundary>
      )
    case 'strategic':
      return (
        <ConsultoriaErrorBoundary sectionName="Estratégico">
          <ConsultingStrategicView clientId={clientId} clientName={client.name} />
        </ConsultoriaErrorBoundary>
      )
    case 'action':
      return (
        <ConsultoriaErrorBoundary sectionName="Plano de Ação">
          <ConsultingActionPlanView clientId={clientId} />
        </ConsultoriaErrorBoundary>
      )
    case 'financial':
      return (
        <ConsultoriaErrorBoundary sectionName="DRE/Financeiro">
          <DREView clientId={clientId} />
        </ConsultoriaErrorBoundary>
      )
    case 'daily':
      return (
        <ConsultoriaErrorBoundary sectionName="Acomp. Diário">
          <ConsultingDailyTrackingView clientId={clientId} />
        </ConsultoriaErrorBoundary>
      )
    case 'monthly':
      return (
        <ConsultoriaErrorBoundary sectionName="Fechamento">
          <ConsultingMonthlyCloseView clientId={clientId} />
        </ConsultoriaErrorBoundary>
      )
    case 'roi':
      return (
        <ConsultoriaErrorBoundary sectionName="ROI/Choque">
          <ROISection client={client} />
        </ConsultoriaErrorBoundary>
      )
    case 'pdis':
      return (
        <ConsultoriaErrorBoundary sectionName="PDI">
          <PDIsSection storeId={resolvedStoreId} />
        </ConsultoriaErrorBoundary>
      )
    case 'files':
      return (
        <ConsultoriaErrorBoundary sectionName="Arquivos">
          <ConsultingDriveFilesView clientId={clientId} />
        </ConsultoriaErrorBoundary>
      )
    default:
      return null
  }
}

export default TabContentRouter
