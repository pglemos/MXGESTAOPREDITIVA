import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parseConsultingGeneratedArtifactArray,
  parseConsultingStrategicPlanArray,
  type ConsultingGeneratedArtifact,
  type ConsultingStrategicPlan,
} from '@/lib/schemas/consulting-client.schema'

export function useConsultingStrategicPlan(clientId?: string) {
  const { profile } = useAuth()
  const [plans, setPlans] = useState<ConsultingStrategicPlan[]>([])
  const [artifacts, setArtifacts] = useState<ConsultingGeneratedArtifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    if (!clientId) {
      setPlans([])
      setArtifacts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [plansRes, artifactsRes] = await Promise.all([
      supabase.from('planejamentos_estrategicos').select('*').eq('client_id', clientId).order('generated_at', { ascending: false }),
      supabase.from('consulting_generated_artifacts').select('*').eq('client_id', clientId).order('generated_at', { ascending: false }),
    ])
    const fetchError = plansRes.error || artifactsRes.error
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPlans(parseConsultingStrategicPlanArray(plansRes.data || []))
      setArtifacts(parseConsultingGeneratedArtifactArray(artifactsRes.data || []))
    }
    setLoading(false)
  }, [clientId])

  const createPlan = useCallback(async (input: {
    title: string
    diagnosis_summary?: string
    market_comparison?: Record<string, unknown>
    generated_payload?: Record<string, unknown>
  }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: insertError } = await supabase.from('planejamentos_estrategicos').insert({
      client_id: clientId,
      title: input.title,
      diagnosis_summary: input.diagnosis_summary || null,
      market_comparison: input.market_comparison || {},
      generated_payload: input.generated_payload || {},
      generated_by: profile?.id || null,
    })
    if (insertError) return { error: insertError.message }
    await fetchPlans()
    return { error: null }
  }, [clientId, fetchPlans, profile?.id])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  return { plans, artifacts, latestPlan: plans[0] || null, latestArtifact: artifacts[0] || null, loading, error, createPlan, refetch: fetchPlans }
}

