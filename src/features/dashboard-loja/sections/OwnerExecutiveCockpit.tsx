import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  LineChart as LineChartIcon,
  Package,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'
import {
  CentralMxPersistedAgendaPanel,
  CentralMxPersistedAlertsPanel,
  CentralMxPersistedPlanosPanel,
} from './CentralMxPersistedPanels'
import { CentralMxBenchmarkInteractive } from './CentralMxBenchmarkInteractive'
import { CentralMxPlanoSegmentadoPanel } from './CentralMxPlanoSegmentadoPanel'
import { ConsultorIaStoreSection } from '@/features/central-mx/sections/ConsultorIaStoreSection'
import { PlanejamentoEstrategico } from '@/features/central-mx/sections/PlanejamentoEstrategico'
import { DepartamentoDashboard } from '@/features/departamentos/sections/DepartamentoDashboard'
import type { DepartamentoCode } from '@/features/departamentos/hooks/useDepartamentoDashboard'
import { MarketingModulo } from '@/features/marketing/sections/MarketingModulo'
import { UniversidadeMx } from '@/features/universidade/sections/UniversidadeMx'
import { CulturaFelicidade } from '@/features/cultura-felicidade/sections/CulturaFelicidade'
import { OwnerCockpitHeader } from './owner-cockpit/primitives'
import { OwnerHome } from './owner-cockpit/OwnerHome'
import { StrategicPlanningView } from './owner-cockpit/StrategicPlanningView'
import { ResultsView } from './owner-cockpit/ResultsView'
import { ActionPlanView } from './owner-cockpit/ActionPlanView'
import { AlertsView } from './owner-cockpit/AlertsView'
import { BenchmarkingView } from './owner-cockpit/BenchmarkingView'
import { AgendaView } from './owner-cockpit/AgendaView'
import { DepartmentsView } from './owner-cockpit/DepartmentsView'
import { OwnerModuleGrid } from './owner-cockpit/OwnerModuleGrid'
import {
  OwnerConsultingView,
  OwnerDecisionCenter,
  OwnerRoutineView,
} from './owner-cockpit/OwnerBase44Views'
import {
  alertFromEngine,
  actionFromEngine,
  buildCentralMx,
  buildPanoramaData,
  currentPeriodLabel,
  departmentFromEngine,
  getOwnerDepartmentCode,
  getOwnerSection,
} from './owner-cockpit/format'

type DashboardData = ReturnType<typeof useDashboardLojaData>

type OwnerExecutiveCockpitProps = {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
}

function alertIdentity(alert: OwnerPerformanceAlert) {
  return [alert.title, alert.description, alert.variant, alert.recommendation].join('::')
}

