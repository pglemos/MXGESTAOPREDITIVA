import React, { Suspense, lazy, Component, type ReactNode, type ErrorInfo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { Toaster } from 'sonner'
import { MotionConfig } from 'motion/react'
import Layout from '@/components/Layout'
import LegacyModuleShell from '@/components/LegacyModuleShell'
import { slugify } from '@/lib/utils'
import { canAccessPath } from '@/lib/auth/routeAccess'

// Pages — Lazy loaded
const OAuthHome = lazy(() => import('@/pages/OAuthHome'))
const MXPerformanceLanding = lazy(() => import('@/pages/MXPerformanceLanding'))
const Login = lazy(() => import('@/pages/Login'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const StorePreRegistration = lazy(() => import('@/pages/StorePreRegistration'))

// Vendedor
const VendedorHome = lazy(() => import('@/pages/VendedorHome'))
const VendedorPDI = lazy(() => import('@/pages/VendedorPDI'))
const Checkin = lazy(() => import('@/pages/Checkin'))
const Historico = lazy(() => import('@/pages/Historico'))
const Ranking = lazy(() => import('@/pages/Ranking'))
const VendedorFeedback = lazy(() => import('@/pages/VendedorFeedback'))
const VendedorTreinamentos = lazy(() => import('@/pages/VendedorTreinamentos'))
const VendedorAjuda = lazy(() => import('@/pages/VendedorAjuda'))
const AgendaVendedor = lazy(() => import('@/features/vendedor-home/AgendaVendedor'))
const TrilhasVendedor = lazy(() => import('@/features/vendedor-home/TrilhasVendedor'))
const FunilVendasGerente = lazy(() => import('@/features/gerente/FunilVendasGerente'))
const MetasGerente = lazy(() => import('@/features/gerente/MetasGerente'))
const Notificacoes = lazy(() => import('@/pages/Notificacoes'))
const Perfil = lazy(() => import('@/pages/Perfil'))

// Gerente
const DashboardLoja = lazy(() => import('@/pages/DashboardLoja'))
const GerenteFeedback = lazy(() => import('@/pages/GerenteFeedback'))
const GerentePDI = lazy(() => import('@/pages/GerentePDI'))
const PDIPrint = lazy(() => import('@/pages/PDIPrint'))
const GerenteTreinamentos = lazy(() => import('@/pages/GerenteTreinamentos'))
const RotinaGerente = lazy(() => import('@/pages/RotinaGerente'))

// Admin
const PainelConsultor = lazy(() => import('@/pages/PainelConsultor'))
const Lojas = lazy(() => import('@/pages/Lojas'))
const ConsultorTreinamentos = lazy(() => import('@/pages/ConsultorTreinamentos'))
const ProdutosDigitais = lazy(() => import('@/pages/ProdutosDigitais'))
const ConsultorNotificacoes = lazy(() => import('@/pages/ConsultorNotificacoes'))
const Configuracoes = lazy(() => import('@/pages/Configuracoes'))
const OperationalSettings = lazy(() => import('@/pages/OperationalSettings'))
const ConsultoriaParametros = lazy(() => import('@/pages/ConsultoriaParametros'))
const Reprocessamento = lazy(() => import('@/pages/Reprocessamento'))
const AiDiagnostics = lazy(() => import('@/pages/AiDiagnostics'))
const MorningReport = lazy(() => import('@/pages/MorningReport'))
const SalesPerformance = lazy(() => import('@/pages/SalesPerformance'))
const SellerPerformance = lazy(() => import('@/pages/SellerPerformance'))
const Consultoria = lazy(() => import('@/pages/Consultoria'))
const ConsultoriaClientes = lazy(() => import('@/pages/ConsultoriaClientes'))
const ConsultoriaClienteDetalhe = lazy(() => import('@/pages/ConsultoriaClienteDetalhe'))
const ConsultoriaVisitaExecucao = lazy(() => import('@/pages/ConsultoriaVisitaExecucao'))
const AgendaAdmin = lazy(() => import('@/pages/AgendaAdmin'))
const Simulacao = lazy(() => import('@/pages/Simulacao'))

const Spinner = () => (
  <div className="flex flex-col items-center gap-mx-md">
    <div className="relative w-mx-2xl h-mx-2xl">
      <div className="absolute inset-0 border-4 border-brand-primary/10 rounded-mx-full"></div>
      <div className="absolute inset-0 border-4 border-t-brand-primary rounded-mx-full animate-spin"></div>
    </div>
    <p className="text-mx-tiny font-black text-text-tertiary uppercase tracking-mx-widest animate-pulse">MX PERFORMANCE</p>
  </div>
)

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen bg-mx-black flex flex-col items-center justify-center gap-mx-lg p-mx-xl">
        <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary/10 flex items-center justify-center">
          <span className="text-brand-primary font-black text-4xl">MX</span>
        </div>
        <h1 className="text-white text-xl font-black uppercase tracking-wider">Algo deu errado</h1>
        <p className="text-white/50 text-sm text-center max-w-md">
          A aplicação encontrou um erro inesperado. Tente recarregar a página.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <pre className="text-status-error text-xs bg-white/5 p-mx-md rounded-mx-lg max-w-lg overflow-auto text-left">{this.state.error.message}</pre>
        )}
        <button
          onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
          className="mt-mx-md px-8 py-3 bg-brand-primary text-white rounded-mx-full font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-colors"
        >
          Recarregar
        </button>
      </div>
    )
  }
}

