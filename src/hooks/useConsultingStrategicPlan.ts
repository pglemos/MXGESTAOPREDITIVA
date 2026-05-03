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
      supabase.from('artefatos_gerados_consultoria').select('*').eq('client_id', clientId).order('generated_at', { ascending: false }),
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
    period_start?: string | null
    period_end?: string | null
    status?: string
    artifact?: {
      artifact_type: string
      title: string
      content_md: string
      payload?: Record<string, unknown>
    }
    action_items?: Array<{
      strategic_plan_id?: string | null
      metric_key?: string | null
      action: string
      how?: string | null
      owner_name?: string | null
      due_date?: string | null
      status?: string
      efficacy?: string | null
      priority?: 1 | 2 | 3
      visit_number?: number | null
    }>
  }) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { data: plan, error: insertError } = await supabase.from('planejamentos_estrategicos').insert({
      client_id: clientId,
      title: input.title,
      period_start: input.period_start || null,
      period_end: input.period_end || null,
      status: input.status || 'draft',
      diagnosis_summary: input.diagnosis_summary || null,
      market_comparison: input.market_comparison || {},
      generated_payload: input.generated_payload || {},
      generated_by: profile?.id || null,
    })
      .select('*')
      .single()
    if (insertError) return { error: insertError.message }

    if (input.artifact) {
      const { error: artifactError } = await supabase.from('artefatos_gerados_consultoria').insert({
        client_id: clientId,
        strategic_plan_id: plan.id,
        artifact_type: input.artifact.artifact_type,
        title: input.artifact.title,
        content_md: input.artifact.content_md,
        payload: input.artifact.payload || input.generated_payload || {},
        generated_by: profile?.id || null,
      })
      if (artifactError) return { error: artifactError.message }
    }

    if (input.action_items?.length) {
      const { error: actionsError } = await supabase.from('itens_plano_acao').insert(input.action_items.map((item) => ({
        client_id: clientId,
        strategic_plan_id: plan.id,
        metric_key: item.metric_key || null,
        action: item.action,
        how: item.how || null,
        owner_name: item.owner_name || null,
        due_date: item.due_date || null,
        status: item.status || 'nao_iniciado',
        efficacy: item.efficacy || null,
        priority: item.priority || 2,
        visit_number: item.visit_number || null,
        created_by: profile?.id || null,
      })))
      if (actionsError) return { error: actionsError.message }
    }

    await fetchPlans()
    return { error: null, plan: parseConsultingStrategicPlanArray([plan])[0] }
  }, [clientId, fetchPlans, profile?.id])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  return { plans, artifacts, latestPlan: plans[0] || null, latestArtifact: artifacts[0] || null, loading, error, createPlan, refetch: fetchPlans }
}
