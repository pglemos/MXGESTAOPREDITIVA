import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import {
  parseConsultingClientModuleArray,
  type ConsultingClientModule,
} from '@/lib/schemas/consulting-client.schema'

export const DEFAULT_CONSULTING_MODULES: Array<Pick<ConsultingClientModule, 'module_key' | 'label' | 'enabled' | 'premium'>> = [
  { module_key: 'diagnostics', label: 'Diagnostico PMR', enabled: true, premium: false },
  { module_key: 'strategic_plan', label: 'Planejamento Estrategico', enabled: true, premium: false },
  { module_key: 'action_plan', label: 'Plano de Acao', enabled: true, premium: false },
  { module_key: 'monthly_close', label: 'Fechamento Mensal', enabled: true, premium: false },
  { module_key: 'daily_tracking', label: 'Acompanhamento Diario', enabled: true, premium: false },
  { module_key: 'dre', label: 'DRE Financeiro', enabled: false, premium: true },
]

export function useConsultingModules(clientId?: string) {
  const { role, profile } = useAuth()
  const [modules, setModules] = useState<ConsultingClientModule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canManage = isPerfilInternoMx(role)

  const fetchModules = useCallback(async () => {
    if (!clientId) {
      setModules([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('modulos_cliente_consultoria')
      .select('*')
      .eq('client_id', clientId)
      .order('module_key', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setModules([])
    } else {
      setModules(parseConsultingClientModuleArray(data || []))
    }
    setLoading(false)
  }, [clientId])

  const upsertModule = useCallback(async (
    moduleKey: ConsultingClientModule['module_key'],
    enabled: boolean,
    notes?: string,
  ) => {
    if (!clientId || !canManage) return { error: 'Apenas perfis MX podem alterar módulos da consultoria.' }
    const defaults = DEFAULT_CONSULTING_MODULES.find((item) => item.module_key === moduleKey)
    const { error: upsertError } = await supabase
      .from('modulos_cliente_consultoria')
      .upsert({
        client_id: clientId,
        module_key: moduleKey,
        label: defaults?.label || moduleKey,
        premium: defaults?.premium || false,
        enabled,
        notes: notes || null,
        configured_by: profile?.id || null,
        configured_at: new Date().toISOString(),
      }, { onConflict: 'client_id,module_key' })

    if (upsertError) return { error: upsertError.message }
    await fetchModules()
    return { error: null }
  }, [canManage, clientId, fetchModules, profile?.id])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  const moduleMap = useMemo(() => {
    const map = new Map(modules.map((item) => [item.module_key, item]))
    return map
  }, [modules])

  const isEnabled = useCallback((moduleKey: ConsultingClientModule['module_key']) => {
    const stored = moduleMap.get(moduleKey)
    if (stored) return stored.enabled
    return DEFAULT_CONSULTING_MODULES.find((item) => item.module_key === moduleKey)?.enabled ?? false
  }, [moduleMap])

  return { modules, moduleMap, loading, error, canManage, isEnabled, upsertModule, refetch: fetchModules }
}