export function OwnerExecutiveCockpit({ data, alerts }: OwnerExecutiveCockpitProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [planCreateRequest, setPlanCreateRequest] = useState(0)
  const periodLabel = currentPeriodLabel(data.referenceDate)
  const panoramaData = useMemo(() => buildPanoramaData(data), [data])
  const marginPercent = data.latestDRE && data.latestDRE.gross_margin > 0
    ? (data.latestDRE.net_sales_margin / data.latestDRE.gross_margin) * 100
    : null
  const centralMx = useMemo(() => buildCentralMx(data, marginPercent), [data, marginPercent])
  const departments = useMemo(() => centralMx.departments.map(departmentFromEngine), [centralMx.departments])
  const ownerAlerts = useMemo(() => {
    const generated = centralMx.alerts.map(alertFromEngine)
    return [...generated, ...alerts].filter(
      (alert, index, list) => list.findIndex(candidate => alertIdentity(candidate) === alertIdentity(alert)) === index,
    )
  }, [alerts, centralMx.alerts])
  const actions = useMemo(() => centralMx.actionPlanItems.map(actionFromEngine), [centralMx.actionPlanItems])
  const mxScore = centralMx.scores.store.value
  const criticalAlerts = ownerAlerts.filter((alert) => alert.variant === 'danger' || alert.variant === 'warning')
  const section = getOwnerSection(location.search)
  const selectedDepartmentCode = getOwnerDepartmentCode(location.search)

  const universityContent = (
    <>
      <UniversidadeMx userId={profile?.id ?? null} />
      <OwnerModuleGrid
        title="Universidade MX"
        subtitle="Conteúdos, playbooks e trilhas aplicados à execução estratégica."
        items={[
          { title: 'Playbooks comerciais', detail: 'Abordagem, follow-up e fechamento.', icon: <Target size={20} />, tone: 'brand' },
          { title: 'Trilhas da liderança', detail: 'Conteúdo para gerente, Dono e responsáveis.', icon: <Users size={20} />, tone: 'info' },
          { title: 'Materiais da consultoria', detail: 'Modelos, documentos e preparação.', icon: <ShieldCheck size={20} />, tone: 'success' },
          { title: 'Biblioteca executiva', detail: 'Conteúdo organizado por problema e departamento.', icon: <BookOpen size={20} />, tone: 'warning' },
          { title: 'Indicadores aplicados', detail: 'Como interpretar os números antes de agir.', icon: <LineChartIcon size={20} />, tone: 'info' },
          { title: 'Evidências e modelos', detail: 'Checklists, anexos e padrões de execução.', icon: <Package size={20} />, tone: 'muted' },
        ]}
      />
    </>
  )

  return (
    <section className="owner-base44-scope min-h-full space-y-mx-md bg-surface-alt p-mx-sm md:p-mx-lg">
      <OwnerCockpitHeader
        name={profile?.name || 'Diretor'}
        periodLabel={periodLabel}
        alertCount={criticalAlerts.length}
        storeName={data.metrics.storeName}
      />

      {section === 'home' && (
        <OwnerHome
          data={data}
          alerts={ownerAlerts}
          actions={actions}
          departments={departments}
          mxScore={mxScore}
          marginPercent={marginPercent}
          onOpenConsultant={() => navigate('/falar-consultor')}
        />
      )}

      {section === 'rotina' && (
        <>
          <OwnerRoutineView data={data} alerts={ownerAlerts} actions={actions} />
          <AgendaView alerts={ownerAlerts} />
          <CentralMxPersistedAgendaPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'decisoes' && (
        <>
          <OwnerDecisionCenter alerts={ownerAlerts} actions={actions} />
          <CentralMxPersistedAlertsPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'planejamento' && (
        <>
          <StrategicPlanningView data={data} planningIndicators={centralMx.planningIndicators} />
          <PlanejamentoEstrategico planningIndicators={centralMx.planningIndicators} periodLabel={periodLabel} />
        </>
      )}

      {section === 'plano-acao' && (
        <>
          <ActionPlanView
            actions={actions}
            onNewAction={() => setPlanCreateRequest((current) => current + 1)}
            disableNewAction={!data.operationalStore?.id}
          />
          <CentralMxPlanoSegmentadoPanel
            storeId={data.operationalStore?.id || null}
            createRequest={planCreateRequest}
          />
          <CentralMxPersistedPlanosPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'consultoria' && (
        <>
          <OwnerConsultingView data={data} />
          <OwnerModuleGrid
            title="Visitas e acompanhamento"
            subtitle="Acompanhamento PMR, PMR Plus, PPA e evidências da consultoria."
            items={[
              { title: 'Checklist da visita', detail: 'Roteiro, observações e execução.', icon: <CalendarDays size={20} />, tone: 'brand' },
              { title: 'Relatório e ata', detail: 'Resumo da visita e próximos passos.', icon: <LineChartIcon size={20} />, tone: 'info' },
              { title: 'Evidências', detail: 'Fotos, anexos e validações.', icon: <Package size={20} />, tone: 'warning' },
            ]}
          />
          <CentralMxPersistedAgendaPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'departamentos' && (
        <>
          <DepartmentsView departments={departments} selectedDepartmentCode={selectedDepartmentCode} />
          <DepartamentoDashboard
            storeId={data.operationalStore?.id || null}
            code={(selectedDepartmentCode ?? 'comercial') as DepartamentoCode}
            periodLabel={periodLabel}
          />
          {selectedDepartmentCode === 'marketing' && (
            <MarketingModulo storeId={data.operationalStore?.id || null} />
          )}
          {selectedDepartmentCode === 'rh' && (
            <CulturaFelicidade storeId={data.operationalStore?.id || null} />
          )}
        </>
      )}

      {(section === 'mercado' || section === 'benchmarking') && (
        <>
          <BenchmarkingView data={data} mxScore={mxScore} marginPercent={marginPercent} />
          <CentralMxBenchmarkInteractive storeId={data.operationalStore?.id || null} />
        </>
      )}

      {(section === 'universidade' || section === 'biblioteca') && universityContent}

      {section === 'consultor' && (
        <ConsultorIaStoreSection storeId={data.operationalStore?.id || null} />
      )}

      {section === 'resultados' && (
        <ResultsView data={data} alerts={ownerAlerts} panoramaData={panoramaData} mxScore={mxScore} />
      )}

      {section === 'alertas' && (
        <>
          <AlertsView alerts={ownerAlerts} />
          <CentralMxPersistedAlertsPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'agenda' && (
        <>
          <AgendaView alerts={ownerAlerts} />
          <CentralMxPersistedAgendaPanel storeId={data.operationalStore?.id || null} />
        </>
      )}

      {section === 'visitas' && (
        <OwnerModuleGrid
          title="Visitas"
          subtitle="Acompanhamento PMR, PMR Plus, PPA e evidências."
          items={[
            { title: 'Checklist da visita', detail: 'Roteiro, observações e execução.', icon: <CalendarDays size={20} />, tone: 'brand' },
            { title: 'Relatório e ata', detail: 'Resumo da visita e próximos passos.', icon: <LineChartIcon size={20} />, tone: 'info' },
            { title: 'Evidências', detail: 'Fotos, anexos e validações.', icon: <Package size={20} />, tone: 'warning' },
          ]}
        />
      )}
    </section>
  )
}

export default OwnerExecutiveCockpit
