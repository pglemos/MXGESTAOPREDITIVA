import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import type { ExecutiveAlertType } from '@/lib/mx-executive-foundation'
import { scopeToDb } from '../lib/scopeType'

/**
 * Hook do Blitz 48h Dia 2 — T2.
 *
 * Lê os alertas persistidos em `public.alerts` para uma loja específica e expõe
 * as ações `ack` / `resolve` / `dismiss` (RPCs criados na migration Wave 3).
 *
 * NÃO substitui a engine TS `buildCentralMxEngine`: a engine continua sendo
 * usada para alertas derivados em tempo real. Este hook complementa com os
 * alertas persistidos para perfis executivos (master/director/sales_manager
 * /consultant/admin_mx) acompanharem ciclo de vida (open → acknowledged →
 * resolved/dismissed).
 */

export type CentralMxAlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'

export type CentralMxAlertRow = {
  id: string
  scope_type: 'loja' | 'departamento' | 'vendedor' | 'consultor'
  scope_id: string
  type: ExecutiveAlertType
  problem: string
  impact: string
  recommendation: string
  quick_action_label: string | null
  status: CentralMxAlertStatus
  rule_version: string
  metadata: Record<string, unknown> | null
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
  dismissed_at: string | null
}

type FetchOptions = {
  includeResolved?: boolean
  limit?: number
}

export type UseCentralMxAlertsResult = {
  alerts: CentralMxAlertRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  ack: (alertId: string) => Promise<void>
  resolve: (alertId: string) => Promise<void>
  dismiss: (alertId: string, reason?: string) => Promise<void>
  counts: Record<ExecutiveAlertType, number>
}

const EMPTY_COUNTS: Record<ExecutiveAlertType, number> = {
  critical: 0,
  warning: 0,
  positive: 0,
  consultive: 0,
}

export function useCentralMxAlerts(
  storeId: string | null | undefined,
  options: FetchOptions = {},
): UseCentralMxAlertsResult {
  const [alerts, setAlerts] = useState<CentralMxAlertRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!storeId) {
      setAlerts([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const baseQuery = supabase
        .from('alerts')
        .select(
          'id, scope_type, scope_id, type, problem, impact, recommendation, quick_action_label, status, rule_version, metadata, created_at, acknowledged_at, resolved_at, dismissed_at',
        )
        .eq('scope_type', scopeToDb('loja'))
        .eq('scope_id', storeId)
        .order('created_at', { ascending: false })
        .limit(options.limit ?? 100)
      const query = options.includeResolved
        ? baseQuery
        : baseQuery.in('status', ['open', 'acknowledged'])
      const { data, error: rpcError } = await query
      if (rpcError) throw rpcError
      setAlerts((data ?? []) as CentralMxAlertRow[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar alertas'
      setError(message)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [storeId, options.includeResolved, options.limit])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const ack = useCallback(
    async (alertId: string) => {
      try {
        const { error: rpcError } = await supabase.rpc('ack_alert', { p_alert_id: alertId })
        if (rpcError) throw rpcError
        toast.success('Alerta marcado como visto.')
        await fetchAlerts()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível marcar como visto.')
      }
    },
    [fetchAlerts],
  )

  const resolve = useCallback(
    async (alertId: string) => {
      try {
        const { error: rpcError } = await supabase.rpc('resolve_alert', { p_alert_id: alertId })
        if (rpcError) throw rpcError
        toast.success('Alerta resolvido.')
        await fetchAlerts()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível resolver o alerta.')
      }
    },
    [fetchAlerts],
  )

  const dismiss = useCallback(
    async (alertId: string, reason?: string) => {
      try {
        const { error: rpcError } = await supabase.rpc('dismiss_alert', {
          p_alert_id: alertId,
          p_reason: reason ?? null,
        })
        if (rpcError) throw rpcError
        toast.success('Alerta arquivado.')
        await fetchAlerts()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível arquivar o alerta.')
      }
    },
    [fetchAlerts],
  )

  const counts = useMemo<Record<ExecutiveAlertType, number>>(() => {
    if (!alerts.length) return EMPTY_COUNTS
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.type] = (acc[alert.type] ?? 0) + 1
        return acc
      },
      { ...EMPTY_COUNTS },
    )
  }, [alerts])

  return { alerts, loading, error, refresh: fetchAlerts, ack, resolve, dismiss, counts }
}
