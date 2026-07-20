import { BookOpen, LineChart, Package, ShieldCheck, Target, Users } from 'lucide-react'
import { CentralMxBenchmarkInteractive } from '@/features/dashboard-loja/sections/CentralMxBenchmarkInteractive'
import {
  CentralMxPersistedAgendaPanel,
  CentralMxPersistedAlertsPanel,
} from '@/features/dashboard-loja/sections/CentralMxPersistedPanels'
import { ConsultorIaStoreSection } from '@/features/central-mx/sections/ConsultorIaStoreSection'
import { DepartamentoDashboard } from '@/features/departamentos/sections/DepartamentoDashboard'
import { MarketingModulo } from '@/features/marketing/sections/MarketingModulo'
import { UniversidadeMx } from '@/features/universidade/sections/UniversidadeMx'
import { CulturaFelicidade } from '@/features/cultura-felicidade/sections/CulturaFelicidade'
import { AgendaView } from '@/features/dashboard-loja/sections/owner-cockpit/AgendaView'
import { BenchmarkingView } from '@/features/dashboard-loja/sections/owner-cockpit/BenchmarkingView'
import { DepartmentsView } from '@/features/dashboard-loja/sections/owner-cockpit/DepartmentsView'
import {
  OwnerDecisionCenter,
  OwnerRoutineView,
} from '@/features/dashboard-loja/sections/owner-cockpit/OwnerBase44Views'
import { OwnerModuleGrid } from '@/features/dashboard-loja/sections/owner-cockpit/OwnerModuleGrid'
import { useOwnerContext } from '@/components/owner/OwnerContext'

export function OwnerRoutinePage() {
  const { data, ownerAlerts, actions } = useOwnerContext()
  const storeId = data.operationalStore?.id || null
  return (
    <>
      <OwnerRoutineView data={data} alerts={ownerAlerts} actions={actions} />
      <AgendaView alerts={ownerAlerts} />
      <CentralMxPersistedAgendaPanel storeId={storeId} />
    </>
  )
}

export function OwnerDecisionPage() {
  const { data, ownerAlerts, actions } = useOwnerContext()
  return (
    <>
      <OwnerDecisionCenter alerts={ownerAlerts} actions={actions} />
      <CentralMxPersistedAlertsPanel storeId={data.operationalStore?.id || null} />
    </>
  )
}

export function OwnerDepartmentsPage() {
  const { data, departments, selectedDepartmentCode, periodLabel } = useOwnerContext()
  const storeId = data.operationalStore?.id || null
  const code = selectedDepartmentCode || 'comercial'
  return (
    <>
      <DepartmentsView departments={departments} selectedDepartmentCode={selectedDepartmentCode} />
      <DepartamentoDashboard storeId={storeId} code={code} periodLabel={periodLabel} />
      {code === 'marketing' && <MarketingModulo storeId={storeId} />}
      {code === 'rh' && <CulturaFelicidade storeId={storeId} />}
    </>
  )
}

export function OwnerMarketPage() {
  const { data, mxScore, marginPercent } = useOwnerContext()
  return (
    <>
      <BenchmarkingView data={data} mxScore={mxScore} marginPercent={marginPercent} />
      <CentralMxBenchmarkInteractive storeId={data.operationalStore?.id || null} />
    </>
  )
}

export function OwnerUniversityPage() {
  const { profile } = useOwnerContext()
  return (
    <>
      <UniversidadeMx userId={profile?.id || null} />
      <OwnerModuleGrid
        title="Universidade MX"
        subtitle="Conteúdos, playbooks e trilhas aplicados à execução estratégica."
        items={[
          { title: 'Playbooks comerciais', detail: 'Abordagem, follow-up e fechamento.', icon: <Target size={20} />, tone: 'brand' },
          { title: 'Trilhas da liderança', detail: 'Conteúdo para gerente, Dono e responsáveis.', icon: <Users size={20} />, tone: 'info' },
          { title: 'Materiais da consultoria', detail: 'Modelos, documentos e preparação.', icon: <ShieldCheck size={20} />, tone: 'success' },
          { title: 'Biblioteca executiva', detail: 'Conteúdo organizado por problema e departamento.', icon: <BookOpen size={20} />, tone: 'warning' },
          { title: 'Indicadores aplicados', detail: 'Como interpretar os números antes de agir.', icon: <LineChart size={20} />, tone: 'info' },
          { title: 'Evidências e modelos', detail: 'Checklists, anexos e padrões de execução.', icon: <Package size={20} />, tone: 'muted' },
        ]}
      />
    </>
  )
}

export function OwnerConsultantPage() {
  const { data } = useOwnerContext()
  return <ConsultorIaStoreSection storeId={data.operationalStore?.id || null} />
}

export function OwnerNotFoundPage() {
  return (
    <section className="owner-base44-exact__empty-state" role="status">
      <strong>Página não encontrada</strong>
      <p>Esta superfície não pertence ao módulo executivo do Dono.</p>
    </section>
  )
}
