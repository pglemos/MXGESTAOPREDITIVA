import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { DashboardErrorBoundary } from '@/features/dashboard-loja/components/DashboardErrorBoundary'
import { Toaster as OwnerToaster } from '@/components/ui/toaster'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerLiveDataPage from './OwnerLiveDataPage'
import '@/styles/owner-base44-exact.css'

// Espelha o módulo do Dono do Base44 (paths /dono/*) montado dentro do MX.
export default function OwnerModule() {
  const { role } = useAuth()
  if (role !== 'dono') {
    return <Navigate to="/lojas" replace />
  }

  return (
    <DashboardErrorBoundary sectionName="OwnerModule">
      <div className="owner-b44 owner-base44-exact h-full min-h-0">
        <Routes>
          <Route element={<OwnerLayout />}>
            <Route index element={<OwnerLiveDataPage />} />
            <Route path="rotina" element={<OwnerLiveDataPage />} />
            <Route path="decisoes" element={<OwnerLiveDataPage />} />
            <Route path="plano-estrategico" element={<OwnerLiveDataPage />} />
            <Route path="plano-acao" element={<OwnerLiveDataPage />} />
            <Route path="consultoria" element={<OwnerLiveDataPage />} />
            <Route path="departamentos" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/comercial" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/marketing" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/produto-e-estoque" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/pessoas-rh" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/financeiro" element={<OwnerLiveDataPage />} />
            <Route path="departamentos/operacoes" element={<OwnerLiveDataPage />} />
            <Route path="mercado" element={<OwnerLiveDataPage />} />
            <Route path="benchmarking" element={<OwnerLiveDataPage />} />
            <Route path="alertas" element={<OwnerLiveDataPage />} />
            <Route path="agenda" element={<OwnerLiveDataPage />} />
            <Route path="resultados" element={<OwnerLiveDataPage />} />
            <Route path="universidade" element={<OwnerLiveDataPage />} />
            <Route path="*" element={<Navigate to="/dono" replace />} />
          </Route>
        </Routes>
        <OwnerToaster />
      </div>
    </DashboardErrorBoundary>
  )
}
