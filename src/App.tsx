import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Toaster } from 'sonner'
import Layout from '@/components/Layout'

// Pages — Lazy loaded
const Login = lazy(() => import('@/pages/Login'))
const Privacy = lazy(() => import('@/pages/Privacy'))
const Terms = lazy(() => import('@/pages/Terms'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// Vendedor
const VendedorHome = lazy(() => import('@/pages/VendedorHome'))
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
const GerenteTreinamentos = lazy(() => import('@/pages/GerenteTreinamentos'))

// Consultor
const PainelConsultor = lazy(() => import('@/pages/PainelConsultor'))
const Lojas = lazy(() => import('@/pages/Lojas'))
const ConsultorTreinamentos = lazy(() => import('@/pages/ConsultorTreinamentos'))
const ProdutosDigitais = lazy(() => import('@/pages/ProdutosDigitais'))
const ConsultorNotificacoes = lazy(() => import('@/pages/ConsultorNotificacoes'))
const Configuracoes = lazy(() => import('@/pages/Configuracoes'))

const Spinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><Spinner /></div>
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { role } = useAuth()
  if (role === 'consultor') return <Navigate to="/painel" replace />
  if (role === 'gerente') return <Navigate to="/loja" replace />
  return <Navigate to="/home" replace />
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

            {/* Vendedor */}
            <Route path="home" element={<Suspense fallback={<Spinner />}><VendedorHome /></Suspense>} />
            <Route path="checkin" element={<Suspense fallback={<Spinner />}><Checkin /></Suspense>} />
            <Route path="historico" element={<Suspense fallback={<Spinner />}><Historico /></Suspense>} />
            <Route path="ranking" element={<Suspense fallback={<Spinner />}><Ranking /></Suspense>} />
            <Route path="treinamentos" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorTreinamentos />} gerente={<GerenteTreinamentos />} consultor={<ConsultorTreinamentos />} />
            </Suspense>} />
            <Route path="feedback" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<VendedorFeedback />} gerente={<GerenteFeedback />} consultor={<GerenteFeedback />} />
            </Suspense>} />
            <Route path="notificacoes" element={<Suspense fallback={<Spinner />}>
              <RoleSwitch vendedor={<Notificacoes />} gerente={<Notificacoes />} consultor={<ConsultorNotificacoes />} />
            </Suspense>} />
            <Route path="perfil" element={<Suspense fallback={<Spinner />}><Perfil /></Suspense>} />

            {/* Gerente */}
            <Route path="loja" element={<Suspense fallback={<Spinner />}><DashboardLoja /></Suspense>} />
            <Route path="equipe" element={<Suspense fallback={<Spinner />}><Equipe /></Suspense>} />
            <Route path="metas" element={<Suspense fallback={<Spinner />}><GoalManagement /></Suspense>} />
            <Route path="funil" element={<Suspense fallback={<Spinner />}><Funil /></Suspense>} />
            <Route path="pdi" element={<Suspense fallback={<Spinner />}><GerentePDI /></Suspense>} />

            {/* Consultor */}
            <Route path="painel" element={<Suspense fallback={<Spinner />}><PainelConsultor /></Suspense>} />
            <Route path="lojas" element={<Suspense fallback={<Spinner />}><Lojas /></Suspense>} />
            <Route path="produtos" element={<Suspense fallback={<Spinner />}><ProdutosDigitais /></Suspense>} />
            <Route path="configuracoes" element={<Suspense fallback={<Spinner />}><Configuracoes /></Suspense>} />

            <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
          </Route>
        </Routes>
      </Router>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}

function RoleSwitch({ vendedor, gerente, consultor }: { vendedor: React.ReactNode; gerente: React.ReactNode; consultor: React.ReactNode }) {
  const { role } = useAuth()
  if (role === 'consultor') return <>{consultor}</>
  if (role === 'gerente') return <>{gerente}</>
  return <>{vendedor}</>
}
