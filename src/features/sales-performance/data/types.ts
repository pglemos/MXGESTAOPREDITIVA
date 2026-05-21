import type { useNetworkPerformance } from '@/hooks/useNetworkPerformance'

/** Métricas consolidadas da rede expostas pelo hook `useNetworkPerformance`. */
export type NetworkMetrics = ReturnType<typeof useNetworkPerformance>['metrics']

/** Linha de loja consolidada (slice de `metrics.byStore`). */
export type StoreRow = NetworkMetrics['byStore'][number]

export type FunnelItem = { name: string; value: number; color: string }
export type RoleItem = { name: string; value: number; active: number }
export type ConsultingItem = { name: string; value: number }
