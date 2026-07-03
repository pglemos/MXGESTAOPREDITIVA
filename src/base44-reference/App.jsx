import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import FechamentoDiario from './pages/FechamentoDiario';
import CentralExecucao from './pages/CentralExecucao';
import FunilVendas from './pages/FunilVendas';
import CarteiraClientes from './pages/CarteiraClientes.jsx';
import Treinamentos from './pages/Treinamentos';
import FeedbackPage from './pages/FeedbackPage';
import PDIPage from './pages/PDIPage';
import Desenvolvimento from './pages/Desenvolvimento';
import Ranking from './pages/Ranking';

import MeuPerfil from './pages/MeuPerfil';
import LiberacaoFechamentoPage from './pages/LiberacaoFechamentoPage';
import Remuneracao from './pages/Remuneracao';
import VendedorDashboard from './pages/VendedorDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-mx-bg">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-mx-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<VendedorDashboard />} />
          <Route path="/vendedor/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/fechamento" element={<FechamentoDiario />} />
          <Route path="/execucao" element={<CentralExecucao />} />
          <Route path="/funil" element={<FunilVendas />} />
          <Route path="/carteira" element={<CarteiraClientes />} />
          <Route path="/treinamentos" element={<Treinamentos />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/pdi" element={<PDIPage />} />
          <Route path="/desenvolvimento" element={<Desenvolvimento />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/vendedor/ranking" element={<Ranking />} />
          <Route path="/perfil" element={<MeuPerfil />} />
          <Route path="/departamento/rh/remuneracao" element={<Remuneracao />} />
          <Route path="/vendedor/dashboard" element={<VendedorDashboard />} />
        </Route>
      </Route>
      <Route path="/liberacao-fechamento" element={<LiberacaoFechamentoPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App