const withLegacyShell = (node: React.ReactNode) => (
  <LegacyModuleShell>{node}</LegacyModuleShell>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading, initialized, role, baseRole } = useAuth()
  const location = useLocation()
  const isSimulationRoute = location.pathname === '/simulacao' || location.pathname.startsWith('/simulacao/')
  const routeAccessRole = isSimulationRoute ? baseRole || role : role

  if (loading || !initialized) return <div className="h-screen flex items-center justify-center bg-mx-black"><Spinner /></div>
  if (!profile) {
    if (import.meta.env.DEV) console.warn('Audit Warn [ProtectedRoute]: No profile found, redirecting to login.')
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!role) {
    if (import.meta.env.DEV) console.warn('Audit Warn [ProtectedRoute]: Invalid role, redirecting to login.')
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!canAccessPath(location.pathname, routeAccessRole)) {
    return <ForbiddenRoute />
  }
  return <>{children}</>
}

function ForbiddenRoute() {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-surface-alt flex items-center justify-center p-mx-lg">
      <section className="w-full max-w-lg rounded-mx-3xl border border-border-default bg-white p-mx-xl text-center shadow-mx-xl">
        <div className="mx-auto mb-mx-lg flex h-mx-20 w-mx-20 items-center justify-center rounded-mx-2xl bg-status-warning-surface text-status-warning">
          <span className="text-2xl font-black" aria-hidden="true">403</span>
        </div>
        <h1 className="text-2xl font-black tracking-mx-wide text-text-primary">Acesso não autorizado</h1>
        <p className="mt-mx-sm text-sm font-bold leading-relaxed tracking-normal text-text-tertiary">
          O perfil atual não tem permissão para acessar esta rota. Se esse acesso faz parte da sua rotina, solicite liberação ao Admin MX ou ao gestor responsável pela unidade.
        </p>
        <p className="mt-mx-md rounded-mx-xl bg-surface-alt px-mx-md py-mx-sm text-xs font-black uppercase tracking-mx-wide text-text-secondary">
          Perfil: {role || 'indefinido'} · Rota: {location.pathname}
        </p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="mt-mx-xl rounded-mx-full bg-brand-primary px-mx-xl py-mx-sm text-sm font-black uppercase tracking-mx-wide text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
        >
          Voltar para minha área
        </button>
      </section>
    </main>
  )
}

function RoleRedirect() {
  const { role, membership } = useAuth()
  if (isPerfilInternoMx(role)) return <Navigate to="/painel" replace />
  if (role === 'dono') return <Navigate to="/lojas" replace />
  if (role === 'gerente') {
    const storeDashboardPath = membership?.store?.name ? `/lojas/${slugify(membership.store.name)}` : '/classificacao'
    return <Navigate to={storeDashboardPath} replace />
  }
  if (role === 'vendedor') return <Navigate to="/home" replace />
  return <Navigate to="/login" replace />
}

function TeamAliasRedirect() {
  const { role, membership } = useAuth()
  if (isPerfilInternoMx(role) || role === 'dono') return <Navigate to="/lojas" replace />
  if (role === 'gerente' && membership?.store?.name) {
    return <Navigate to={`/lojas/${slugify(membership.store.name)}?tab=equipe`} replace />
  }
  return <ForbiddenRoute />
}

