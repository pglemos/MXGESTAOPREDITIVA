import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useStores } from '@/hooks/useStores'
import { slugify } from '@/lib/utils'
import { DashboardErrorBoundary } from '@/features/dashboard-loja/components/DashboardErrorBoundary'
import {
  OwnerStoreUnavailable,
  PerformanceLoadingSkeleton,
  ResolvingStoreSpinner,
} from '@/features/dashboard-loja/sections/DashboardEmptyStates'
import { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { useStoreResolution } from '@/features/dashboard-loja/hooks/useStoreResolution'
import { usePerformanceAlerts } from '@/features/dashboard-loja/sections/PerformanceAlerts'
import { OwnerCockpitHeader } from '@/features/dashboard-loja/sections/owner-cockpit/primitives'
import {
  alertFromEngine,
  actionFromEngine,
  buildCentralMx,
  buildPanoramaData,
  currentPeriodLabel,
  departmentFromEngine,
} from '@/features/dashboard-loja/sections/owner-cockpit/format'
import OwnerLayout from '@/components/owner/OwnerLayout'
import { OwnerProvider } from '@/components/owner/OwnerContext'
import OwnerHome from '@/pages/owner/OwnerHome'
import PlanoEstrategico from '@/pages/owner/PlanoEstrategico'
import PlanoDeAcao from '@/pages/owner/PlanoDeAcao'
import Consultoria from '@/pages/owner/Consultoria'
import {
  OwnerConsultantPage,
  OwnerDecisionPage,
  OwnerDepartmentsPage,
  OwnerMarketPage,
  OwnerNotFoundPage,
  OwnerRoutinePage,
  OwnerUniversityPage,
} from '@/pages/owner/OwnerSurfaces'
import '@/styles/owner-base44-exact.css'

function alertIdentity(alert: { title: string; description: string; variant: string; recommendation?: string }) {
  return [alert.title, alert.description, alert.variant, alert.recommendation].join('::')
}

function resolveSurface(wildcard: string | undefined) {
  const normalized = (wildcard || '').replace(/^\/+|\/+$/g, '')
  const [segment = '', detail] = normalized.split('/')
  const surface = segment === 'consultor-ia' ? 'consultor' : segment
  return { surface, detail }
}

export default function OwnerBase44Route() {
  const { profile, role, setActiveStoreId, signOut } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ storeSlug: string; '*': string }>()
  const { lojas, loading: storesLoading } = useStores()
  const activeStores = useMemo(() => (lojas || []).filter((store) => store.active), [lojas])

  const {
    isOwner,
    storeSlug,
    selectableStores,
    selectedStoreId,
    selectedStore,
    requestedStoreForbidden,
    storeResolutionIssue,
    resolving,
  } = useStoreResolution({ activeStores, storesLoading })

  const data = useDashboardLojaData({
    selectedStoreId,
    selectedStoreName: selectedStore?.name || 'Unidade MX',
    managerCalendarMode: false,
  })

  const { alerts } = usePerformanceAlerts({
    role,
    isOwner,
    metrics: data.metrics,
    sellers: data.sellers,
    checkins: data.checkins,
    funilData: data.funilData,
    funnelBenchmarks: data.funnelBenchmarks,
    selectedStoreId: selectedStoreId || '',
  })

  const periodLabel = currentPeriodLabel(data.referenceDate)
  const panoramaData = useMemo(() => buildPanoramaData(data), [data])
  const marginPercent = data.latestDRE && data.latestDRE.gross_margin > 0
    ? (data.latestDRE.net_sales_margin / data.latestDRE.gross_margin) * 100
    : null
  const centralMx = useMemo(() => buildCentralMx(data, marginPercent), [data, marginPercent])
  const departments = useMemo(
    () => centralMx.departments.map(departmentFromEngine),
    [centralMx.departments],
  )
  const ownerAlerts = useMemo(() => {
    const generated = centralMx.alerts.map(alertFromEngine)
    return [...generated, ...alerts].filter(
      (alert, index, list) => list.findIndex((candidate) => alertIdentity(candidate) === alertIdentity(alert)) === index,
    )
  }, [alerts, centralMx.alerts])
  const actions = useMemo(() => centralMx.actionPlanItems.map(actionFromEngine), [centralMx.actionPlanItems])
  const mxScore = centralMx.scores.store.value
  const criticalAlerts = ownerAlerts.filter((alert) => alert.variant === 'danger' || alert.variant === 'warning')
  const { surface, detail } = resolveSurface(params['*'])
  const selectedDepartmentCode = surface === 'departamentos' && detail ? detail : null

  const changeStore = useCallback((storeId: string) => {
    const store = selectableStores.find((candidate) => candidate.id === storeId)
    if (!store) return
    setActiveStoreId(store.id)
    navigate(`/lojas/${slugify(store.name)}`)
  }, [navigate, selectableStores, setActiveStoreId])

  if (role !== 'dono') return <Navigate to="/lojas" replace />

  if (!resolving && !storesLoading && (requestedStoreForbidden || storeResolutionIssue || !selectedStoreId)) {
    return (
      <OwnerStoreUnavailable
        requestedStoreForbidden={requestedStoreForbidden}
        storeResolutionIssue={storeResolutionIssue}
      />
    )
  }

  if (resolving || (storesLoading && !selectedStoreId)) return <ResolvingStoreSpinner />
  if (!selectedStoreId) return <Navigate to="/lojas" replace />
  if (data.loading && !data.isRefetching) return <PerformanceLoadingSkeleton />

  const page = (() => {
    switch (surface) {
      case '': return <OwnerHome />
      case 'rotina': return <OwnerRoutinePage />
      case 'decisoes': return <OwnerDecisionPage />
      case 'plano-estrategico': return <PlanoEstrategico />
      case 'plano-acao': return <PlanoDeAcao />
      case 'consultoria': return <Consultoria />
      case 'departamentos': return <OwnerDepartmentsPage />
      case 'mercado': return <OwnerMarketPage />
      case 'universidade': return <OwnerUniversityPage />
      case 'consultor': return <OwnerConsultantPage />
      default: return <OwnerNotFoundPage />
    }
  })()

  const resolvedStoreSlug = storeSlug || params.storeSlug || slugify(selectedStore?.name || 'unidade-mx')
  const contextValue = {
    profile,
    signOut,
    storeSlug: resolvedStoreSlug,
    selectedStoreId,
    selectedStore,
    selectableStores,
    changeStore,
    data,
    centralMx,
    ownerAlerts,
    actions,
    departments,
    panoramaData,
    periodLabel,
    marginPercent,
    mxScore,
    selectedDepartmentCode,
  }

  return (
    <DashboardErrorBoundary sectionName="OwnerBase44Route">
      <OwnerProvider value={contextValue}>
        <OwnerLayout>
          <section className="owner-base44-scope space-y-mx-md">
            <OwnerCockpitHeader
              name={profile?.name || 'Diretor'}
              periodLabel={periodLabel}
              alertCount={criticalAlerts.length}
              storeName={data.metrics.storeName}
            />
            {page}
          </section>
        </OwnerLayout>
      </OwnerProvider>
    </DashboardErrorBoundary>
  )
}
