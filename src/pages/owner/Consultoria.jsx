import { CalendarDays, LineChart, Package } from 'lucide-react'
import { CentralMxPersistedAgendaPanel } from '@/features/dashboard-loja/sections/CentralMxPersistedPanels'
import { ConsultingProgramCard } from '@/features/dashboard-loja/sections/owner-cockpit/ConsultingProgramCard'
import { OwnerConsultingView } from '@/features/dashboard-loja/sections/owner-cockpit/OwnerBase44Views'
import { OwnerModuleGrid } from '@/features/dashboard-loja/sections/owner-cockpit/OwnerModuleGrid'
import { useOwnerConsultingProgram } from '@/features/dashboard-loja/hooks/useOwnerConsultingProgram'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export default function Consultoria() {
  const { data } = useOwnerContext()
  const storeId = data.operationalStore?.id || null
  const { program, loading: programLoading, error: programError } = useOwnerConsultingProgram(storeId)

  return (
    <>
      <ConsultingProgramCard program={program} loading={programLoading} error={programError} />
      <OwnerConsultingView data={data} />
      <OwnerModuleGrid
        title="Visitas e acompanhamento"
        subtitle="Acompanhamento PMR, PMR Plus, PPA e evidências da consultoria."
        items={[
          { title: 'Checklist da visita', detail: 'Roteiro, observações e execução.', icon: <CalendarDays size={20} />, tone: 'brand' },
          { title: 'Relatório e ata', detail: 'Resumo da visita e próximos passos.', icon: <LineChart size={20} />, tone: 'info' },
          { title: 'Evidências', detail: 'Fotos, anexos e validações.', icon: <Package size={20} />, tone: 'warning' },
        ]}
      />
      <CentralMxPersistedAgendaPanel storeId={storeId} />
    </>
  )
}