function PublicHome() {
  const { profile, loading, initialized } = useAuth()

  if (loading || !initialized) {
    return <div className="h-screen flex items-center justify-center bg-white"><Spinner /></div>
  }

  if (profile) return <RoleRedirect />

  return (
    <Suspense fallback={<Spinner />}>
      <MXPerformanceLanding />
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <MotionConfig reducedMotion="user">
        <Router>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/login" element={<Suspense fallback={<Spinner />}><Login /></Suspense>} />
            <Route path="/pre-cadastro/:storeSlug" element={<Suspense fallback={<Spinner />}><StorePreRegistration /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={<Spinner />}><Privacy /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<Spinner />}><Terms /></Suspense>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="settings" element={<Navigate to="/configuracoes" replace />} />
            <Route path="team" element={<TeamAliasRedirect />} />
            <Route path="equipe" element={<TeamAliasRedirect />} />

            {/* Home universal — cada papel renderiza seu cockpit em /home */}
            <Route path="home" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorHome />} gerente={<DashboardLoja />} dono={<DashboardLoja />} admin={<RoleRedirect />} />
            </Suspense>} />
            <Route path="lancamento-diario" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Checkin />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="historico" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Historico />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="agenda-vendedor" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<AgendaVendedor />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="trilhas" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<TrilhasVendedor />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="funil-vendas" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<FunilVendasGerente />} dono={<FunilVendasGerente />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="metas" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<MetasGerente />} dono={<MetasGerente />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="ajuda" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorAjuda />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<ForbiddenRoute />} />
            </Suspense>} />
            <Route path="ranking" element={<Navigate to="/classificacao" replace />} />
            <Route path="classificacao" element={<Suspense fallback={<Spinner />}><Ranking /></Suspense>} />
            <Route path="treinamentos" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorTreinamentos />} gerente={<GerenteTreinamentos />} dono={<GerenteTreinamentos />} admin={<ConsultorTreinamentos />} />
            </Suspense>} />
            <Route path="devolutivas" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorFeedback />} gerente={<GerenteFeedback />} dono={<GerenteFeedback />} admin={<GerenteFeedback />} />
            </Suspense>} />
            <Route path="notificacoes" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Notificacoes />} gerente={<Notificacoes />} dono={<Notificacoes />} admin={<Notificacoes />} />
            </Suspense>} />
            <Route path="perfil" element={<Suspense fallback={<Spinner />}><Perfil /></Suspense>} />

            {/* Gerente */}
            <Route path="lojas/:storeSlug" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<DashboardLoja />} dono={<DashboardLoja />} admin={<DashboardLoja />} />
            </Suspense>} />
            <Route path="pdi" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorPDI />} gerente={<GerentePDI />} dono={<GerentePDI />} admin={<GerentePDI />} />
            </Suspense>} />
            <Route path="pdi/:id/print" element={<Suspense fallback={<Spinner />}><PDIPrint /></Suspense>} />
            <Route path="rotina" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<RotinaGerente />} dono={<ForbiddenRoute />} admin={<RotinaGerente />} />
            </Suspense>} />

            {/* Admin Core */}
            <Route path="painel" element={<Suspense fallback={<Spinner />}><PainelConsultor /></Suspense>} />
            <Route path="lojas" element={<Suspense fallback={<Spinner />}><Lojas /></Suspense>} />
            <Route path="simulacao" element={<Suspense fallback={<Spinner />}><Simulacao /></Suspense>} />
            <Route path="simulacao/:simulationRole" element={<Suspense fallback={<Spinner />}><Simulacao /></Suspense>} />
            
            {/* Agenda Admin */}
            <Route path="agenda" element={<Suspense fallback={<Spinner />}><AgendaAdmin /></Suspense>} />

            {/* CRM de Consultoria */}
            <Route path="consultoria">
              <Route index element={<Suspense fallback={<Spinner />}><Consultoria /></Suspense>} />
              <Route path="clientes" element={<Suspense fallback={<Spinner />}><ConsultoriaClientes /></Suspense>} />
              <Route path="clientes/:clientSlug" element={<Suspense fallback={<Spinner />}><ConsultoriaClienteDetalhe /></Suspense>} />
              <Route path="clientes/:clientSlug/visitas/:visitNumber" element={<Suspense fallback={<Spinner />}><ConsultoriaVisitaExecucao /></Suspense>} />
            </Route>

            <Route path="produtos" element={<Suspense fallback={<Spinner />}><ProdutosDigitais /></Suspense>} />
            <Route path="configuracoes" element={<Suspense fallback={<Spinner />}><Configuracoes /></Suspense>} />
            <Route path="configuracoes/operacional" element={<Suspense fallback={<Spinner />}><OperationalSettings /></Suspense>} />
            <Route path="configuracoes/consultoria-pmr" element={<Suspense fallback={<Spinner />}><ConsultoriaParametros /></Suspense>} />
            <Route path="configuracoes/reprocessamento" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<ForbiddenRoute />} dono={<ForbiddenRoute />} admin={<Reprocessamento />} />
            </Suspense>} />
            <Route path="relatorio-matinal" element={<Suspense fallback={<Spinner />}><MorningReport /></Suspense>} />
            <Route path="relatorios/performance-vendas" element={<Suspense fallback={<Spinner />}><SalesPerformance /></Suspense>} />
            <Route path="relatorios/performance-vendedor" element={<Suspense fallback={<Spinner />}><SellerPerformance /></Suspense>} />
            <Route path="auditoria" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<ForbiddenRoute />} gerente={<AiDiagnostics />} dono={<ForbiddenRoute />} admin={<AiDiagnostics />} />
            </Suspense>} />

            <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
          </Route>
        </Routes>
      </Router>
      <Toaster richColors closeButton expand visibleToasts={5} position="top-right" toastOptions={{ duration: 8000 }} />
      </MotionConfig>
      </ErrorBoundary>
    </AuthProvider>
  )
}

function RoleSwitch({
  vendedor,
  gerente,
  dono,
  admin,
}: {
  vendedor: React.ReactNode
  gerente: React.ReactNode
  dono: React.ReactNode
  admin?: React.ReactNode
}) {
  const { role } = useAuth()
  if (isPerfilInternoMx(role)) return <>{admin ?? <RoleRedirect />}</>
  if (role === 'dono') return <>{dono}</>
  if (role === 'gerente') return <>{gerente}</>
  if (role === 'vendedor') return <>{vendedor}</>
  return <RoleRedirect />
}
