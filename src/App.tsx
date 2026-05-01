import React, { Suspense, lazy, Component, type ReactNode, type ErrorInfo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { Toaster } from 'sonner'
import { MotionConfig } from 'motion/react'
import Layout from '@/components/Layout'
import LegacyModuleShell from '@/components/LegacyModuleShell'
import { slugify } from '@/lib/utils'

// Pages — Lazy loaded
const OAuthHome = lazy(() => import('@/pages/OAuthHome'))
const MXPerformanceLanding = lazy(() => import('@/pages/MXPerformanceLanding'))
const Login = lazy(() => import('@/pages/Login'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Vendedor
const VendedorHome = lazy(() => import('@/pages/VendedorHome'))
const VendedorPDI = lazy(() => import('@/pages/VendedorPDI'))
const Checkin = lazy(() => import('@/pages/Checkin'))
const Historico = lazy(() => import('@/pages/Historico'))
const Ranking = lazy(() => import('@/pages/Ranking'))
const VendedorFeedback = lazy(() => import('@/pages/VendedorFeedback'))
const VendedorTreinamentos = lazy(() => import('@/pages/VendedorTreinamentos'))
const Notificacoes = lazy(() => import('@/pages/Notificacoes'))
const Perfil = lazy(() => import('@/pages/Perfil'))

// Gerente
const DashboardLoja = lazy(() => import('@/pages/DashboardLoja'))
const Equipe = lazy(() => import('@/pages/Equipe'))
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
  const { profile, loading, initialized, supabaseUser } = useAuth()
  const location = useLocation()
  
  // Debug log for auth state
  React.useEffect(() => {
    if (import.meta.env.DEV) console.log('Audit Info [ProtectedRoute]:', { initialized, loading, hasSupabaseUser: !!supabaseUser, hasProfile: !!profile })
  }, [initialized, loading, supabaseUser, profile])

  if (loading || !initialized) return <div className="h-screen flex items-center justify-center bg-mx-black"><Spinner /></div>
  if (!profile) {
    if (import.meta.env.DEV) console.warn('Audit Warn [ProtectedRoute]: No profile found, redirecting to login.')
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function RoleRedirect() {
  const { role, membership } = useAuth()
  if (isPerfilInternoMx(role)) return <Navigate to="/painel" replace />
  if (role === 'dono') return <Navigate to="/lojas" replace />
  if (role === 'gerente') {
    const storeDashboardPath = membership?.store?.name ? `/lojas/${slugify(membership.store.name)}` : '/lojas'
    return <Navigate to={storeDashboardPath} replace />
  }
  return <Navigate to="/home" replace />
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
            <Route path="/privacy" element={<Suspense fallback={<Spinner />}><Privacy /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<Spinner />}><Terms /></Suspense>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="settings" element={<Navigate to="/configuracoes" replace />} />
            <Route path="team" element={<Navigate to="/equipe" replace />} />

            {/* Vendedor */}
            <Route path="home" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorHome />} gerente={<VendedorHome />} dono={<VendedorHome />} admin={<Navigate to="/painel" replace />} />
            </Suspense>} />
            <Route path="lancamento-diario" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Checkin />} gerente={<Checkin />} dono={<Checkin />} admin={<Navigate to="/painel" replace />} />
            </Suspense>} />
            <Route path="historico" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Historico />} gerente={<Historico />} dono={<Historico />} admin={<Navigate to="/painel" replace />} />
            </Suspense>} />
            <Route path="classificacao" element={<Suspense fallback={<Spinner />}><Ranking /></Suspense>} />
            <Route path="treinamentos" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorTreinamentos />} gerente={<GerenteTreinamentos />} dono={<Navigate to="/lojas" replace />} admin={<ConsultorTreinamentos />} />
            </Suspense>} />
            <Route path="devolutivas" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorFeedback />} gerente={<GerenteFeedback />} dono={<GerenteFeedback />} admin={<GerenteFeedback />} />
            </Suspense>} />
            <Route path="notificacoes" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Notificacoes />} gerente={<Notificacoes />} dono={<Notificacoes />} admin={<ConsultorNotificacoes />} />
            </Suspense>} />
            <Route path="perfil" element={<Suspense fallback={<Spinner />}><Perfil /></Suspense>} />

            {/* Gerente */}
            <Route path="lojas/:storeSlug" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<DashboardLoja />} dono={<DashboardLoja />} admin={<DashboardLoja />} />
            </Suspense>} />
            <Route path="equipe" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<Equipe />} dono={<Equipe />} admin={<Equipe />} />
            </Suspense>} />
            <Route path="pdi" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorPDI />} gerente={<GerentePDI />} dono={<GerentePDI />} admin={<GerentePDI />} />
            </Suspense>} />
            <Route path="pdi/:id/print" element={<Suspense fallback={<Spinner />}><PDIPrint /></Suspense>} />
            <Route path="rotina" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<RotinaGerente />} dono={<Navigate to="/lojas" replace />} admin={<RotinaGerente />} />
            </Suspense>} />

            {/* Admin Core */}
            <Route path="painel" element={<Suspense fallback={<Spinner />}><PainelConsultor /></Suspense>} />
            <Route path="lojas" element={<Suspense fallback={<Spinner />}><Lojas /></Suspense>} />
            
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
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<RoleRedirect />} dono={<Navigate to="/lojas" replace />} admin={<Reprocessamento />} />
            </Suspense>} />
            <Route path="relatorio-matinal" element={<Suspense fallback={<Spinner />}><MorningReport /></Suspense>} />
            <Route path="relatorios/performance-vendas" element={<Suspense fallback={<Spinner />}><SalesPerformance /></Suspense>} />
            <Route path="relatorios/performance-vendedor" element={<Suspense fallback={<Spinner />}><SellerPerformance /></Suspense>} />
            <Route path="auditoria" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<AiDiagnostics />} dono={<Navigate to="/lojas" replace />} admin={<AiDiagnostics />} />
            </Suspense>} />

            <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
          </Route>
        </Routes>
      </Router>
      <Toaster richColors position="top-right" />
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
  if (isPerfilInternoMx(role)) return <>{admin}</>
  if (role === 'dono') return <>{dono}</>
  if (role === 'gerente') return <>{gerente}</>
  return <>{vendedor}</>
}
