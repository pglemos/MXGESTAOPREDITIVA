/**
 * Formatadores e labels canônicos da feature Sales Performance.
 * Story 3.3 reconciliada — extraídos de `src/pages/SalesPerformance.tsx` (UX-001).
 */
import { chartSeriesArray } from '@/lib/charts/tokens'

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(value || 0))

export const formatPercent = (value: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0)}%`

/** Story 3.7: paleta canônica de séries (substitui hex hardcoded). */
export const getChartPalette = (): string[] => chartSeriesArray()

export const roleLabels: Record<string, string> = {
  administrador_geral: 'Admin Master',
  administrador_mx: 'Admin MX',
  consultor_mx: 'Consultoria MX',
  dono: 'Donos',
  gerente: 'Gerentes',
  vendedor: 'Vendedores',
  sem_papel: 'Sem papel',
}

export function shortDate(date: string | null) {
  if (!date) return 'Sem atividade'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}
