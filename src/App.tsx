import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Toaster } from 'sonner'
import Layout from '@/components/Layout'
import LegacyModuleShell from '@/components/LegacyModuleShell'

// Pages — Lazy loaded
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
const GoalManagement = lazy(() => import('@/pages/GoalManagement'))
const Funil = lazy(() => import('@/pages/Funil'))
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
const Reprocessamento = lazy(() => import('@/pages/Reprocessamento'))
const AiDiagnostics = lazy(() => import('@/pages/AiDiagnostics'))
const MorningReport = lazy(() => import('@/pages/MorningReport'))
const SalesPerformance = lazy(() => import('@/pages/SalesPerformance'))
const SellerPerformance = lazy(() => import('@/pages/SellerPerformance'))
const Consultoria = lazy(() => import('@/pages/Consultoria'))
const ConsultoriaClientes = lazy(() => import('@/pages/ConsultoriaClientes'))
const ConsultoriaClienteDetalhe = lazy(() => import('@/pages/ConsultoriaClienteDetalhe'))
const ConsultoriaVisitaExecucao = lazy(() => import('@/pages/ConsultoriaVisitaExecucao'))

const Spinner = () => (
  <div className="flex flex-col items-center gap-mx-md">
    <div className="relative w-mx-2xl h-mx-2xl">
      <div className="absolute inset-0 border-4 border-brand-primary/10 rounded-mx-full"></div>
      <div className="absolute inset-0 border-4 border-t-brand-primary rounded-mx-full animate-spin"></div>
    </div>
    <p className="text-mx-tiny font-black text-text-tertiary uppercase tracking-mx-widest animate-pulse">MX PERFORMANCE</p>
  </div>
)

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
  const { role } = useAuth()
  if (role === 'admin') return <Navigate to="/painel" replace />
  if (role === 'dono') return <Navigate to="/lojas" replace />
  if (role === 'gerente') return <Navigate to="/loja" replace />
  return <Navigate to="/home" replace />
}

const GoalManagementRedirect = () => {
  const location = useLocation()
  return <Navigate to={`/metas${location.search}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Suspense fallback={<Spinner />}><Login /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<Spinner />}><Privacy /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<Spinner />}><Terms /></Suspense>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<RoleRedirect />} />
            <Route path="dashboard" element={<RoleRedirect />} />
            <Route path="settings" element={<Navigate to="/configuracoes" replace />} />
            <Route path="funnel" element={<Navigate to="/funil" replace />} />
            <Route path="team" element={<Navigate to="/equipe" replace />} />
            <Route path="training" element={<Navigate to="/treinamentos" replace />} />

            {/* Vendedor */}
            <Route path="home" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorHome />} gerente={<VendedorHome />} dono={<VendedorHome />} admin={<Navigate to="/painel" replace />} />
            </Suspense>} />
            <Route path="checkin" element={<Suspense fallback={<Spinner />}><Checkin /></Suspense>} />
            <Route path="historico" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Historico />} gerente={<Historico />} dono={<Historico />} admin={<Navigate to="/painel" replace />} />
            </Suspense>} />
            <Route path="ranking" element={<Suspense fallback={<Spinner />}><Ranking /></Suspense>} />
            <Route path="treinamentos" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorTreinamentos />} gerente={<GerenteTreinamentos />} dono={<Navigate to="/lojas" replace />} admin={<ConsultorTreinamentos />} />
            </Suspense>} />
            <Route path="feedback" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorFeedback />} gerente={<GerenteFeedback />} dono={<GerenteFeedback />} admin={<GerenteFeedback />} />
            </Suspense>} />
            <Route path="notificacoes" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Notificacoes />} gerente={<Notificacoes />} dono={<Notificacoes />} admin={<ConsultorNotificacoes />} />
            </Suspense>} />
            <Route path="perfil" element={<Suspense fallback={<Spinner />}><Perfil /></Suspense>} />

            {/* Gerente */}
            <Route path="loja" element={<Suspense fallback={<Spinner />}><DashboardLoja /></Suspense>} />
            <Route path="loja/:storeSlug" element={<Suspense fallback={<Spinner />}><DashboardLoja /></Suspense>} />
            <Route path="equipe" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<Equipe />} dono={<Equipe />} admin={<Equipe />} />
            </Suspense>} />
            <Route path="metas" element={<Suspense fallback={<Spinner />}><GoalManagement /></Suspense>} />
            <Route path="goal-management" element={<GoalManagementRedirect />} />
            <Route path="funil" element={<Suspense fallback={<Spinner />}><Funil /></Suspense>} />
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
            
            {/* CRM de Consultoria */}
            <Route path="consultoria">
              <Route index element={<Suspense fallback={<Spinner />}><Consultoria /></Suspense>} />
              <Route path="clientes" element={<Suspense fallback={<Spinner />}><ConsultoriaClientes /></Suspense>} />
              <Route path="clientes/:clientId" element={<Suspense fallback={<Spinner />}><ConsultoriaClienteDetalhe /></Suspense>} />
              <Route path="clientes/:clientId/visitas/:visitNumber" element={<Suspense fallback={<Spinner />}><ConsultoriaVisitaExecucao /></Suspense>} />
            </Route>

            <Route path="produtos" element={<Suspense fallback={<Spinner />}><ProdutosDigitais /></Suspense>} />
            <Route path="configuracoes" element={<Suspense fallback={<Spinner />}><Configuracoes /></Suspense>} />
            <Route path="configuracoes/operacional" element={<Suspense fallback={<Spinner />}><OperationalSettings /></Suspense>} />
            <Route path="configuracoes/reprocessamento" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<Navigate to="/loja" replace />} dono={<Navigate to="/lojas" replace />} admin={<Reprocessamento />} />
            </Suspense>} />
            <Route path="relatorio-matinal" element={<Suspense fallback={<Spinner />}><MorningReport /></Suspense>} />
            <Route path="relatorios/performance-vendas" element={<Suspense fallback={<Spinner />}><SalesPerformance /></Suspense>} />
            <Route path="relatorios/performance-vendedores" element={<Suspense fallback={<Spinner />}><SellerPerformance /></Suspense>} />
            <Route path="auditoria" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Navigate to="/home" replace />} gerente={<AiDiagnostics />} dono={<Navigate to="/lojas" replace />} admin={<AiDiagnostics />} />
            </Suspense>} />

            <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
          </Route>
        </Routes>
      </Router>
      <Toaster richColors position="top-right" />
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
  if (role === 'admin') return <>{admin}</>
  if (role === 'dono') return <>{dono}</>
  if (role === 'gerente') return <>{gerente}</>
  return <>{vendedor}</>
}
