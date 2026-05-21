import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { AdminPerformanceView } from './views/AdminPerformanceView'
import { StorePerformanceView } from './views/StorePerformanceView'

/**
 * Container shim de Sales Performance.
 * Story 3.3 reconciliada — decompõe `src/pages/SalesPerformance.tsx` (800 LOC)
 * em views/sections/hooks conforme ADR-0050. Zero mudança visual/funcional.
 */
export function SalesPerformance() {
  const { role } = useAuth()
  const isAdmin = isPerfilInternoMx(role)
  return isAdmin ? <AdminPerformanceView /> : <StorePerformanceView />
}

export default SalesPerformance
